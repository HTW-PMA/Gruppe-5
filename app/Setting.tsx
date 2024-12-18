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

// Typdefinitionen
interface LikedCanteen {
  id: string;
  name: string;
  address: string;
}

interface LikedMenu {
  canteenId: string;
  canteenName: string;
  menuId: string;
  menuName: string;
}

interface Canteen {
  id: string;
  name: string;
  address: string;
}

const likedCanteenFilePath = `${FileSystem.documentDirectory}/data/liked_canteens.json`;
const canteenDataFilePath = `${FileSystem.documentDirectory}/data/canteen_data.json`;
const likedMenuFilePath = `${FileSystem.documentDirectory}/data/liked_menus.json`;

const Setting = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [likedCanteens, setLikedCanteens] = useState<LikedCanteen[]>([]);
  const [canteenMap, setCanteenMap] = useState<Record<string, string>>({});
  const [likedMenus, setLikedMenus] = useState<LikedMenu[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      await loadCanteenData();
      await loadLikedCanteens();
      await loadLikedMenus();
    };
    initializeData();
  }, []);

  const loadLikedCanteens = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(likedCanteenFilePath);
      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(likedCanteenFilePath);
        setLikedCanteens(JSON.parse(content));
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Mensen:', error);
    }
  };

  const loadCanteenData = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(canteenDataFilePath);
      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(canteenDataFilePath);
        const canteens: Canteen[] = JSON.parse(content);
        const canteenMapping = canteens.reduce((map, canteen) => {
          map[canteen.id] = canteen.name;
          return map;
        }, {} as Record<string, string>);
        setCanteenMap(canteenMapping);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mensa-Daten:', error);
    }
  };

  const loadLikedMenus = async () => {
    try {
        const fileExists = await FileSystem.getInfoAsync(likedMenuFilePath);
        if (fileExists.exists) {
            const content = await FileSystem.readAsStringAsync(likedMenuFilePath);
            setLikedMenus(JSON.parse(content));
        } else {
            console.log('Die Datei liked_menus.json existiert nicht.');
        }
    } catch (error) {
        console.error('Fehler beim Laden der gespeicherten Gerichte:', error);
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

  const removeLikedCanteen = async (canteenId: string) => {
    const updatedLikes = likedCanteens.filter((item) => item.id !== canteenId);
    setLikedCanteens(updatedLikes);
    await FileSystem.writeAsStringAsync(likedCanteenFilePath, JSON.stringify(updatedLikes));
  };

  const removeLikedMenu = async (menuId: string) => {
    const updatedMenus = likedMenus.filter((item) => item.menuId !== menuId);
    setLikedMenus(updatedMenus);
    await FileSystem.writeAsStringAsync(likedMenuFilePath, JSON.stringify(updatedMenus));
  };

  const sections = [
    'Präferenzen',
    'Gespeicherte Mensen',
    'Gespeicherte Gerichte',
    'Benachrichtigungen',
    'Berechtigungen',
    'Speicherdauer für Chat-Verläufe',
    'Hilfe',
  ];

  return (
    <View style={styles.container}>
      <TextInput style={styles.searchInput} placeholder="Suchen..." />

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
                      <TouchableOpacity onPress={() => removeLikedCanteen(item.id)}>
                        <Ionicons name="heart" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noLikes}>Keine gespeicherten Mensen.</Text>
                )}
              </View>
            )}

                        {/* Gespeicherte Gerichte anzeigen */}
                        {isExpanded && section === 'Gespeicherte Gerichte' && (
              <View style={styles.likedContainer}>
                {likedMenus.length > 0 ? (
                  Object.entries(
                    likedMenus.reduce<Record<string, LikedMenu[]>>((acc, menu) => {
                      const canteenName = canteenMap[menu.canteenId] || 'Unbekannte Mensa';
                      if (!acc[canteenName]) {
                        acc[canteenName] = [];
                      }
                      acc[canteenName].push(menu);
                      return acc;
                    }, {})
                  ).map(([canteenName, menus]) => (
                    <View key={canteenName} style={styles.sectionContainer}>
                      <Text style={styles.canteenName}>{canteenName}</Text>
                      {menus.map((menu) => (
                        <View key={menu.menuId} style={styles.likedItem}>
                          <Text style={styles.canteenAddress}>{menu.menuName}</Text>
                          <TouchableOpacity onPress={() => removeLikedMenu(menu.menuId)}>
                            <Ionicons name="heart" size={24} color="red" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noLikes}>Keine gespeicherten Gerichte.</Text>
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
    marginLeft: 25,
    marginTop: 10,
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
    marginLeft: 10,
  },
  noLikes: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Setting;
