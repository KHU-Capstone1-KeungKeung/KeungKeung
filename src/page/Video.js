import React, {useState} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import Header from '../component/Header';

const Video = () => {
  return (
    <SafeAreaView>
      <Header title="영상 보기" back />
      <Text>Video</Text>
    </SafeAreaView>
  );
};

export default Video;
