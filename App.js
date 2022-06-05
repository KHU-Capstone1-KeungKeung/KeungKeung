/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import Master from './src/Master.js';
import Viewer from './src/Viewer.js';
import CreateChannel from './src/CreateChannel';

const App = () => {
  const [localView, setLocalView] = useState('');
  const [remoteView, setRemoteView] = useState('');

  return (
    <SafeAreaView>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <CreateChannel />
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
