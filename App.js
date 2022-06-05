/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {SafeAreaView, ScrollView, View, Button, StyleSheet} from 'react-native';

import * as AWS from 'aws-sdk';
import * as Config from './key';
import Master from './src/Master.js';
import Viewer from './src/Viewer.js';

const App = () => {
  const [localView, setLocalView] = useState('');
  const [remoteView, setRemoteView] = useState('');

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
  };

  return (
    <SafeAreaView>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <View>
            <Button title="Craete Channel" onPress={createSignalingChannel} />
          </View>
          <Master
            localView={localView}
            setLocalView={setLocalView}
            remoteView={remoteView}
            setRemoteView={setRemoteView}
          />
          <Viewer
            localView={localView}
            setLocalView={setLocalView}
            remoteView={remoteView}
            setRemoteView={setRemoteView}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({});

export default App;
