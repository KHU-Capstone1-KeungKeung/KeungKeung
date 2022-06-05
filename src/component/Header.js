import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import icon from '../../img/back.png';

const Header = ({title, back}) => {
  return (
    <View style={styles.header}>
      {back && <Image source={icon} style={styles.icon} />}
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
  icon: {
    width: 20,
    height: 20,
    position: 'absolute',
    left: 20,
  },
});

export default Header;
