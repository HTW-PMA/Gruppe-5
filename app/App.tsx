import React, { useState, useEffect } from 'react';
import { NativeRouter } from 'react-router-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import LoadingScreen from './LoadingScreen';
import StartScreen from './StartScreen';
import MenuScreen from './MenuScreen';
import Setting from './Setting';
import Preferences from './preferences';
import AIChat from './AIChat';

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

  useEffect(() => {
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
        console.error('Fehler beim Laden der Präferenzen:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPreferences();
  }, []);

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => {}} />;
  }

  return (
    <NativeRouter>
      <View style={{ flex: 1 }}>
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
            options={{
              title: 'Mensa Liste',
            }}
          />
          <Stack.Screen
            name="MenuScreen"
            component={MenuScreen}
            options={({ route }) => {
              const canteenId = route.params?.canteenId;
              setCurrentPage(`menus/${canteenId || ''}`);
              return { title: 'Mensa Menü' };
            }}
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
