import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { generateText } from './generateText';

interface ChatEntry {
  user: string;
  ai: string;
}

const AIChat = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const currentPage = route?.params?.currentPage || 'preferences';
  const [inputText, setInputText] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [pageContext, setPageContext] = useState<string>('');

  // Kontext laden
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const dataPath = `${FileSystem.documentDirectory}data/`;
        const currentFilePath = `${dataPath}${currentPage}.json`;
        const preferencesPath = `${dataPath}preferences.json`;

        const currentFileInfo = await FileSystem.getInfoAsync(currentFilePath);
        const preferencesFileInfo = await FileSystem.getInfoAsync(preferencesPath);

        let currentPageData = {};
        let preferencesData = {};

        if (currentFileInfo.exists && !currentFileInfo.isDirectory) {
          const fileContent = await FileSystem.readAsStringAsync(currentFilePath);
          currentPageData = JSON.parse(fileContent);
        }

        if (preferencesFileInfo.exists && !preferencesFileInfo.isDirectory) {
          const preferencesContent = await FileSystem.readAsStringAsync(preferencesPath);
          preferencesData = JSON.parse(preferencesContent);
        }

        const context = `
          Aktuelle Seite: ${currentPage}
          Inhalte: ${JSON.stringify(currentPageData, null, 2)}
          Präferenzen: ${JSON.stringify(preferencesData, null, 2)}
        `;
        setPageContext(context);
      } catch (error) {
        console.error('Fehler beim Laden des Kontexts:', error);
        setPageContext('Fehler beim Laden des Kontexts.');
      }
    };

    fetchContext();
  }, [currentPage]);

  const handleSend = async () => {
    if (inputText.trim()) {
      const userMessage = inputText.trim();
      setInputText('');
      setChatHistory((prev) => [...prev, { user: userMessage, ai: 'Denkt nach...' }]);

      try {
        const aiMessage = await generateText(userMessage, pageContext);
        setChatHistory((prev) =>
          prev.map((entry, i) => (i === prev.length - 1 ? { ...entry, ai: aiMessage } : entry))
        );
      } catch (error) {
        console.error('Fehler beim Abrufen der KI-Antwort:', error);
        setChatHistory((prev) =>
          prev.map((entry, i) => (i === prev.length - 1 ? { ...entry, ai: 'Fehler bei der KI-Antwort.' } : entry))
        );
      }
    }
  };

  return (
    <View style={styles.chatContainer}>
      <ScrollView style={styles.scrollView}>
        {chatHistory.map((entry, index) => (
          <View key={index} style={styles.messageContainer}>
            <Text style={styles.userLabel}>Sie:</Text>
            <Text>{entry.user}</Text>
            <Text style={styles.aiLabel}>KI:</Text>
            <Text>{entry.ai}</Text>
          </View>
        ))}
      </ScrollView>
      <TextInput
        value={inputText}
        onChangeText={setInputText}
        placeholder="Ihre Nachricht"
        style={styles.input}
      />
      <Button title="Senden" onPress={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 10,
  },
  userLabel: {
    fontWeight: 'bold',
  },
  aiLabel: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
});

export default AIChat;
