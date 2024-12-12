import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from './App';

type MenuScreenRouteProp = RouteProp<RootStackParamList, 'MenuScreen'>;

const MenuScreen = ({ route }: { route: MenuScreenRouteProp }) => {
  const { canteenId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menü</Text>
      <Text style={styles.text}>Canteen ID: {canteenId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default MenuScreen;
