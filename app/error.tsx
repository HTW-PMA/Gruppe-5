import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const Error = ({ retry }: { retry: () => void }) => {
    const [isConnected, setIsConnected] = useState(true); // Track connection status

    useEffect(() => {
        const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
            if (!state.isConnected) {
                setIsConnected(false);
                Alert.alert(
                    'Keine Internetverbindung',
                    'Bitte überprüfen Sie Ihre Verbindung.',
                    [{ text: 'OK', onPress: () => console.log('Alert closed') }],
                    { cancelable: true }
                );
            } else {
                setIsConnected(true);
            }
        });

        return () => unsubscribeNetInfo();
    }, []);

    if (isConnected) {
        return null; // Don't render anything if there's no error
    }


};



export default Error;
