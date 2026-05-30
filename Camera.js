import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: false });
      setPhotoUri(photo.uri);
      if (mediaPermission?.granted) {
        await MediaLibrary.createAssetAsync(photo.uri);
      }
    } catch (e) {
      console.error('takePicture error', e);
    }
  };

  if (!permission) return <View><Text>Requesting camera permission...</Text></View>;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Camera access needed</Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: '#4A90E2', padding: 10, borderRadius: 8, marginBottom: 8 }}>
          <Text style={{ color: 'white' }}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://docs.expo.dev/versions/latest/sdk/camera/')}>
          <Text style={{ color: '#4A90E2' }}>expo-camera docs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} ratio="16:9" />
      <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
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