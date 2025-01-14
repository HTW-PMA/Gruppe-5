import React, { useState, useEffect } from 'react';
import { NativeRouter } from 'react-router-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system';
import LoadingScreen from './LoadingScreen';
import StartScreen from './StartScreen';
import MenuScreen from './MenuScreen';
import Setting from './Setting';
import Preferences from './preferences';
import AIChat from './AIChat';
import Error from './error'; // Import the Error component

export type RootStackParamList = {
  StartScreen: undefined;
  MenuScreen: { canteenId: string };
  Setting: undefined;
  Preferences: undefined;
  AIChat: { currentPage: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [currentPage, setCurrentPage] = useState('preferences');

  const checkPreferences = async () => {
    try {
      const preferencesPath = `${FileSystem.documentDirectory}data/preferences.json`;
      const fileInfo = await FileSystem.getInfoAsync(preferencesPath);

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(preferencesPath);
        const preferences = JSON.parse(content);
        setHasPreferences(Object.values(preferences).some((value) => value === true));
      } else {
        setHasPreferences(false);
      }
    } catch (error) {
      Alert.alert(
          'Fehler beim Laden der Präferenzen',
          'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
          [{ text: 'OK', onPress: () => console.log('Preferences Load Error Alert Closed') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    setIsLoading(true);
    checkPreferences();
  };

  useEffect(() => {
    checkPreferences();
  }, []);

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => {}} />;
  }

  return (
      <NativeRouter>
        <View style={{ flex: 1 }}>
          <Error retry={retry} /> {/* Render the Error component */}
          <Stack.Navigator>
            {!hasPreferences && (
                <Stack.Screen
                    name="Preferences"
                    component={Preferences}
                    options={{
                      title: 'Präferenzen',
                    }}
                />
            )}
            <Stack.Screen
                name="StartScreen"
                component={StartScreen}
                options={({ navigation }) => ({
                  title: 'Mensa Liste',
                  headerRight: () => (
                      <TouchableOpacity
                          onPress={() => navigation.navigate('Setting')}
                          style={{ marginRight: 10 }}
                      >
                        <Icon name="settings-outline" size={24} color="#000" />
                      </TouchableOpacity>
                  ),
                })}
            />
            <Stack.Screen
                name="MenuScreen"
                component={MenuScreen}
                options={({ navigation }) => ({
                  title: 'Mensa Menü',
                  headerRight: () => (
                      <TouchableOpacity
                          onPress={() => navigation.navigate('Setting')}
                          style={{ marginRight: 10 }}
                      >
                        <Icon name="settings-outline" size={24} color="#000" />
                      </TouchableOpacity>
                  ),
                })}
            />
            <Stack.Screen
                name="Setting"
                component={Setting}
                options={{
                  title: 'Settings',
                }}
            />
            <Stack.Screen
                name="AIChat"
                component={AIChat}
                options={{
                  title: 'AI Chat',
                }}
                initialParams={{ currentPage }}
            />
          </Stack.Navigator>
        </View>
      </NativeRouter>
  );
};

export default App;
