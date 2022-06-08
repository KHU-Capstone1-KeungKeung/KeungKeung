import * as AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';
import {mediaDevices, RTCPeerConnection} from 'react-native-webrtc';
import * as Config from '../../key';

const viewer = {};

const onStatsReport = report => {
  // TODO: Publish stats
};

const getRandomClientId = () => {
  return Math.random().toString(36).substring(2).toUpperCase();
};

export const startViewer = async (
  localView,
  setLocalView,
  remoteView,
  setRemoteView,
  setSelected,
) => {
  viewer.localView = localView;
  viewer.remoteView = remoteView;

  // Create KVS client
  const kinesisVideoClient = new AWS.KinesisVideo({
    region: Config.REGION,
    accessKeyId: Config.ACCESS_KEY_ID,
    secretAccessKey: Config.SECRET_ACCESS_KEY,
    sessionToken: null,
    endpoint: null,
    correctClockSkew: true,
  });

  // Get signaling channel ARN
  const describeSignalingChannelResponse = await kinesisVideoClient

    .describeSignalingChannel({
      ChannelName: Config.CHANNEL_NAME,
    })
    .promise();

  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log('[VIEWER] Channel ARN: ', channelARN);

  // Get signaling channel endpoints
  const getSignalingChannelEndpointResponse = await kinesisVideoClient
    .getSignalingChannelEndpoint({
      ChannelARN: channelARN,
      SingleMasterChannelEndpointConfiguration: {
        Protocols: ['WSS', 'HTTPS'],
        Role: KVSWebRTC.Role.VIEWER,
      },
    })
    .promise();
  const endpointsByProtocol =
    getSignalingChannelEndpointResponse.ResourceEndpointList.reduce(
      (endpoints, endpoint) => {
        endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
        return endpoints;
      },
      {},
    );
  console.log('[VIEWER] Endpoints: ', endpointsByProtocol);

  const kinesisVideoSignalingChannelsClient =
    new AWS.KinesisVideoSignalingChannels({
      region: Config.REGION,
      accessKeyId: Config.ACCESS_KEY_ID,
      secretAccessKey: Config.SECRET_ACCESS_KEY,
      sessionToken: null,
      endpoint: endpointsByProtocol.HTTPS,
      correctClockSkew: true,
    });

  // Get ICE server configuration
  const getIceServerConfigResponse = await kinesisVideoSignalingChannelsClient
    .getIceServerConfig({
      ChannelARN: channelARN,
    })
    .promise();
  const iceServers = [
    {
      urls: `stun:stun.kinesisvideo.${Config.REGION}.amazonaws.com:443`,
    },
  ];
  getIceServerConfigResponse.IceServerList.forEach(iceServer =>
    iceServers.push({
      urls: iceServer.Uris,
      username: iceServer.Username,
      credential: iceServer.Password,
    }),
  );
  console.log('[VIEWER] ICE servers: ', iceServers);

  // Create Signaling Client
  viewer.signalingClient = new KVSWebRTC.SignalingClient({
    channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    clientId: getRandomClientId(),

    role: KVSWebRTC.Role.VIEWER,
    region: Config.REGION,
    credentials: {
      accessKeyId: Config.ACCESS_KEY_ID,
      secretAccessKey: Config.SECRET_ACCESS_KEY,
      sessionToken: null,
    },
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
  });

  const configuration = {
    iceServers,
    iceTransportPolicy: 'all',
  };

  const constraints = {
    video: true,
    audio: true,
  };

  viewer.peerConnection = new RTCPeerConnection(configuration);

  // Poll for connection stats
  viewer.peerConnectionStatsInterval = setInterval(
    () => {
      if (viewer.peerConnection) {
        viewer.peerConnection.getStats().then(onStatsReport)
      }
    },
    1000,
  );

  viewer.signalingClient.on('open', async () => {
    console.log('[VIEWER] Connected to signaling service');

    // Get a stream from the webcam, add it to the peer connection, and display it in the local view.
    // If no video/audio needed, no need to request for the sources.
    // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
    try {
      viewer.localStream = await mediaDevices.getUserMedia(constraints);
      setLocalView(viewer.localStream);
      viewer.peerConnection.addStream(viewer.localStream);
    } catch (e) {
      console.error('[VIEWER] Could not find webcam');
      return;
    }

    // Create an SDP offer to send to the master
    console.log('[VIEWER] Creating SDP offer');
    await viewer.peerConnection.setLocalDescription(
      await viewer.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      }),
    );

    // When trickle ICE is enabled, send the offer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
    console.log('[VIEWER] Sending SDP offer');
    viewer.signalingClient.sendSdpOffer(viewer.peerConnection.localDescription);

    console.log('[VIEWER] Generating ICE candidates');
  });

  viewer.signalingClient.on('sdpAnswer', async answer => {
    // Add the SDP answer to the peer connection
    console.log('[VIEWER] Received SDP answer');
    await viewer.peerConnection.setRemoteDescription(answer);
  });

  viewer.signalingClient.on('iceCandidate', candidate => {
    // Add the ICE candidate received from the MASTER to the peer connection
    console.log('[VIEWER] Received ICE candidate');
    viewer.peerConnection.addIceCandidate(candidate);
  });

  viewer.signalingClient.on('close', () => {
    setRemoteView('');
    setSelected('none');
    console.log('[VIEWER] Disconnected from signaling channel');
  });

  viewer.signalingClient.on('error', error => {
    console.error('[VIEWER] Signaling client error: ', error);
  });

  // Send any ICE candidates to the other peer
  viewer.peerConnection.addEventListener('icecandidate', ({candidate}) => {
    if (candidate) {
      console.log('[VIEWER] Generated ICE candidate');

      // When trickle ICE is enabled, send the ICE candidates as they are generated.
      console.log('[VIEWER] Sending ICE candidate');
      viewer.signalingClient.sendIceCandidate(candidate);
    } else {
      console.log('[VIEWER] All ICE candidates have been generated');
    }
  });

  // As remote tracks are received, add them to the remote view
  viewer.peerConnection.onaddstream = event => {
    console.log('[VIEWER] Received remote track');
    if (remoteView.srcObject) {
      return;
    }
    viewer.remoteStream = event.stream;
    setRemoteView(viewer.remoteStream);
    setSelected('viewer');
  };

  console.log('[VIEWER] Starting viewer connection');
  viewer.signalingClient.open();
};

export const stopViewer = async (
  localView,
  setLocalView,
  remoteView,
  setRemoteView,
  setSelected,
) => {
  console.log('[VIEWER] Stopping viewer connection');
  if (viewer.signalingClient) {
    viewer.signalingClient.close();
    viewer.signalingClient = null;
  }

  if (viewer.peerConnection) {
    viewer.peerConnection.close();
    viewer.peerConnection = null;
  }

  if (viewer.localStream) {
    viewer.localStream.getTracks().forEach(track => track.stop());
    viewer.localStream = null;
  }

  if (viewer.remoteStream) {
    viewer.remoteStream.getTracks().forEach(track => track.stop());
    viewer.remoteStream = null;
  }

  if (viewer.peerConnectionStatsInterval) {
    clearInterval(viewer.peerConnectionStatsInterval);
    viewer.peerConnectionStatsInterval = null;
  }

  if (viewer.localView) {
    viewer.localView = null;
  }

  if (viewer.remoteView) {
    viewer.remoteView = null;
  }

  setLocalView('');
  setRemoteView('');
  setSelected('none');
};
