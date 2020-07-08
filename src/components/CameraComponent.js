import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import ResultsComponent from './ResultsComponent.js';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';

/*
 *  Makes a base64 string urlsafe as well as removing extraneous newline characters.
 *  The Tensorflow model only accepts urlsafe base64 strings as input.
 */
const make_urlsafe = (b64) => {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '').replace(/(?:\r\n|\r|\n)/g, '');
}

/*
 *  Resize image (maintaining aspect ratio) such that its smaller dimension is 224 pixels
 *  (the size accepted by the model).
 */
const compress_image = async (image) => {
    let manip;
    if (image.width < image.height) {
        manip = await ImageManipulator.manipulateAsync(
            image.uri, [{ resize: { width: 224 } }], { base64: true }
        );
    } else {
        manip = await ImageManipulator.manipulateAsync(
            image.uri, [{ resize: { height: 224 } }], { base64: true }
        );
    }
    
    return manip;
}

class CameraComponent extends Component {
    constructor(props) {
        super(props);
        
        // Needed so function can be called from another component
        this.setStageWaiting = this.setStageWaiting.bind(this);

        this.state = {
            hasCamPermission: false,
            hasRollPermission: true,
            predictions: [],
            accuracies: [],
            stage: 'waiting', // waiting, processing, done
            camType: Camera.Constants.Type.back,
            img_uri: ''
        };

        this.labels = [
            'Afghan Hound', 'African Hunting Dog', 'Airedale', 'American Staffordshire Terrier', 'Appenzeller', 'Australian Terrier', 'Bedlington Terrier', 'Bernese Mountain Dog', 'Blenheim Spaniel', 'Border Collie', 'Border Terrier', 'Boston Bull', 'Bouvier des Flandres', 'Brabancon Griffon', 'Brittany Spaniel', 'Cardigan', 'Chesapeake Bay Retriever', 'Chihuahua', 'Dandie Dinmont', 'Doberman', 'English Foxhound', 'English Setter', 'English Springer', 'Entlebucher', 'Eskimo Dog', 'French Bulldog', 'German Shepherd', 'German Shorthaired Pointer', 'Gordon Setter', 'Great Dane', 'Great Pyrenees', 'Greater Swiss Mountain Dog', 'Ibizan Hound', 'Irish Setter', 'Irish Terrier', 'Irish Water Spaniel', 'Irish Wolfhound', 'Italian Greyhound', 'Japanese Spaniel', 'Kerry Blue Terrier', 'Labrador Retriever', 'Lakeland Terrier', 'Leonberg', 'Lhasa', 'Maltese Dog', 'Mexican Hairless Dog', 'Newfoundland', 'Norfolk Terrier', 'Norwegian Elkhound', 'Norwich Terrier', 'Old English Sheepdog', 'Pekingese', 'Pembroke', 'Pomeranian', 'Rhodesian Ridgeback', 'Rottweiler', 'Saint Bernard', 'Saluki', 'Samoyed', 'Scotch Terrier', 'Scottish Deerhound', 'Sealyham Terrier', 'Shetland Sheepdog', 'Shih-Tzu', 'Siberian Husky', 'Staffordshire Bull Terrier', 'Sussex Spaniel', 'Tibetan Mastiff', 'Tibetan Terrier', 'Walker Hound', 'Weimaraner', 'Welsh Springer Spaniel', 'West Highland White Terrier', 'Yorkshire Terrier', 'Affenpinscher', 'Basenji', 'Basset', 'Beagle', 'Black and Tan Coonhound', 'Bloodhound', 'Bluetick', 'Borzoi', 'Boxer', 'Briard', 'Bull Mastiff', 'Cairn', 'Chow Chow', 'Clumber', 'Cocker Spaniel', 'Collie', 'Curly-Coated Retriever', 'Dhole', 'Dingo', 'Flat-Coated Retriever', 'Giant Schnauzer', 'Golden Retriever', 'Groenendael', 'Keeshond', 'Kelpie', 'Komondor', 'Kuvasz', 'Malamute', 'Malinois', 'Miniature Pinscher', 'Miniature Poodle', 'Miniature Schnauzer', 'Otterhound', 'Papillon', 'Pug', 'Redbone', 'Schipperke', 'Silky Terrier', 'Soft-Coated Wheaten Terrier', 'Standard Poodle', 'Standard Schnauzer', 'Toy Poodle', 'Toy Terrier', 'Vizsla', 'Whippet', 'Wire-Haired Fox Terrier'
        ]
    };

    async componentDidMount() {
        const { status } = await Camera.requestPermissionsAsync();
        this.setState({...this.state, hasCamPermission: status === 'granted'});

        // Only need to acquire camera permissions on iOS
        if (Constants.platform.ios) {
            const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
            this.setState({...this.state, hasRollPermission: status === 'granted'});
            if (status !== 'granted') {
                alert('Camera roll permissions needed to use app on pre-taken pictures.');
            }
        }
    };

    setStageWaiting() {
        this.setState({...this.state, stage: 'waiting'});
    };

    /*
     *  Send base64-encoded image to Tensorflow model and handle error responses
     */
    async make_predictions(photo) {
        return new Promise(async (resolve, reject) => {
            const data = {
                method: 'POST',
                body: JSON.stringify({
                    "instances": [{"input": [make_urlsafe(photo.base64)]}]
                })
            }

            const response = await fetch('http://67.205.170.164:8501/v1/models/dog_breed_base64:predict', data);
            if (response.ok) {
                const json = await response.json();
                this.decode_predictions(json);
                resolve('success');
            } else {
                this.setState({...this.state, stage: 'waiting'});
                alert('Error processing image. Please try again.');
            }
        });
    };

    /*
     *  Tensorflow model only returns accuracies, so this is needed to convert accuracies
     *  to labels.
     */
    decode_predictions(json) {
        this.setState({...this.state, predictions: [], accuracies: []});
        
        let predictions = json['predictions'][0];
        for (var i = 0; i < 5; i++) {
            let acc = Math.max.apply(null, predictions); // Find highest accuracy
            let index = predictions.indexOf(acc) // Find index of highest accuracy
            let pred = this.labels[index];

            this.setState({...this.state, predictions: [...this.state.predictions, pred], accuracies: [...this.state.accuracies, acc]});

            predictions[index] = 0;
        }
    }

    render() {
        if (this.state.hasCamPermission === null || !this.state.hasCamPermission) {
            return <Text style={styles.Text}>No access to camera. Please grant permission.</Text>;
        }
        return (
            <View style={styles.MainView}>
                {this.state.stage === 'waiting' ?
                    <Camera
                        style={styles.Camera}
                        ratio={'16:9'}
                        type={this.state.camType}
                        ref={(ref) => {
                            this.camera = ref;
                        }}
                    >
                        <View style={styles.CamView}>
                            <View style={styles.flipButtonView}>
                                <TouchableOpacity
                                    style={styles.flipButton}
                                    disabled={this.state.stage !== 'waiting'}
                                    onPress={() => {
                                        this.state.camType === Camera.Constants.Type.back
                                            ? this.setState({...this.state, camType: Camera.Constants.Type.front})
                                            : this.setState({...this.state, camType: Camera.Constants.Type.back});
                                    }}
                                >
                                    <Feather name='repeat' size={36} color='white' />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.picButton} 
                                disabled={this.state.stage !== 'waiting'}
                                onPress={async () => {
                                    let photo = await this.camera.takePictureAsync({ base64: true, skipProcessing: true });
                                    this.setState({...this.state, img_uri: photo.uri, stage: 'processing'});
                                    const compressed = await compress_image(photo);
                                    await this.make_predictions(compressed);
                                    this.setState({...this.state, stage: 'done'});
                                }}
                            >
                                <Feather name='circle' size={80} color='white' />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.imgButton}
                                disabled={this.state.stage !== 'waiting'}
                                onPress={async () => {
                                    if (!this.state.hasRollPermission) {
                                        alert('Camera roll permissions needed to use.');
                                        return;
                                    }
                                    let result = await ImagePicker.launchImageLibraryAsync({
                                        allowsMultipleSelection: false,
                                        base64: true
                                    });
                                    if (!result.cancelled) {
                                        this.setState({...this.state, stage: 'processing', img_uri: result.uri});
                                        let compressed = await compress_image(result);
                                        await this.make_predictions(compressed);
                                        this.setState({...this.state, stage: 'done'});
                                    }
                                }}
                            >
                                <Feather name='image' size={36} color='white' />
                            </TouchableOpacity>
                         </View>
                    </Camera>
                : null}
                {this.state.stage === 'processing' ?
                <>
                    <Image
                        style={styles.Image}
                        source={{uri: this.state.img_uri}}
                    />
                    <LottieView
                        autoPlay
                        style={styles.Lottie}
                        source={require('../../assets/loader.json')}
                        resizeMode='center'
                    />
                </>
                : null}
                {this.state.stage === 'done' ?
                <>
                    <Image
                        style={styles.Image}
                        source={{uri: this.state.img_uri}}
                    />
                    <ResultsComponent
                        predictions={this.state.predictions}
                        accuracies={this.state.accuracies}
                        setStageWaiting={this.setStageWaiting}
                    />
                </>
                : null}
            </View>
        );
    };
};

const styles = StyleSheet.create({
    MainView: {
        ...StyleSheet.absoluteFill
    },
    Camera: {
        flex: 1,
    },
    CamView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    picButton: {
        paddingBottom: 5
    },
    Text: {
        color: 'white'
    },
    Lottie: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    flipButton: {
        paddingTop: 25,
        paddingRight: 10
    },
    flipButtonView: {
        flex: 1,
        alignSelf: 'flex-end'
    },
    imgButton: {
        paddingBottom: 20
    },
    Image: {
        ...StyleSheet.absoluteFill
    }
});

export default CameraComponent;
