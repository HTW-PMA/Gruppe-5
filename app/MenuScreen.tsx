import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Button } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { format, addDays } from 'date-fns';
import { RootStackParamList } from './App';

type MenuScreenRouteProp = RouteProp<RootStackParamList, 'MenuScreen'>;

interface Price {
  priceType: string;
  price: number;
}

interface Additive {
  text: string;
}

interface Badge {
  name: string;
}

interface Meal {
  name: string;
  category: string;
  prices: Price[];
  additives: Additive[];
  badges: Badge[];
  waterBilanz: number;
  co2Bilanz: number;
}

interface DayMenu {
  date: string;
  canteenId: string;
  meals: Meal[];
}

const MenuScreen = ({ route }: { route: MenuScreenRouteProp }) => {
  const { canteenId } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayMenus, setDayMenus] = useState<DayMenu[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedPriceType, setSelectedPriceType] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<{ vegan: boolean; vegetarian: boolean }>({ vegan: false, vegetarian: false });

  const menusFilePath = `${FileSystem.documentDirectory}data/menus/${canteenId}.json`;

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const fileExists = await FileSystem.getInfoAsync(menusFilePath);
        if (!fileExists.exists) {
          console.warn('Menüdatei nicht gefunden:', menusFilePath);
          return;
        }

        const fileContent = await FileSystem.readAsStringAsync(menusFilePath);
        const data: DayMenu[] = JSON.parse(fileContent);
        setDayMenus(data);
      } catch (error) {
        console.error('Fehler beim Laden der Menüdatei:', error);
      }
    };

    fetchMenus();
  }, [canteenId]);

  const handleDateChange = (days: number) => {
    setSelectedDate((prevDate) => addDays(prevDate, days));
  };

  const toggleMenuExpansion = (menuName: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const applyFilters = () => {
    setFilterVisible(false);
  };

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const currentDayMenu = dayMenus.find((menu) => menu.date === formattedDate);

  const filteredMeals = currentDayMenu?.meals.filter((meal) => {
    const matchesSearch =
      meal.name.toLowerCase().includes(searchText.toLowerCase()) ||
      meal.additives.some((additive) =>
        additive.text.toLowerCase().includes(searchText.toLowerCase())
      ) ||
      meal.badges.some((badge) =>
        badge.name.toLowerCase().includes(searchText.toLowerCase())
      );
  
    const matchesPriceType =
      !selectedPriceType ||
      meal.prices.some((price) => price.priceType === selectedPriceType);
  
    const matchesPriceRange =
      (!priceRange.min ||
        meal.prices.some(
          (price) =>
            price.priceType === selectedPriceType &&
            price.price >= parseFloat(priceRange.min)
        )) &&
      (!priceRange.max ||
        meal.prices.some(
          (price) =>
            price.priceType === selectedPriceType &&
            price.price <= parseFloat(priceRange.max)
        ));
  
    const matchesVegan =
      !filterOptions.vegan ||
      meal.badges.some((badge) => badge.name.toLowerCase() === "vegan");
  
    const matchesVegetarian =
      !filterOptions.vegetarian ||
      meal.badges.some((badge) => badge.name.toLowerCase() === "vegetarisch");
  
    return (
      matchesSearch &&
      matchesPriceType &&
      matchesPriceRange &&
      matchesVegan &&
      matchesVegetarian
    );
  });  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleDateChange(-1)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <TouchableOpacity onPress={() => handleDateChange(1)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>&gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Suchen nach Namen, Zusatzstoffen, Besonderheiten"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterButton}>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={filterVisible} animationType="slide">
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filtereinstellungen</Text>
          <Text>Preisbereich:</Text>
          <View style={styles.priceContainer}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              keyboardType="numeric"
              value={priceRange.min}
              onChangeText={(text) => setPriceRange((prev) => ({ ...prev, min: text }))}
            />
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              keyboardType="numeric"
              value={priceRange.max}
              onChangeText={(text) => setPriceRange((prev) => ({ ...prev, max: text }))}
            />
          </View>
          <Text>Preis für:</Text>
          <View style={styles.priceTypeContainer}>
            {['Studierende', 'Angestellte', 'Gäste'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.priceTypeOption,
                  selectedPriceType === type && styles.priceTypeSelected,
                ]}
                onPress={() => setSelectedPriceType(type)}
              >
                <Text
                  style={[
                    styles.priceTypeLabel,
                    selectedPriceType === type && styles.priceTypeLabelSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text>Besonderheiten:</Text>
          {(['vegan', 'vegetarian'] as (keyof typeof filterOptions)[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.customCheckBox,
                filterOptions[option] && styles.customCheckBoxSelected,
              ]}
              onPress={() =>
                setFilterOptions((prev) => ({ ...prev, [option]: !prev[option] }))
              }
            >
              <Text style={styles.customCheckBoxLabel}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <Button title="Anwenden" onPress={applyFilters} />
          <Button title="Schließen" onPress={() => setFilterVisible(false)} />
        </View>
      </Modal>
      {filteredMeals ? (
        <FlatList
          data={filteredMeals}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={({ item }) => {
            const isExpanded = expandedMenus.has(item.name);

            return (
              <View style={styles.menuItem}>
                <TouchableOpacity onPress={() => toggleMenuExpansion(item.name)}>
                  <Text style={styles.menuName}>{item.name}</Text>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.menuDetails}>
                    <Text style={styles.menuCategory}>Kategorie: {item.category}</Text>
                    <Text style={styles.menuPrices}>Preise:</Text>
                    {item.prices.map((price, index) => (
                      <Text key={index} style={styles.priceText}>
                        {price.priceType}: {price.price.toFixed(2)} €
                      </Text>
                    ))}
                    <Text style={styles.menuAdditives}>Zusatzstoffe:</Text>
                    {item.additives.map((additive, index) => (
                      <Text key={index} style={styles.additiveText}>{additive.text}</Text>
                    ))}
                    <Text style={styles.menuBadges}>Besonderheiten:</Text>
                    {item.badges.map((badge, index) => (
                      <Text key={index} style={styles.badgeText}>{badge.name}</Text>
                    ))}
                    <View style={styles.bilanzContainer}>
                      <Text style={styles.menuBilanzLabel}>Wasserbilanz:</Text>
                      <Text style={styles.menuBilanzValue}>{item.waterBilanz} Liter</Text>
                    </View>
                    <View style={styles.bilanzContainer}>
                      <Text style={styles.menuBilanzLabel}>CO₂-Bilanz:</Text>
                      <Text style={styles.menuBilanzValue}>{item.co2Bilanz} g</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <Text style={styles.noMenuText}>Keine Menüs für das ausgewählte Datum verfügbar.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 18,
    color: '#007AFF',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  customCheckBox: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  customCheckBoxSelected: {
    backgroundColor: '#007AFF',
  },
  customCheckBoxLabel: {
    color: '#333',
  },
  menuItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuDetails: {
    marginTop: 10,
  },
  menuCategory: {
    fontStyle: 'italic',
    marginBottom: 5,
  },
  menuPrices: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  priceText: {
    marginLeft: 10,
  },
  menuAdditives: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  additiveText: {
    marginLeft: 10,
  },
  menuBadges: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  badgeText: {
    marginLeft: 10,
  },
  bilanzContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 2,
    marginLeft: 10,
  },
  menuBilanzLabel: {
    fontWeight: 'bold',
  },
  menuBilanzValue: {
    marginLeft: 10,
    color: '#555',
  },
  noMenuText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
  },
  priceTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  priceTypeOption: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  priceTypeSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priceTypeLabel: {
    fontSize: 14,
    color: '#333',
  },
  priceTypeLabelSelected: {
    color: '#fff',
  },
  
});

export default MenuScreen;
