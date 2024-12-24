import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { generateText } from './generateText';

interface ChatEntry {
  sender: 'user' | 'ai';
  message: string;
}

const AIChat = ({ route }: { route: any }) => {
  const [inputText, setInputText] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [pageContext, setPageContext] = useState<string>('');
  const [defaultMaxAgeInDays, setDefaultMaxAgeInDays] = useState<number>(1); // Standardwert

  // Kontext laden
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const dataPath = `${FileSystem.documentDirectory}data/`;
        const currentFilePath = `${dataPath}currentPage.json`;
        const preferencesPath = `${dataPath}preferences.json`;

        let currentPageData = {};
        let preferencesData = {};

        const currentFileInfo = await FileSystem.getInfoAsync(currentFilePath);
        const preferencesFileInfo = await FileSystem.getInfoAsync(preferencesPath);

        if (currentFileInfo.exists && !currentFileInfo.isDirectory) {
          const fileContent = await FileSystem.readAsStringAsync(currentFilePath);
          currentPageData = JSON.parse(fileContent);
        }

        if (preferencesFileInfo.exists && !preferencesFileInfo.isDirectory) {
          const preferencesContent = await FileSystem.readAsStringAsync(preferencesPath);
          preferencesData = JSON.parse(preferencesContent);
        }

        const context = `
          Aktuelle Seite: ${currentFilePath}
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
  }, []);

  // Laden des Werts von defaultMaxAgeInDays aus der Datei
  useEffect(() => {
    const loadRetentionDays = async () => {
      try {
        const retentionFilePath = `${FileSystem.documentDirectory}data/chat_retention.json`;
        const retentionFileInfo = await FileSystem.getInfoAsync(retentionFilePath);

        if (retentionFileInfo.exists) {
          const retentionContent = await FileSystem.readAsStringAsync(retentionFilePath);
          const parsedRetention = JSON.parse(retentionContent);
          setDefaultMaxAgeInDays(parsedRetention.chatRetentionDays || 1); // Standardwert: 1
          console.log('Geladene Speicherdauer:', parsedRetention.chatRetentionDays); // Debugging-Log
        }
      } catch (error) {
        console.error('Fehler beim Laden der Speicherdauer:', error);
        setDefaultMaxAgeInDays(1); // Fallback auf Standardwert
      }
    };

    loadRetentionDays();
  }, []);

  // Laden des gespeicherten Chatverlaufs
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const savedData = await AsyncStorage.getItem('chatHistory');
        if (savedData) {
          const { chatHistory, savedAt } = JSON.parse(savedData);
          console.log('Geladene Daten:', chatHistory, savedAt); // Debugging-Log

          const currentDate = new Date();
          const savedDate = new Date(savedAt);

          // Berechne die Differenz in Tagen
          const daysDifference = Math.floor(
            (currentDate.getTime() - savedDate.getTime()) / (1000 * 3600 * 24)
          );

          // Prüfe, ob der Chat noch gültig ist
          if (daysDifference > defaultMaxAgeInDays) {
            console.log(`Chatverlauf ist abgelaufen (älter als ${defaultMaxAgeInDays} Tage).`);
            await AsyncStorage.removeItem('chatHistory');
            setChatHistory([]);
          } else {
            setChatHistory(chatHistory);
          }
        } else {
          console.log('Keine gespeicherten Daten gefunden.');
          setChatHistory([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Chatverlaufs:', error);
      }
    };

    loadChatHistory();
  }, [defaultMaxAgeInDays]);

  // Speichern des Chatverlaufs bei jeder Änderung
  useEffect(() => {
    const saveChatHistory = async () => {
      try {
        const savedAt = new Date().toISOString();
        const chatData = { chatHistory, savedAt };

        await AsyncStorage.setItem('chatHistory', JSON.stringify(chatData));
        console.log('Gespeicherte Daten:', chatData); // Debugging-Log
      } catch (error) {
        console.error('Fehler beim Speichern des Chatverlaufs:', error);
      }
    };

    if (chatHistory.length > 0) {
      saveChatHistory();
    }
  }, [chatHistory]);

  // Nachricht senden
  const handleSend = async () => {
    if (inputText.trim()) {
      const userMessage = inputText.trim();
      setInputText('');

      const newChatHistory: ChatEntry[] = [
        ...chatHistory,
        { sender: 'user', message: userMessage },
      ];
      setChatHistory(newChatHistory);

      try {
        const prompt = newChatHistory
          .map((entry) => `${entry.sender}: ${entry.message}`)
          .join('\n') + '\nuser: ' + userMessage;

        const aiMessage = await generateText(prompt, pageContext);

        const updatedHistory: ChatEntry[] = [
          ...newChatHistory,
          { sender: 'ai', message: aiMessage },
        ];

        setChatHistory(updatedHistory);
      } catch (error) {
        console.error('Fehler beim Abrufen der KI-Antwort:', error);

        const updatedHistory: ChatEntry[] = [
          ...newChatHistory,
          { sender: 'ai', message: 'Fehler bei der KI-Antwort.' },
        ];

        setChatHistory(updatedHistory);
      }
    }
  };

  return (
    <View style={styles.chatContainer}>
      <ScrollView style={styles.scrollView}>
        {chatHistory.map((entry, index) => (
          <View key={index} style={styles.messageContainer}>
            <Text style={entry.sender === 'user' ? styles.userLabel : styles.aiLabel}>
              {entry.sender === 'user' ? 'Sie:' : 'KI:'}
            </Text>
            <Text>{entry.message}</Text>
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
    color: 'blue',
  },
  aiLabel: {
    fontWeight: 'bold',
    color: 'green',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
});

export default AIChat;
