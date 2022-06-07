/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Monitoring from './src/page/Monitoring';
import Video from './src/page/Video';
import Loading from './src/page/Loading';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Loading"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#fff'},
        }}>
        <Stack.Screen name="Loading" component={Loading} />
        <Stack.Screen name="Monitoring" component={Monitoring} />
        <Stack.Screen name="Video" component={Video} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
