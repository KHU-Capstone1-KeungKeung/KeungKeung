import React from 'react';
import {SafeAreaView, ScrollView, Button} from 'react-native';
import * as AWS from 'aws-sdk';
import * as Config from '../../key';

const CreateChannel = () => {
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
        <Button title="Craete Channel" onPress={createSignalingChannel} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateChannel;
