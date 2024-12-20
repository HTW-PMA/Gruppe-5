import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as FileSystem from 'expo-file-system';

const preferencesFilePath = `${FileSystem.documentDirectory}/data/preferences.json`;

// Festgelegte Präferenzoptionen
const preferenceOptions = [
  { id: 'vegan', name: 'Vegan' },
  { id: 'vegetarian', name: 'Vegetarisch' },
  { id: 'high_protein', name: 'Proteinreich' },
  { id: 'low_carb', name: 'Kohlenhydratarm' },
  { id: 'gluten_free', name: 'Glutenfrei' },
  { id: 'lactose_free', name: 'Laktosefrei' },
];

const Preferences = ({ navigation }: { navigation: any }) => {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initializePreferences = async () => {
      try {
        const fileExists = await FileSystem.getInfoAsync(preferencesFilePath);
        if (fileExists.exists) {
          // Präferenzen existieren, navigiere zur Startseite
          const content = await FileSystem.readAsStringAsync(preferencesFilePath);
          setPreferences(JSON.parse(content));
          navigation.replace('StartScreen');
        } else {
          // Präferenzen existieren nicht, initialisiere mit Standardwerten
          const initialPreferences = preferenceOptions.reduce(
            (acc, option) => ({ ...acc, [option.id]: false }),
            {}
          );
          setPreferences(initialPreferences);
          await FileSystem.writeAsStringAsync(preferencesFilePath, JSON.stringify(initialPreferences));
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren der Präferenzen:', error);
      }
    };

    initializePreferences();
  }, []);

  const togglePreference = async (key: string) => {
    const updatedPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(updatedPreferences);
    await FileSystem.writeAsStringAsync(preferencesFilePath, JSON.stringify(updatedPreferences));
  };

  const handleSave = async () => {
    try {
      await FileSystem.writeAsStringAsync(preferencesFilePath, JSON.stringify(preferences));
      navigation.replace('StartScreen'); // Navigiere direkt zur Startseite
    } catch (error) {
      console.error('Fehler beim Speichern der Präferenzen:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wähle deine Präferenzen</Text>
      <FlatList
        data={preferenceOptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.preferenceItem,
              preferences[item.id] ? styles.selected : styles.unselected,
            ]}
            onPress={() => togglePreference(item.id)}
          >
            <Text style={styles.preferenceText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Speichern und fortfahren</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  preferenceItem: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#c8e6c9',
  },
  unselected: {
    backgroundColor: '#f9f9f9',
  },
  preferenceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Preferences;
