import * as AWS from 'aws-sdk';
import * as Config from '../../key';

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

export default createSignalingChannel;
