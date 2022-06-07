import React from 'react';
import {StyleSheet} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const Viewer = ({remoteView}) => {
  return (
    <RTCView
      style={styles.viewer}
      zOrder={20}
      objectFit={'cover'}
      mirror={false}
      streamURL={remoteView.toURL()}
    />
  );
};

const styles = StyleSheet.create({
  viewer: {
    flexBasis: '50%',
  },
});

export default Viewer;
