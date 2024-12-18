import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import App from './App';

const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen zur Startseite</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default App;
