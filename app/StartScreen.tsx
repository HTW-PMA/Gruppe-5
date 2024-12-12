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
import { useNavigation, NavigationProp } from '@react-navigation/native';
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

  useEffect(() => {
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

    fetchData();
    fetchLocation();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, filterOptions, userLocation]);

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
        return isOpen || todayHours.length === 0; // Zeige auch, wenn Öffnungszeiten unbekannt sind
      });
    }

    setFilteredCanteens(filtered);
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
  
  const renderCanteen = ({ item }: { item: Canteen }) => {
    const todayIndex = (getDay(new Date()) + 6) % 7;
    const todayHours = item.businessDays[todayIndex]?.businessHours || [];
    const isExpanded = expandedCanteens.has(item.id);
  
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
        <TouchableOpacity onPress={toggleModal} style={styles.filterButton}>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter auswählen</Text>
          <TouchableOpacity
            onPress={() =>
              setFilterOptions((prev) => ({ ...prev, nearest: !prev.nearest }))
            }
          >
            <Text style={styles.modalOption}>
              {filterOptions.nearest ? '☑' : '☐'} Nächst Nähe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
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
    backgroundColor: '#fff',
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
  },
  address: {
    fontSize: 14,
    color: '#555',
  },
  todayHours: {
    fontSize: 14,
    color: '#333',
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
  },
  businessHours: {
    fontSize: 14,
    color: '#555',
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
    
  
});

export default StartScreen;
