import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CameraComponent from './src/components/CameraComponent';

export default function App() {
    return (
        <View style={styles.container}>
            <CameraComponent />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
