import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system';

// Typdefinition für gespeicherte Mensen
interface LikedCanteen {
  id: string;
  name: string;
  address: string;
}

const likedFilePath = `${FileSystem.documentDirectory}/data/liked_canteens.json`;

const Setting = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [likedCanteens, setLikedCanteens] = useState<LikedCanteen[]>([]);

  useEffect(() => {
    loadLikedCanteens();
  }, []);

  const loadLikedCanteens = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(likedFilePath);
      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(likedFilePath);
        setLikedCanteens(JSON.parse(content)); // JSON-Datei wird als Array von Objekten geladen
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Mensen:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const removeLike = async (canteenId: string) => {
    const updatedLikes = likedCanteens.filter((item) => item.id !== canteenId);
    setLikedCanteens(updatedLikes);
    await FileSystem.writeAsStringAsync(likedFilePath, JSON.stringify(updatedLikes));
  };

  const sections = [
    'Gespeicherte Mensen',
    'Gespeicherte Gerichte',
    'Berechtigungen',
    'Speicherdauer für Chat-Verläufe',
    'Hilfe',
  ];

  return (
    <View style={styles.container}>
      {/* Suchleiste */}
      <TextInput style={styles.searchInput} placeholder="Suchen..." />

      {/* Einstellungsoptionen */}
      {sections.map((section, index) => {
        const isExpanded = expandedSections.has(section);
        return (
          <View key={index} style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section)}
            >
              <Text style={styles.sectionTitle}>{section}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#000"
              />
            </TouchableOpacity>

            {/* Gespeicherte Mensen anzeigen */}
            {isExpanded && section === 'Gespeicherte Mensen' && (
              <View style={styles.likedContainer}>
                {likedCanteens.length > 0 ? (
                  likedCanteens.map((item) => (
                    <View key={item.id} style={styles.likedItem}>
                      <View>
                        <Text style={styles.canteenName}>{item.name}</Text>
                        <Text style={styles.canteenAddress}>{item.address}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeLike(item.id)}>
                        <Ionicons name="heart" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noLikes}>Keine gespeicherten Mensen.</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  likedContainer: {
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionContent: {
    padding: 15,
    backgroundColor: '#fff',
  },
  likedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  canteenName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  canteenAddress: {
    fontSize: 14,
    color: '#666',
  },
  noLikes: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Setting;
