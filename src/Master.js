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

const Master = localView => {
  return (
    <SafeAreaView>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>Master</Text>
        {/* <RTCView streamURL={localView} /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Master;
