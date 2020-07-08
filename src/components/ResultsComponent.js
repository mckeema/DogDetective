import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const choose_color = (accuracy) => {
    if (accuracy >= 0.67) {
        return {color: 'lime'};
    } else if (accuracy >= 0.33) {
        return {color: 'yellow'};
    } else {
        return {color: 'red'};
    }
}

const convert_to_percent = (accuracy) => {
    return (accuracy*100).toFixed(1);
}

class ResultsComponent extends Component {
    constructor(props) {
        super(props);
    };

    render() {
        return (
            <View style={styles.MainView}>
                <TouchableOpacity
                    style={styles.CloseButton}
                    onPress={this.props.setStageWaiting}
                >
                    <Feather name='x' size={48} color='white' />
                </TouchableOpacity>
                <Text style={styles.Text}>
                    <Text style={{fontSize: 36, fontWeight: 'bold'}}>
                        RESULTS{'\n'}
                    </Text>
                    <Text style={{fontSize: 18}}>
                        With <Text style={choose_color(this.props.accuracies[0])}>{convert_to_percent(this.props.accuracies[0])}%</Text> accuracy,
                        we think this is:{'\n'}
                    </Text>
                    <Text style={{fontSize: 18, fontWeight: 'bold'}}>
                        {this.props.predictions[0]}
                    </Text>
                    <Text style={{fontWeight: 'bold'}}>
                        {'\n\n'}Other possibilities:{'\n'}
                    </Text>
                    <Text>
                        {this.props.predictions[1]}, <Text style={choose_color(this.props.accuracies[1])}>{convert_to_percent(this.props.accuracies[1])}%</Text>{'\n'}
                    </Text>
                    <Text>
                        {this.props.predictions[2]}, <Text style={choose_color(this.props.accuracies[2])}>{convert_to_percent(this.props.accuracies[2])}%</Text>{'\n'}
                    </Text>
                    <Text>
                        {this.props.predictions[3]}, <Text style={choose_color(this.props.accuracies[3])}>{convert_to_percent(this.props.accuracies[3])}%</Text>{'\n'}
                    </Text>
                    <Text>
                        {this.props.predictions[4]}, <Text style={choose_color(this.props.accuracies[4])}>{convert_to_percent(this.props.accuracies[4])}%</Text>
                    </Text>
                </Text>
            </View>
        );
    };
};

const styles = StyleSheet.create({
    MainView: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        flexDirection: 'column'
    },
    CloseButton: {
        flex: 1,
        alignSelf: 'flex-end',
        paddingTop: 25,
        paddingRight: 10
    },
    Text: {
        color: 'white',
        flex: 9,
        textAlign: 'center'
    }
});

export default ResultsComponent;
