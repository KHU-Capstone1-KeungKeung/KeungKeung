import React, {useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Header from '../component/Header';
import createSignalingChannel from '../component/CreateChannel';

const Monitoring = ({navigation, route}) => {
  const [on, setOn] = useState(false);

  return (
    <SafeAreaView>
      <Header title="모니터링" back={false} />
      <View style={styles.Monitoring}>
        {on ? (
          <TouchableOpacity
            style={styles.onButton}
            onPress={() => {
              navigation.navigate({name: 'Video', params: {setOn, data: route.params.data}});
            }}>
            <Text style={styles.onText}>CCTV 작동 중</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              createSignalingChannel();
              setOn(true);
              navigation.navigate({name: 'Video', params: {setOn, data: null}});
            }}>
            <Text style={styles.btnText}>기기 추가 +</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  Monitoring: {
    width: '100%',
    height: '100%',
    paddingTop: 20,
    paddingLeft: 40,
    paddingRight: 40,
  },
  button: {
    width: '100%',
    height: 95,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 12,
      height: 12,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#969696',
    borderColor: '#969696',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  onButton: {
    width: '100%',
    height: 95,
    borderRadius: 20,
    backgroundColor: '#F9C076',
    shadowColor: '#000',
    shadowOffset: {
      width: 12,
      height: 12,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default Monitoring;
