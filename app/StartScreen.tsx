import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StartScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Startbildschirm</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'black',
    fontSize: 24,
  },
});

export default StartScreen;
