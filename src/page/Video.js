import React, {useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Header from '../component/Header';

const Video = ({navigation}) => {
  return (
    <SafeAreaView style={styles.Video}>
      <Header title="영상 보기" back navigation={navigation} />
      <View style={styles.main}>
        <View style={styles.video}>
          <Text style={styles.guide}>아래의 역할을 선택해주세요</Text>
        </View>
        <View style={styles.select}>
          <Text style={styles.text}>역할 선택하기</Text>
          <View style={styles.selectView}>
            <TouchableOpacity style={[styles.button, styles.right]}>
              <Text style={styles.btnText}>CCTV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.btnText}>뷰어</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.stop}>
            <Text style={styles.btnText}>종료하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  Video: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  main: {
    display: 'flex',
    flexGrow: 1,
  },
  video: {
    flexBasis: '50%',
    backgroundColor: '#969696',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guide: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  select: {
    flexBasis: '50%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginVertical: 20,
  },
  selectView: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#969696',
    paddingVertical: 10,
    flexGrow: 1,
  },
  right: {
    marginRight: 10,
  },
  btnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#969696',
    textAlign: 'center',
  },
  stop: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#969696',
    paddingVertical: 12,
    width: '50%',
    marginTop: 50,
  },
});

export default Video;
