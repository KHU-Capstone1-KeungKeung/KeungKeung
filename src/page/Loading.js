import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import icon from '../../img/icon.png';

const Loading = ({navigation}) => {
  setTimeout(() => {
    navigation.reset({routes: [{name: 'Monitoring'}]});
  }, 2000);
  return (
    <View style={styles.loading}>
      <Text style={styles.subtitle}>행동감지 AI 펫 CCTV</Text>
      <Image source={icon} style={styles.image} />
      <Text style={styles.title}>킁킁</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
  },
  image: {
    width: '50%',
    marginVertical: 30,
  },
  title: {
    fontSize: 62,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default Loading;
