/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TextInput,
  Button,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';
import {SignalingClient} from 'amazon-kinesis-video-streams-webrtc';
import {mediaDevices, RTCView} from 'react-native-webrtc';
import * as Config from './key';
import Master from './src/Master';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const master = {
    signalingClient: null,
    peerConnectionByClientId: {},
    localStream: null,
    remoteStreams: [],
    localView: null,
    remoteView: null,
    peerConnectionStatsInterval: null,
  };
  const viewer = {
    signalingClient: null,
    peerConnectionByClientId: {},
    localStream: null,
    remoteStreams: [],
    localView: null,
    remoteView: null,
    peerConnectionStatsInterval: null,
  };

  const [localView, setLocalView] = useState('');
  const [remoteView, setRemoteView] = useState('');

  const onStatsReport = (report) => {
    // TODO: Publish stats
  }

  const startMaster = async () => {
    master.localView = localView;
    master.remoteView = remoteView;

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
        urls: `stun:stun.kinesisvideo.${'ap-northeast-2'}.amazonaws.com:443`,
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

    const resolution = {width: {ideal: 1280}, height: {ideal: 720}};
    const constraints = {
      video: true,
      audio: true,
    };

    // Get a stream from the webcam and display it in the local view.
    // If no video/audio needed, no need to request for the sources.
    // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
    try {
      master.localStream = await mediaDevices.getUserMedia(constraints);
      // master.localStream = await navigator.mediaDevices.getUserMedia(
      //   constraints,
      // );
      // localView.srcObject = master.localStream;
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
        master.peerConnectionStatsInterval = setInterval(() => peerConnection.getStats().then(onStatsReport), 1000);
      }

      // Send any ICE candidates to the other peer
      peerConnection.addEventListener('icecandidate', ({ candidate }) => {
        if (candidate) {
          console.log('[MASTER] Generated ICE candidate for client: ' + remoteClientId);

          // When trickle ICE is enabled, send the ICE candidates as they are generated.
          console.log('[MASTER] Sending ICE candidate to client: ' + remoteClientId);
          master.signalingClient.sendIceCandidate(candidate, remoteClientId);
        }
        else {
          console.log('[MASTER] All ICE candidates have been generated for client: ' + remoteClientId);

          // When trickle ICE is disabled, send the answer now that all the ICE candidates have ben generated.
          // if (!formValues.useTrickleICE) {
          //   console.log('[MASTER] Sending SDP answer to client: ' + remoteClientId);
          //   master.signalingClient.sendSdpAnswer(peerConnection.localDescription, remoteClientId);
          // }
        }
      });

      // As remote tracks are received, add them to the remote view
      peerConnection.addEventListener('track', event => {
        console.log('[MASTER] Received remote track from client: ' + remoteClientId);
        if (remoteView.srcObject) {
          return;
        }
        setRemoteView(event.streams[0]);
      });

      // If there's no video/audio, master.localStream will be null. So, we should skip adding the tracks from it.
      if (master.localStream) {
        master.localStream.getTracks().forEach(track => peerConnection.addTrack(track, master.localStream));
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
      master.signalingClient.sendSdpAnswer(peerConnection.localDescription, remoteClientId);

      console.log('[MASTER] Generating ICE candidates for client: ' + remoteClientId);
    });

    master.signalingClient.on('iceCandidate', async (candidate, remoteClientId) => {
      console.log('[MASTER] Received ICE candidate from client: ' + remoteClientId);

      // Add the ICE candidate received from the client to the peer connection
      const peerConnection = master.peerConnectionByClientId[remoteClientId];
      peerConnection.addIceCandidate(candidate);
    });

    master.signalingClient.on('close', () => {
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

    master.remoteStreams.forEach(remoteStream => remoteStream.getTracks().forEach(track => track.stop()));
    master.remoteStreams = [];

    if (master.peerConnectionStatsInterval) {
      clearInterval(master.peerConnectionStatsInterval);
      master.peerConnectionStatsInterval = null;
    }

    if (master.localView) {
      master.localView?.srcObject = null;
    }

    if (master.remoteView) {
      master.remoteView?.srcObject = null;
    }
  }

  const startViewer = async () => {
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
    const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
      endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
      return endpoints;
    }, {});
    console.log('[VIEWER] Endpoints: ', endpointsByProtocol);

    const kinesisVideoSignalingChannelsClient = new AWS.KinesisVideoSignalingChannels({
      region: Config.REGION,
      accessKeyId: Config.ACCESS_KEY_ID,
      secretAccessKey: Config.SECRET_ACCESS_KEY,
      sessionToken: null,
      endpoint: null,
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
        urls: `stun:stun.kinesisvideo.${'ap-northeast-2'}.amazonaws.com:443`,
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

    // Create Signaling Client
    viewer.signalingClient = new KVSWebRTC.SignalingClient({
      channelARN,
      channelEndpoint: endpointsByProtocol.WSS,
      clientId: formValues.clientId,
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

    const resolution = {width: {ideal: 1280}, height: {ideal: 720}};
    const constraints = {
      video: true,
      audio: true,
    };

    viewer.peerConnection = new RTCPeerConnection(configuration);

    // Poll for connection stats
    viewer.peerConnectionStatsInterval = setInterval(() => viewer.peerConnection.getStats().then(onStatsReport), 1000);

    viewer.signalingClient.on('open', async () => {
      console.log('[VIEWER] Connected to signaling service');

      // Get a stream from the webcam, add it to the peer connection, and display it in the local view.
      // If no video/audio needed, no need to request for the sources.
      // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
      try {
        viewer.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        viewer.localStream.getTracks().forEach(track => viewer.peerConnection.addTrack(track, viewer.localStream));
        setLocalView(viewer.localStream);
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
      console.log('[VIEWER] Disconnected from signaling channel');
    });

    viewer.signalingClient.on('error', error => {
      console.error('[VIEWER] Signaling client error: ', error);
    });

    // Send any ICE candidates to the other peer
    viewer.peerConnection.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        console.log('[VIEWER] Generated ICE candidate');

        // When trickle ICE is enabled, send the ICE candidates as they are generated.
        console.log('[VIEWER] Sending ICE candidate');
        viewer.signalingClient.sendIceCandidate(candidate);
      } else {
        console.log('[VIEWER] All ICE candidates have been generated');

        // When trickle ICE is disabled, send the offer now that all the ICE candidates have ben generated.
        // if (!formValues.useTrickleICE) {
        //   console.log('[VIEWER] Sending SDP offer');
        //   viewer.signalingClient.sendSdpOffer(viewer.peerConnection.localDescription);
        // }
      }
    });

    // As remote tracks are received, add them to the remote view
    viewer.peerConnection.addEventListener('track', event => {
      console.log('[VIEWER] Received remote track');
      if (remoteView.srcObject) {
        return;
      }
      viewer.remoteStream = event.streams[0];
      setRemoteView(viewer.remoteStream);
    });

    console.log('[VIEWER] Starting viewer connection');
    viewer.signalingClient.open();
  }

  const stopViewer = async () => {
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
      viewer.localView?.srcObject = null;
      setLocalView('');
    }

    if (viewer.remoteView) {
      viewer.remoteView?.srcObject = null;
      setRemoteView('');
    }
  }

  const createSignalingChannel = async () => {
    // Create KVS client
    const kinesisVideoClient = new AWS.KinesisVideo({
      region: Config.REGION,
      accessKeyId: Config.ACCESS_KEY_ID,
      secretAccessKey: Config.SECRET_ACCESS_KEY,
      sessionToken: null,
      endpoint: null,
    });

    // Get signaling channel ARN
    const describeSignalingChannelResponse = await kinesisVideoClient
        .describeSignalingChannel({
          ChannelName: Config.CHANNEL_NAME,
        })
        .promise();
    const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
    console.log('[CREATE_SIGNALING_CHANNEL] Channel ARN: ', channelARN);
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <View>
            <Button title="Start Master" onPress={startMaster} />
            <Button title="Start Viewer" onPress={startViewer} />
            <Button title="Craete Channel" onPress={createSignalingChannel} />
          </View>
          {localView !== '' && (
            <View>
              <Text>start local streaming</Text>
              <RTCView
                style={{height: 300, width: 300}}
                zOrder={20}
                objectFit={'cover'}
                mirror={true}
                streamURL={localView.toURL()}
              />
            </View>
          )}
          {remoteView !== '' && (
              <View>
                <Text>start remote streaming</Text>
                <RTCView
                    style={{height: 300, width: 300}}
                    zOrder={20}
                    objectFit={'cover'}
                    mirror={false}
                    streamURL={remoteView.toURL()}
                />
              </View>
          )}
          <View>
            <Button title="Stop Master" onPress={stopMaster} />
            <Button title="Stop Viewer" onPress={stopViewer} />
          </View>

          {/* <Master localView={localView.toURL()} /> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
