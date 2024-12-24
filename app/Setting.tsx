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
const preferencesFilePath = `${FileSystem.documentDirectory}/data/preferences.json`;
const chatRetentionFilePath = `${FileSystem.documentDirectory}/data/chat_retention.json`;

const preferenceOptions = [
  { id: 'vegan', name: 'Vegan' },
  { id: 'vegetarian', name: 'Vegetarisch' },
  { id: 'high_protein', name: 'Proteinreich' },
  { id: 'low_carb', name: 'Kohlenhydratarm' },
  { id: 'gluten_free', name: 'Glutenfrei' },
  { id: 'lactose_free', name: 'Laktosefrei' },
];

const Setting = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [likedCanteens, setLikedCanteens] = useState<LikedCanteen[]>([]);
  const [canteenMap, setCanteenMap] = useState<Record<string, string>>({});
  const [likedMenus, setLikedMenus] = useState<LikedMenu[]>([]);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [chatRetentionDays, setChatRetentionDays] = useState<number>(1); // Standardwert: 1 Tag

  useEffect(() => {
    const initializeData = async () => {
      await loadCanteenData();
      await loadLikedCanteens();
      await loadLikedMenus();

      const prefExists = await FileSystem.getInfoAsync(preferencesFilePath);
      if (prefExists.exists) {
        const content = await FileSystem.readAsStringAsync(preferencesFilePath);
        setPreferences(JSON.parse(content));
      } else {
        const defaultPreferences = preferenceOptions.reduce(
          (acc, option) => ({ ...acc, [option.id]: false }),
          {}
        );
        setPreferences(defaultPreferences);
        await FileSystem.writeAsStringAsync(preferencesFilePath, JSON.stringify(defaultPreferences));
      }

      const retentionExists = await FileSystem.getInfoAsync(chatRetentionFilePath);
      if (retentionExists.exists) {
        const retentionContent = await FileSystem.readAsStringAsync(chatRetentionFilePath);
        const parsedRetention = JSON.parse(retentionContent);
        setChatRetentionDays(parsedRetention.chatRetentionDays || 1);
      } else {
        const defaultRetention = { chatRetentionDays: 1 };
        await FileSystem.writeAsStringAsync(chatRetentionFilePath, JSON.stringify(defaultRetention));
        setChatRetentionDays(1);
      }
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

const incrementRetentionDays = async () => {
  if (chatRetentionDays < 7) {
    const newRetentionDays = chatRetentionDays + 1;
    setChatRetentionDays(newRetentionDays);
    await FileSystem.writeAsStringAsync(
      chatRetentionFilePath,
      JSON.stringify({ chatRetentionDays: newRetentionDays })
    );
  }
};

const decrementRetentionDays = async () => {
  if (chatRetentionDays > 1) {
    const newRetentionDays = chatRetentionDays - 1;
    setChatRetentionDays(newRetentionDays);
    await FileSystem.writeAsStringAsync(
      chatRetentionFilePath,
      JSON.stringify({ chatRetentionDays: newRetentionDays })
    );
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

  const togglePreference = async (key: string) => {
    const updatedPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(updatedPreferences);
    await FileSystem.writeAsStringAsync(preferencesFilePath, JSON.stringify(updatedPreferences));
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
              
            {/* Präferenzen anzeigen */}
            {isExpanded && section === 'Präferenzen' && (
              <View style={styles.likedContainer}>
                {Object.entries(preferences).map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.preferenceItem,
                      value ? styles.selected : styles.unselected,
                    ]}
                    onPress={() => togglePreference(key)}
                  >
                    <Text style={styles.preferenceText}>
                      {preferenceOptions.find((option) => option.id === key)?.name || key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          
            {/* Speicherdauer für Chat-Verläufe */}
            {isExpanded && section === 'Speicherdauer für Chat-Verläufe' && (
              <View style={styles.chatRetentionContainer}>
                <Text style={styles.label}>Speicherdauer (Tage):</Text>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={decrementRetentionDays}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.retentionDays}>{chatRetentionDays}</Text>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={incrementRetentionDays}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
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
  chatRetentionContainer: {
    padding: 15,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  retentionDays: {
    fontSize: 18,
    fontWeight: '500',
    marginHorizontal: 20,
  },
  
});

export default Setting;
