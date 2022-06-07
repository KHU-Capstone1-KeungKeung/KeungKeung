import React from 'react';
import {StyleSheet} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const Master = ({localView}) => {
  return (
    <RTCView
      style={styles.cctv}
      zOrder={20}
      objectFit={'cover'}
      mirror={false}
      streamURL={localView.toURL()}
    />
  );
};

const styles = StyleSheet.create({
  cctv: {
    flexBasis: '50%',
  },
});

export default Master;
