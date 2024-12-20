import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Für das Settings-Icon
import * as FileSystem from 'expo-file-system';
import LoadingScreen from './LoadingScreen';
import StartScreen from './StartScreen';
import MenuScreen from './MenuScreen';
import Setting from './Setting';
import Preferences from './preferences';

export type RootStackParamList = {
  StartScreen: undefined;
  MenuScreen: { canteenId: string };
  Setting: undefined;
  Preferences: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);

  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const preferencesPath = `${FileSystem.documentDirectory}/data/preferences.json`;
        const fileInfo = await FileSystem.getInfoAsync(preferencesPath);

        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(preferencesPath);
          const preferences = JSON.parse(content);
          // Überprüfe, ob mindestens eine Präferenz ausgewählt wurde
          setHasPreferences(Object.values(preferences).some((value) => value === true));
        } else {
          setHasPreferences(false); // Keine Präferenzen gefunden
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
    <NavigationContainer independent={true}>
      <Stack.Navigator>
        {!hasPreferences && (
          <Stack.Screen
            name="Preferences"
            component={Preferences}
            options={{ title: 'Präferenzen' }}
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
          options={{ title: 'Setting' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
