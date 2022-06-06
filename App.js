/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Monitoring from './src/page/Monitoring';
import Video from './src/page/Video';

const Stack = createNativeStackNavigator();

const App = () => {
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
