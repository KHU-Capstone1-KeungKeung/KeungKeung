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
    dataChannelByClientId: {},
    localStream: null,
    remoteStreams: [],
    peerConnectionStatsInterval: null,
  };

  const [localView, setLocalView] = useState('');

  const startMaster = async () => {
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
    console.log('[MASTER] Channel ARN: ', channelARN);

    // Get signaling channel endpoints
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

    // Create Signaling Client
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
  };

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
            <Button title="Start Viewer" onPress={() => {}} />
            <Button title="Craete Channel" onPress={() => {}} />
          </View>
          {localView !== '' && (
            <View>
              <Text>start streaming</Text>
              <RTCView
                style={{height: 300, width: 300}}
                zOrder={20}
                objectFit={'cover'}
                mirror={true}
                streamURL={localView.toURL()}
              />
            </View>
          )}

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
