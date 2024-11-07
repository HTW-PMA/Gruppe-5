import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { generateText } from './generateText';

interface ChatEntry {
  user: string;
  ai: string;
}

const AIChat = () => {
  const [inputText, setInputText] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);

  const handleSend = async () => {
    if (inputText.trim()) {
      const userMessage = inputText.trim();
      setInputText('');
      setChatHistory((prev) => [...prev, { user: userMessage, ai: 'Denkt nach...' }]);

      try {
        const aiMessage = await generateText(userMessage);
        setChatHistory((prev) =>
          prev.map((entry, i) => (i === prev.length - 1 ? { ...entry, ai: aiMessage } : entry))
        );
      } catch (error) {
        console.error('Fehler beim Abrufen der KI-Antwort:', error);
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
