import React, { useState, useEffect } from 'react';
import { View, Button, Image, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const FLASK_API_URL = 'http://192.168.1.46:5000/predict';

export default function App() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take pictures.');
      }
    })();
  }, []);

  const pickImage = async () => {
    setPrediction(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    setPrediction(null);
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: image,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    try {
      const response = await axios.post(FLASK_API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPrediction(response.data);
    } catch (error) {
      console.error('Prediction error:', error.message);
      Alert.alert('Error', 'Could not contact the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from gallery" onPress={pickImage} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Take a photo" onPress={takePhoto} />

      {image && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Send for prediction" onPress={uploadImage} />
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {prediction && (
        <View style={styles.result}>
          <Text style={styles.resultText}>Produce: {prediction.fruit_type}</Text>
          <Text style={styles.resultText}>Freshness: {prediction.freshness_stage}</Text>
          <Text style={styles.resultText}>Estimated Days Left: {prediction.days_until_rotten} days</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  imagePreview: { marginTop: 20, alignItems: 'center' },
  image: { width: 200, height: 200, marginVertical: 10 },
  result: { marginTop: 20, alignItems: 'center' },
  resultText: { fontSize: 18, marginVertical: 5 },
});
