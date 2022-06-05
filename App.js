/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import Header from './src/component/Header';
import Monitoring from './src/page/Monitoring';
import Master from './src/component/Master';
import Viewer from './src/component/Viewer';
import CreateChannel from './src/component/CreateChannel';

const App = () => {
  const [localView, setLocalView] = useState('');
  const [remoteView, setRemoteView] = useState('');

  return (
    <SafeAreaView style={styles.App}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Header title="모니터링" back={false} />
        <Monitoring />
        {/* <CreateChannel />
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
        /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  App: {
    width: '100%',
    height: '100%',
  },
});

export default App;
