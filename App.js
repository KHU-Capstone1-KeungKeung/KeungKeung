/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Header from './src/component/Header';
import Monitoring from './src/page/Monitoring';
import Video from './src/page/Video';

const Stack = createNativeStackNavigator();

const App = () => {
  const [localView, setLocalView] = useState('');
  const [remoteView, setRemoteView] = useState('');

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Monitoring"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#fff'},
        }}>
        <Stack.Screen name="Monitoring" component={Monitoring} />
        <Stack.Screen name="Video" component={Video} />
      </Stack.Navigator>
    </NavigationContainer>
    // <SafeAreaView style={styles.App}>
    //   <ScrollView contentInsetAdjustmentBehavior="automatic">
    //     <Header title="모니터링" back={false} />
    //     <Monitoring />
    //     {/* <CreateChannel />
    //     <Master
    //       localView={localView}
    //       setLocalView={setLocalView}
    //       remoteView={remoteView}
    //       setRemoteView={setRemoteView}
    //     />
    //     <Viewer
    //       localView={localView}
    //       setLocalView={setLocalView}
    //       remoteView={remoteView}
    //       setRemoteView={setRemoteView}
    //     /> */}
    //   </ScrollView>
    // </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  App: {
    width: '100%',
    height: '100%',
  },
});

export default App;
