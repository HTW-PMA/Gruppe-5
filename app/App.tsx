import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Für das Settings-Icon
import LoadingScreen from './LoadingScreen';
import StartScreen from './StartScreen';
import MenuScreen from './MenuScreen';
import Setting from './Setting';

export type RootStackParamList = {
  StartScreen: undefined;
  MenuScreen: { canteenId: string };
  Setting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <NavigationContainer independent={true}>
      {isLoading ? (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      ) : (
        <Stack.Navigator>
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
      )}
    </NavigationContainer>
  );
};

export default App;
