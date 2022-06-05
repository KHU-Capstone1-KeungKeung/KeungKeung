import React, {useState} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import Header from '../component/Header';

const Monitoring = () => {
  return (
    <SafeAreaView>
      <Header title="모니터링" back={false} />
      <Text>Monitoring</Text>
    </SafeAreaView>
  );
};

export default Monitoring;
