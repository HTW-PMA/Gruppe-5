import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { format, getDay } from 'date-fns';
import { useNavigation, NavigationProp, useFocusEffect  } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from './App'; // Pfad anpassen, falls App.tsx woanders liegt


// Typdefinitionen
interface BusinessHour {
  openAt: string;
  closeAt: string;
  businessHourType: string;
}

interface BusinessDay {
  day: string;
  businessHours: BusinessHour[];
}

interface GeoLocation {
  longitude: number;
  latitude: number;
}

interface Address {
  street: string;
  zipcode: string;
  city: string;
  district: string;
  geoLocation: GeoLocation;
}

interface ContactInfo {
  email: string;
  phone: string;
}

interface Canteen {
  id: string;
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  url: string;
  businessDays: BusinessDay[];
}

const StartScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [likedCanteens, setLikedCanteens] = useState<{ id: string; name: string }[]>([]);
  const [filteredCanteens, setFilteredCanteens] = useState<Canteen[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedCanteens, setExpandedCanteens] = useState<Set<string>>(new Set());
  const [filterOptions, setFilterOptions] = useState({
    nearest: true,
    open: true,
  });
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [useLocation, setUseLocation] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const jsonFilePath = `${FileSystem.documentDirectory}/data/canteen_data.json`;
  const likedFilePath = `${FileSystem.documentDirectory}/data/liked_canteens.json`;

  // Funktionen auslagern
  const fetchData = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(jsonFilePath);
      if (!fileExists.exists) {
        console.warn('Die Datei existiert nicht:', jsonFilePath);
        setCanteens([]);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(jsonFilePath);
      const data: Canteen[] = JSON.parse(fileContent);
      setCanteens(data);
      setFilteredCanteens(data);
    } catch (error) {
      console.error('Fehler beim Laden der JSON-Datei:', error);
    }
  };

  const loadLikedCanteens = async () => {
    try {
      const likedFileExists = await FileSystem.getInfoAsync(likedFilePath);
      if (likedFileExists.exists) {
        const likedContent = await FileSystem.readAsStringAsync(likedFilePath);
        setLikedCanteens(JSON.parse(likedContent));
      } else {
        setLikedCanteens([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Likes:', error);
    }
  };

  const fetchLocation = async () => {
    if (!useLocation) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Standortberechtigung verweigert.');
      setUseLocation(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  // Daten beim Initialrender laden
  useEffect(() => {
    fetchData();
    fetchLocation();
    loadLikedCanteens();
  }, []);

  // Daten neu laden, wenn der Screen fokussiert wird
  useFocusEffect(
    React.useCallback(() => {
      loadLikedCanteens();
    }, [])
  );

  // Filter anwenden
  useEffect(() => {
    applyFilters();
  }, [searchText, filterOptions, userLocation]);

  useEffect(() => {
    const autoNavigateToAIChat = async () => {
      try {
        await navigateToAIChat(); // Automatisch zur AIChat-Seite navigieren
      } catch (error) {
        console.error('Fehler beim automatischen Navigieren zur AIChat-Seite:', error);
      }
    };
  
    autoNavigateToAIChat();
  }, []);  

  const applyFilters = () => {
    let filtered = canteens.filter(
      (canteen) =>
        canteen.name.toLowerCase().includes(searchText.toLowerCase()) ||
        canteen.address.street.toLowerCase().includes(searchText.toLowerCase()) ||
        canteen.address.zipcode.toLowerCase().includes(searchText.toLowerCase()) ||
        canteen.address.city.toLowerCase().includes(searchText.toLowerCase())
    );

    if (filterOptions.nearest && userLocation) {
      filtered = filtered.sort((a, b) => {
        const distanceA = getDistance(userLocation, a.address.geoLocation);
        const distanceB = getDistance(userLocation, b.address.geoLocation);
        return distanceA - distanceB;
      });
    }

    if (filterOptions.open) {
      const todayIndex = (getDay(new Date()) + 6) % 7;
      const now = format(new Date(), 'HH:mm');
      filtered = filtered.filter((canteen) => {
        const todayHours = canteen.businessDays[todayIndex]?.businessHours || [];
        const isOpen = todayHours.some(
          (hours) => hours.openAt <= now && hours.closeAt >= now
        );
        return isOpen || todayHours.length === 0;
      });
    }

    setFilteredCanteens(filtered);
  };

  const toggleLike = async (canteenId: string, canteenName: string) => {
    const isLiked = likedCanteens.some((item) => item.id === canteenId);
    const updatedLikes = isLiked
      ? likedCanteens.filter((item) => item.id !== canteenId)
      : [...likedCanteens, { id: canteenId, name: canteenName }];

    setLikedCanteens(updatedLikes);

    await FileSystem.writeAsStringAsync(likedFilePath, JSON.stringify(updatedLikes));
  };

  const toggleExpand = (canteenId: string) => {
    setExpandedCanteens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(canteenId)) {
        newSet.delete(canteenId);
      } else {
        newSet.add(canteenId);
      }
      return newSet;
    });
  };

  const updateCurrentPage = async (pageName: string) => {
    try {
      const dataPath = `${FileSystem.documentDirectory}data/currentPage.json`;
      await FileSystem.writeAsStringAsync(dataPath, JSON.stringify({ currentPage: pageName }));
      console.log('Aktuelle Seite gespeichert:', pageName);
    } catch (error) {
      console.error('Fehler beim Speichern der aktuellen Seite:', error);
    }
  };  

  const navigateToAIChat = async () => {
    console.log('navigateToAIChat Aufgerufen');
    const pageName = 'canteen_data';
    await updateCurrentPage(pageName); // Update `currentPage.json`
    navigation.navigate('AIChat', { currentPage: pageName });
  };  

  const renderCanteen = ({ item }: { item: Canteen }) => {
    const todayIndex = (getDay(new Date()) + 6) % 7;
    const todayHours = item.businessDays[todayIndex]?.businessHours || [];
    const isExpanded = expandedCanteens.has(item.id);
    const isLiked = likedCanteens.some((likedItem) => likedItem.id === item.id);

    const hasNoBusinessHours = item.businessDays.every(
      (day: BusinessDay) => day.businessHours.length === 0
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MenuScreen', { canteenId: item.id })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>
              {item.address.street}, {item.address.zipcode} {item.address.city}
            </Text>
            <Text style={styles.todayHours}>
              Heute:{' '}
              {hasNoBusinessHours
                ? 'Unbekannt'
                : todayHours.length > 0
                ? todayHours
                    .map(
                      (hours: BusinessHour) =>
                        `${hours.openAt} - ${hours.closeAt} (${hours.businessHourType})`
                    )
                    .join(', ')
                : 'Geschlossen'}
            </Text>
          </View>

          {/* Like-Button hinzufügen */}
          <TouchableOpacity onPress={() => toggleLike(item.id, item.name)}>
            <Ionicons
              style={styles.heart}
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? 'red' : 'black'}
            />
          </TouchableOpacity>

          <Text style={styles.arrow}>›</Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleExpand(item.id)}
          style={styles.expandToggle}
        >
          <Text style={styles.expandArrow}>{isExpanded ? '△' : '▽'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.details}>
            <Text style={styles.businessDays}>Alle Öffnungszeiten:</Text>
            {item.businessDays.map((day: BusinessDay, index: number) => (
              <Text key={index} style={styles.businessHours}>
                {day.day}:{' '}
                {day.businessHours.length > 0
                  ? day.businessHours
                      .map(
                        (hours: BusinessHour) =>
                          `${hours.openAt} - ${hours.closeAt} (${hours.businessHourType})`
                      )
                      .join(', ')
                  : hasNoBusinessHours
                  ? 'Unbekannt'
                  : 'Geschlossen'}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const toggleModal = () => setModalVisible(!isModalVisible);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Suchen..."
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
        />
        <TouchableOpacity onPress={toggleModal} style={styles.filterButton}  >
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter auswählen</Text>
          <TouchableOpacity
              style={styles.filterRow}
            onPress={() =>
              setFilterOptions((prev) => ({ ...prev, nearest: !prev.nearest }))
            }
          >
            <Text style={styles.modalOption}>
              {filterOptions.nearest ? '☑' : '☐'} Nächst Nähe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.filterRow}
            onPress={() =>
              setFilterOptions((prev) => ({ ...prev, open: !prev.open }))
            }
          >
            <Text style={styles.modalOption}>
              {filterOptions.open ? '☑' : '☐'} Offen oder Unbekannt
            </Text>
          </TouchableOpacity>
          <Button title="Schließen" onPress={toggleModal} />
        </View>
      </Modal>

      {filteredCanteens.length > 0 ? (
        <FlatList
          data={filteredCanteens}
          renderItem={renderCanteen}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.noData}>Keine Daten verfügbar</Text>
      )}

      {/* Externer FloatingButton unten rechts */}
      <TouchableOpacity style={styles.floatingButton} onPress={navigateToAIChat}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    backgroundColor: '#ccc', // Light background color for the card look
  
    borderRadius: 8,         // Rounded corners for the card style
    paddingVertical: 15,     // Top and bottom padding for better row spacing
    paddingHorizontal: 15,   // Left and right padding for internal spacing
    marginBottom: 10,        // Space between rows
    flexDirection: 'row',    // Align content horizontally
    alignItems: 'center',    // Center vertically
    justifyContent: 'space-between', // Space between checkbox and text
    elevation: 3,            // Shadow for Android
    shadowColor: '#000',     // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,           // Space between rows
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
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
  searchInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fff',
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  card: {
    backgroundColor:  '#A5D6A7',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  address: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  todayHours: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 5,
  },
  toggleContainer: {
    marginTop: 5,
    alignItems: 'center',
    paddingVertical: 5,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 26,
    color: '#333',
    textAlign: 'center',
  },
  expandToggle: {
    alignItems: 'center',
    marginTop: 10,
  },
  expandArrow: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
  },
  details: {
    marginTop: 10,
  },
  businessDays: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#FFFFFF',
  },
  businessHours: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  noData: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
    marginTop: 20,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {

    fontSize: 18,
    marginBottom: 15,
  },
    navigateButton: {
      marginTop: 10,
      padding: 10,
      backgroundColor: '#007BFF',
      borderRadius: 5,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    heart: {
      marginRight: 20,
    },

});

export default StartScreen;
