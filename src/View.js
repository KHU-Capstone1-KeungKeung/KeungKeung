import React from 'react';
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

import {RTCView} from 'react-native-webrtc';

const Viewer = localView => {
  return (
    <SafeAreaView>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>Viewer</Text>
        {/* <RTCView streamURL={localView} /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Viewer;
