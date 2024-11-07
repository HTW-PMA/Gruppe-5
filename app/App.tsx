import React, { useState } from 'react';
import { View, Text, Button, Modal, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import AIChat from './AIChat';
import Home from './index';

const App = () => {
  const [isChatVisible, setChatVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Home />
      
      {/* Bottom bar for opening the chat */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => setChatVisible(true)} style={styles.openChatButton}>
          <Text style={styles.buttonText}>KI-Chat öffnen</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for chat window */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isChatVisible}
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Schließen</Text>
          </TouchableOpacity>
          <AIChat />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    // Entfernen von position: 'absolute'
  },
  openChatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    marginTop: 'auto',
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default App;
