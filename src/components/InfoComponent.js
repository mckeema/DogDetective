import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class InfoComponent extends Component {
    render() {
        return (
            <>
            <Text style={styles.header}>
                {this.props.header}
            </Text>
            <View style={styles.hBar} />
            {this.props.body}
            </>
        );
    }
}

const styles = StyleSheet.create({
    hBar: {
        borderBottomColor: 'black',
        borderBottomWidth: 1,
        width: "95%",
        alignSelf: 'center'
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        paddingTop: 10,
        paddingLeft: 10
    }
});
