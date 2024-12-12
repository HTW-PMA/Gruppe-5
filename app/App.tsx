import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoadingScreen from './LoadingScreen';
import StartScreen from './StartScreen';
import MenuScreen from './MenuScreen';

export type RootStackParamList = {
  StartScreen: undefined;
  MenuScreen: { canteenId: string };
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
            options={{ title: 'Mensa Liste' }}
          />
          <Stack.Screen
            name="MenuScreen"
            component={MenuScreen}
            options={{ title: 'Mensa Menü' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default App;
