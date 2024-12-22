import React, { useState, useEffect } from 'react';
import { NativeRouter, Route, Routes } from 'react-router-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
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
  AIChat: { pageContext: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const FloatingButton = ({ currentPage }: { currentPage: string }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handlePress = async () => {
    try {
      const dataPath = `${FileSystem.documentDirectory}data/`;
      const currentFilePath = `${dataPath}${currentPage}.json`;
      const preferencesPath = `${dataPath}preferences.json`;

      const currentFileInfo = await FileSystem.getInfoAsync(currentFilePath);
      const preferencesFileInfo = await FileSystem.getInfoAsync(preferencesPath);

      let currentPageData = {};
      let preferencesData = {};

      // Lade die aktuelle Seite
      if (currentFileInfo.exists && !currentFileInfo.isDirectory) {
        const fileContent = await FileSystem.readAsStringAsync(currentFilePath);
        currentPageData = JSON.parse(fileContent);
      }

      // Lade die Präferenzen
      if (preferencesFileInfo.exists && !preferencesFileInfo.isDirectory) {
        const preferencesContent = await FileSystem.readAsStringAsync(preferencesPath);
        preferencesData = JSON.parse(preferencesContent);
      }

      const pageContext = `
        Aktuelle Seite: ${currentPage}
        Inhalte: ${JSON.stringify(currentPageData, null, 2)}
        Präferenzen: ${JSON.stringify(preferencesData, null, 2)}
      `;

      navigation.navigate('AIChat', { pageContext });
    } catch (error) {
      console.error('Fehler beim Laden der JSON-Dateien:', error);
      navigation.navigate('AIChat', { pageContext: 'Fehler beim Laden der Seite.' });
    }
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
      <Icon name="chatbubble-ellipses-outline" size={28} color="#fff" />
    </TouchableOpacity>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);

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
                headerRight: () => <FloatingButton currentPage="preferences" />,
              }}
            />
          )}
          <Stack.Screen
            name="StartScreen"
            component={StartScreen}
            options={{
              title: 'Mensa Liste',
              headerRight: () => <FloatingButton currentPage="canteen_data" />,
            }}
          />
          <Stack.Screen
            name="MenuScreen"
            component={MenuScreen}
            options={({ route }) => {
              const canteenId = route.params?.canteenId; // Extrahiere die canteenId aus den Parametern
              return {
                title: 'Mensa Menü',
                headerRight: () => (
                  <FloatingButton currentPage={`menus/${canteenId}`} />
                ),
              };
            }}
          />
          <Stack.Screen
            name="Setting"
            component={Setting}
            options={{
              title: 'Setting',
              headerRight: () => <FloatingButton currentPage="setting" />,
            }}
          />
          <Stack.Screen
            name="AIChat"
            component={AIChat}
            options={{
              title: 'AI Chat',
            }}
          />
        </Stack.Navigator>
      </View>
    </NativeRouter>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFA537',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default App;