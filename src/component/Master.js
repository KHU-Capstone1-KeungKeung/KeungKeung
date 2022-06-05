import React from 'react';
import {SafeAreaView, ScrollView, Text, Button, StyleSheet} from 'react-native';
import * as AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';
import {SignalingClient} from 'amazon-kinesis-video-streams-webrtc';
import {mediaDevices, RTCView, RTCPeerConnection} from 'react-native-webrtc';
import * as Config from '../../key';

const master = {
  signalingClient: null,
  peerConnectionByClientId: {},
  localStream: null,
  remoteStreams: [],
  localView: null,
  remoteView: null,
  peerConnectionStatsInterval: null,
};

const onStatsReport = report => {
  // TODO: Publish stats
};

const Master = ({localView, setLocalView, remoteView, setRemoteView}) => {
  const startMaster = async () => {
    // Create KVS client : KVS 클라이언트 생성
    const kinesisVideoClient = new AWS.KinesisVideo({
      region: Config.REGION,
      accessKeyId: Config.ACCESS_KEY_ID,
      secretAccessKey: Config.SECRET_ACCESS_KEY,
      sessionToken: null,
      endpoint: null,
      correctClockSkew: true,
    });

    // Get signaling channel ARN : 생성된 KVS 클라이언트에서 signaling chaneel ARN 가져오기
    const describeSignalingChannelResponse = await kinesisVideoClient
      .describeSignalingChannel({
        ChannelName: Config.CHANNEL_NAME,
      })
      .promise();
    const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
    console.log('[MASTER] Channel ARN: ', channelARN);

    // Get signaling channel endpoints : 생성된 KVS 클라이언트에서 signaling chaneel endpoint 가져오기
    const getSignalingChannelEndpointResponse = await kinesisVideoClient
      .getSignalingChannelEndpoint({
        ChannelARN: channelARN,
        SingleMasterChannelEndpointConfiguration: {
          Protocols: ['WSS', 'HTTPS'],
          Role: KVSWebRTC.Role.MASTER,
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
    console.log('[MASTER] Endpoints: ', endpointsByProtocol);

    // Create Signaling Client : signaling 클라이언트 생성
    master.signalingClient = new SignalingClient({
      channelARN,
      channelEndpoint: endpointsByProtocol.WSS,
      role: KVSWebRTC.Role.MASTER,
      region: Config.REGION,
      credentials: {
        accessKeyId: Config.ACCESS_KEY_ID,
        secretAccessKey: Config.SECRET_ACCESS_KEY,
        sessionToken: null,
      },
      systemClockOffset: kinesisVideoClient.config.systemClockOffset,
    });

    // Get ICE server configuration
    const kinesisVideoSignalingChannelsClient =
      new AWS.KinesisVideoSignalingChannels({
        region: Config.REGION,
        accessKeyId: Config.ACCESS_KEY_ID,
        secretAccessKey: Config.SECRET_ACCESS_KEY,
        sessionToken: null,
        endpoint: endpointsByProtocol.HTTPS,
        correctClockSkew: true,
      });
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
    console.log('[MASTER] ICE servers: ', iceServers);

    const configuration = {
      iceServers,
      iceTransportPolicy: 'all',
    };

    const constraints = {
      video: true,
      audio: true,
    };

    // Get a stream from the webcam and display it in the local view.
    // If no video/audio needed, no need to request for the sources.
    // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
    try {
      master.localStream = await mediaDevices.getUserMedia(constraints);
      setLocalView(master.localStream);
    } catch (e) {
      console.error('[MASTER] Could not find webcam');
    }

    master.signalingClient.on('open', async () => {
      console.log('[MASTER] Connected to signaling service');
    });

    master.signalingClient.on('sdpOffer', async (offer, remoteClientId) => {
      console.log('[MASTER] Received SDP offer from client: ' + remoteClientId);

      // Create a new peer connection using the offer from the given client
      const peerConnection = new RTCPeerConnection(configuration);
      master.peerConnectionByClientId[remoteClientId] = peerConnection;

      // Poll for connection stats
      if (!master.peerConnectionStatsInterval) {
        master.peerConnectionStatsInterval = setInterval(
          () => peerConnection.getStats().then(onStatsReport),
          1000,
        );
      }

      // Send any ICE candidates to the other peer
      peerConnection.addEventListener('icecandidate', ({candidate}) => {
        if (candidate) {
          console.log(
            '[MASTER] Generated ICE candidate for client: ' + remoteClientId,
          );

          // When trickle ICE is enabled, send the ICE candidates as they are generated.
          console.log(
            '[MASTER] Sending ICE candidate to client: ' + remoteClientId,
          );
          master.signalingClient.sendIceCandidate(candidate, remoteClientId);
        } else {
          console.log(
            '[MASTER] All ICE candidates have been generated for client: ' +
              remoteClientId,
          );
        }
      });

      // As remote tracks are received, add them to the remote view
      peerConnection.onaddstream = event => {
        console.log(
          '[MASTER] Received remote track from client: ' + remoteClientId,
        );

        if (remoteView.srcObject) {
          return;
        }
        setRemoteView(event.stream);
      };

      // If there's no video/audio, master.localStream will be null. So, we should skip adding the tracks from it.
      if (master.localStream) {
        peerConnection.addStream(master.localStream);
      }
      await peerConnection.setRemoteDescription(offer);

      // Create an SDP answer to send back to the client
      console.log('[MASTER] Creating SDP answer for client: ' + remoteClientId);
      await peerConnection.setLocalDescription(
        await peerConnection.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        }),
      );

      // When trickle ICE is enabled, send the answer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
      console.log('[MASTER] Sending SDP answer to client: ' + remoteClientId);
      master.signalingClient.sendSdpAnswer(
        peerConnection.localDescription,
        remoteClientId,
      );

      console.log(
        '[MASTER] Generating ICE candidates for client: ' + remoteClientId,
      );
    });

    master.signalingClient.on(
      'iceCandidate',
      async (candidate, remoteClientId) => {
        console.log(
          '[MASTER] Received ICE candidate from client: ' + remoteClientId,
        );

        // Add the ICE candidate received from the client to the peer connection
        const peerConnection = master.peerConnectionByClientId[remoteClientId];
        peerConnection.addIceCandidate(candidate);
      },
    );

    master.signalingClient.on('close', () => {
      setLocalView('');
      console.log('[MASTER] Disconnected from signaling channel');
    });

    master.signalingClient.on('error', () => {
      console.error('[MASTER] Signaling client error');
    });

    console.log('[MASTER] Starting master connection');
    master.signalingClient.open();
  };

  const stopMaster = async () => {
    console.log('[MASTER] Stopping master connection');
    if (master.signalingClient) {
      master.signalingClient.close();
      master.signalingClient = null;
    }

    Object.keys(master.peerConnectionByClientId).forEach(clientId => {
      master.peerConnectionByClientId[clientId].close();
    });
    master.peerConnectionByClientId = [];

    if (master.localStream) {
      master.localStream.getTracks().forEach(track => track.stop());
      master.localStream = null;
    }

    master.remoteStreams.forEach(remoteStream =>
      remoteStream.getTracks().forEach(track => track.stop()),
    );

    master.remoteStreams = [];

    if (master.peerConnectionStatsInterval) {
      clearInterval(master.peerConnectionStatsInterval);
      master.peerConnectionStatsInterval = null;
    }

    if (master.localView) {
      master.localView.srcObject = null;
      setLocalView('');
    }

    if (master.remoteView) {
      master.remoteView.srcObject = null;
    }

    setLocalView('');
    setRemoteView('');
  };

  return (
    <SafeAreaView>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>Master</Text>
        <Button title="Start Master" onPress={startMaster} />
        <Button title="Stop Master" onPress={stopMaster} />
        {localView !== '' && (
          <RTCView
            style={{height: 300, width: 300}}
            zOrder={20}
            objectFit={'cover'}
            mirror={false}
            streamURL={localView.toURL()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({});

export default Master;
