import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);
  // Initialize camera type defensively in case the native module isn't available
  const initialType = (Camera && Camera.Constants && Camera.Constants.Type && Camera.Constants.Type.back) ? Camera.Constants.Type.back : null;
  const [type, setType] = useState(initialType);
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted');

      // optional: permission to save to the media library
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(mediaStatus.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const options = { quality: 0.8, exif: false };
      const photo = await cameraRef.current.takePictureAsync(options);
      setPhotoUri(photo.uri);

      if (mediaPermission) {
        await MediaLibrary.createAssetAsync(photo.uri);
      }
    } catch (e) {
      console.error('takePicture error', e);
    }
  };

  if (hasPermission === null) return <View><Text>Requesting camera permission...</Text></View>;
  if (hasPermission === false) return <View><Text>No access to camera</Text></View>;
  // If Camera native module isn't available, show a helpful message instead of crashing
  if (!Camera || !Camera.Constants) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Camera module not available</Text>
        <Text style={{ textAlign: 'center', color: '#444', marginBottom: 8 }}>
          The native `expo-camera` module appears to be missing or not linked in this build. If you're running on a simulator/emulator
          or using a bare workflow, make sure `expo-camera` is installed and the app was rebuilt.
        </Text>
        <Text style={{ textAlign: 'center', color: '#444', marginBottom: 12 }}>
          Try: npm install expo-camera expo-media-library && npx expo prebuild && npx expo run:ios
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://docs.expo.dev/versions/latest/sdk/camera/')} style={{ backgroundColor: '#4A90E2', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Open expo-camera docs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={type} ref={cameraRef} ratio="16:9" />
      <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => {
          // Guard against missing constants at runtime
          if (!Camera || !Camera.Constants || !Camera.Constants.Type) return;
          setType(t => {
            const back = Camera.Constants.Type.back;
            const front = Camera.Constants.Type.front;
            if (t == null) return back;
            return t === back ? front : back;
          });
        }}>
          <Text style={{ color: 'white', fontSize: 18, marginBottom: 8 }}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePicture} style={{ backgroundColor: 'white', padding: 12, borderRadius: 40 }}>
          <Text>Take Photo</Text>
        </TouchableOpacity>
      </View>
      {photoUri && (
        <Image source={{ uri: photoUri }} style={{ width: 100, height: 100, position: 'absolute', right: 10, top: 10 }} />
      )}
    </View>
  );
}