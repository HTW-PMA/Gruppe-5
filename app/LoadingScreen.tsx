import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { API_KEY } from '@env';
import { addDays, format } from 'date-fns';

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting data fetch...');
        console.log('API_KEY available:', !!API_KEY);

        const dataFolderUri = `${FileSystem.documentDirectory}data/`;
        const menusFolderUri = `${dataFolderUri}menus/`;

        // Ordner erstellen, falls nicht vorhanden
        const folderExists = await FileSystem.getInfoAsync(dataFolderUri);
        if (!folderExists.exists) {
          await FileSystem.makeDirectoryAsync(dataFolderUri, { intermediates: true });
          console.log('Ordner "data" erstellt.');
        }

        const menusFolderExists = await FileSystem.getInfoAsync(menusFolderUri);
        if (!menusFolderExists.exists) {
          await FileSystem.makeDirectoryAsync(menusFolderUri, { intermediates: true });
          console.log('Ordner "menus" erstellt.');
        }

        // 1. Canteens abrufen
        const canteenResponse = await axios.get(
          'https://mensa.gregorflachs.de/api/v1/canteen?loadingtype=lazy',
          {
            headers: {
              'accept': 'application/json',
              'X-API-KEY': API_KEY,
            },
          }
        );
        console.log('Canteen data received successfully');
        const canteens = canteenResponse.data;

        // JSON-Datei mit Canteens speichern
        const canteenFileUri = `${dataFolderUri}canteen_data.json`;
        await FileSystem.writeAsStringAsync(canteenFileUri, JSON.stringify(canteens, null, 2));
        console.log('Canteen data saved at:', canteenFileUri);

        // Existenzprüfung nach dem Speichern
        const fileExists = await FileSystem.getInfoAsync(canteenFileUri);
        console.log('File exists after save:', fileExists.exists);

        // 2. IDs extrahieren und Menüs abrufen
        const startDate = format(addDays(new Date(), -7), 'yyyy-MM-dd'); // 7 Tage in der Vergangenheit
        const endDate = format(addDays(new Date(), 7), 'yyyy-MM-dd'); // 7 Tage in der Zukunft

        for (const canteen of canteens) {
          const canteenId = canteen.id;
          console.log(`Fetching menus for canteen ID: ${canteenId}`);

          try {
            const menuResponse = await axios.get(
              `https://mensa.gregorflachs.de/api/v1/menue?loadingtype=complete&canteenId=${canteenId}&startdate=${startDate}&enddate=${endDate}`,
              {
                headers: {
                  'accept': 'application/json',
                  'X-API-KEY': API_KEY,
                },
              }
            );
            console.log(`Menus received for canteen ID: ${canteenId}`);

            // Speichere Menü-Daten
            const menuFileUri = `${menusFolderUri}${canteenId}.json`;
            await FileSystem.writeAsStringAsync(menuFileUri, JSON.stringify(menuResponse.data, null, 2));
            console.log(`Menus saved at: ${menuFileUri}`);
          } catch (menuError) {
            if (menuError instanceof Error) {
              console.error(`Failed to fetch menus for canteen ID: ${canteenId}`, menuError.message);
            } else {
              console.error(`Unknown error for canteen ID: ${canteenId}`, menuError);
            }
          }
        }

        // Ladebildschirm beenden
        if (onLoadingComplete) {
          onLoadingComplete();
        } else {
          console.error('onLoadingComplete is not defined!');
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Fetch error:', error.message);
        } else {
          console.error('Unknown fetch error:', error);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Daten werden geladen...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default LoadingScreen;
