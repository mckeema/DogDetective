import React, { Component } from 'react';
import { StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';

const monospace = Constants.platform.ios ? 'Menlo' : 'monospace';

export default class LicenseComponent extends Component {
    render() {
        return (
            <>
            <Text style={styles.header}>
                {this.props.licenseName}
            </Text>
            <Text style={styles.license}>
                {this.props.licenseText}
            </Text>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    hBar: {
        borderBottomColor: 'black',
        borderBottomWidth: 1,
        width: "95%",
        alignSelf: 'center'
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingLeft: 10
    },
    license: {
        fontSize: 8,
        fontFamily: monospace,
        paddingLeft: 10,
        paddingBottom: 10
    }
});
