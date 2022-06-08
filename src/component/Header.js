import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import icon from '../../img/back.png';

const Header = ({title, back, navigation, data}) => {
  return (
    <View style={styles.header}>
      {back && (
        <TouchableOpacity
          onPress={() => navigation.navigate({name: 'Monitoring', params: {data}})}
          style={styles.back}>
          <Image source={icon} style={styles.icon} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  back: {
    position: 'absolute',
    left: 20,
  },
  icon: {
    width: 20,
    height: 20,
  },
});

export default Header;
