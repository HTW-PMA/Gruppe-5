import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import LoadingScreen from './LoadingScreen';
import StartScreen from './StartScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    console.log('handleLoadingComplete aufgerufen'); // Hinzugefügt
    setIsLoading(false);
  };

  console.log('isLoading:', isLoading); // Hinzugefügt

  if (isLoading) {
    console.log('Rendering LoadingScreen');
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }
  

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StartScreen />
    </SafeAreaView>
  );
};

export default App;
