import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { generateText } from './generateText';

interface ChatEntry {
  user: string;
  ai: string;
}

const AIChat = ({ route }: { route: any }) => {
  const navigation = useNavigation(); // Für den Zurück-Button
  const pageContext = route?.params?.pageContext || 'Kein Kontext verfügbar';
  const [inputText, setInputText] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);

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
      {/* Zurück-Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back-outline" size={24} color="#000" />
        <Text style={styles.backButtonText}>Zurück</Text>
      </TouchableOpacity>

      {/* Chat-Inhalt */}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
});

export default AIChat;
