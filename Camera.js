import React, { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './firebase';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet, PanResponder, Platform, ActivityIndicator } from 'react-native';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission] = MediaLibrary.usePermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [previewUri, setPreviewUri] = useState(null);
  const [zoom, setZoom] = useState(0.1);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const lastZoom = useRef(0);
  const lastDistance = useRef(null);

  const getDistance = (touches) => {
    const [a, b] = touches;
    const dx = a.pageX - b.pageX;
    const dy = a.pageY - b.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onPanResponderGrant: (e) => {
        if (e.nativeEvent.touches.length === 2)
          lastDistance.current = getDistance(e.nativeEvent.touches);
      },
      onPanResponderMove: (e) => {
        if (e.nativeEvent.touches.length !== 2) return;
        const dist = getDistance(e.nativeEvent.touches);
        if (lastDistance.current === null) { lastDistance.current = dist; return; }
        const delta = (dist - lastDistance.current) / 400;
        lastDistance.current = dist;
        setZoom(prev => {
          const next = Math.min(1, Math.max(0, prev + delta));
          lastZoom.current = next;
          return next;
        });
      },
      onPanResponderRelease: () => { lastDistance.current = null; },
    })
  ).current;

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      // Web needs a short delay for the video feed to be ready
      if (Platform.OS === 'web') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: false });
      setPreviewUri(photo.uri);
      setUploadDone(false);
    } catch (e) {
      console.error('takePicture error', e);
    }
  };

  // Upload photo to Firebase Storage
  const confirmPhoto = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('No Firebase user logged in');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(previewUri);
      const blob = await response.blob();
      const filename = `${Date.now()}.jpg`;
      const photoRef = ref(storage, `photos/${firebaseUser.uid}/${filename}`);
      await uploadBytes(photoRef, blob);
      await getDownloadURL(photoRef);

      setPhotoUri(previewUri);
      setUploadDone(true);
      setPreviewUri(null);
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const retakePhoto = () => {
    setPreviewUri(null);
  };

  if (!permission) return <View><Text>Requesting camera permission...</Text></View>;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontFamily: 'LilitaOne_400Regular', marginBottom: 12 }}>
          Camera access needed
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: '#4A90E2', padding: 10, borderRadius: 8, marginBottom: 8 }}
        >
          <Text style={{ color: 'white', fontFamily: 'LilitaOne_400Regular' }}>
            Grant Camera Permission
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://docs.expo.dev/versions/latest/sdk/camera/')}>
          <Text style={{ color: '#4A90E2', fontFamily: 'LilitaOne_400Regular' }}>expo-camera docs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const zoomLabel = zoom < 0.0075 ? '0.5×' : zoom < 0.05 ? '1×' : '2×';

  // ── PREVIEW SCREEN ──────────────────────────────────────────────
  if (previewUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />

        <View style={styles.logoContainer}>
          <Image
            source={require('./waddl/Pretty/Top_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={previewStyles.actions}>
          <TouchableOpacity onPress={retakePhoto} style={previewStyles.retakeBtn} disabled={uploading}>
            <Text style={previewStyles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmPhoto} style={previewStyles.useBtn} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#e4e1d3" />
            ) : (
              <Text style={previewStyles.useText}>Use Photo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── CAMERA SCREEN ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} ratio="16:9" zoom={zoom} onCameraReady={() => setCameraReady(true)} />

      <View style={styles.logoContainer}>
        <Image
          source={require('./waddl/Pretty/Top_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {uploadDone && (
          <Text style={styles.uploadedBadge}>✓ Photo saved!</Text>
        )}
      </View>

      <View style={StyleSheet.absoluteFill} {...pinchResponder.panHandlers} pointerEvents="box-only" />

      {Platform.OS !== 'web' && (
        <View style={styles.zoomIndicator}>
          <Text style={styles.zoomLabel}>{zoomLabel}</Text>
          <View style={styles.zoomBarTrack}>
            <View style={[styles.zoomBarFill, { width: `${zoom * 100}%` }]} />
          </View>
        </View>
      )}

      {Platform.OS !== 'web' && (
        <View style={styles.zoomContainer}>
          {[0, 0.1, 0.2].map((level) => {
            const isFront = facing === 'front';
            const isUltrawide = level === 0;
            const disabled = isFront && isUltrawide;
            const frontZoom = level === 0 ? null : level === 0.1 ? 0 : 0.1;
            const actualZoom = isFront ? frontZoom : level;
            const label = level === 0 ? '0.5×' : level === 0.1 ? '1×' : '2×';
            return (
              <TouchableOpacity
                key={level}
                onPress={() => !disabled && setZoom(actualZoom)}
                style={[styles.zoomBtn, zoom === actualZoom && styles.zoomBtnActive, disabled && styles.zoomBtnDisabled]}
              >
                <Text style={[styles.zoomText, zoom === actualZoom && styles.zoomTextActive, disabled && styles.zoomTextDisabled]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            setFacing(f => {
              const next = f === 'back' ? 'front' : 'back';
              if (next === 'front') setZoom(0);
              else setZoom(0.1);
              return next;
            });
          }}
        >
          <Text style={styles.flipIcon}>🔄</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={takePicture} style={[styles.captureButton, !cameraReady && { opacity: 0.4 }]} disabled={!cameraReady}>
          <Image
            source={require('./waddl/Pretty/Camera_button.png')}
            style={styles.captureButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {photoUri ? (
          <TouchableOpacity style={styles.thumbnail}>
            <Image source={{ uri: photoUri }} style={styles.thumbnailImage} />
          </TouchableOpacity>
        ) : (
          <View style={styles.thumbnailPlaceholder} />
        )}
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  actions: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  retakeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  retakeText: { color: 'white', fontSize: 18, fontFamily: 'LilitaOne_400Regular' },
  useBtn: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    backgroundColor: '#29412c',
    minWidth: 120,
    alignItems: 'center',
  },
  useText: { color: '#e4e1d3', fontSize: 18, fontFamily: 'LilitaOne_400Regular' },
});

const styles = StyleSheet.create({
  logoContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#29412c',
    paddingTop: 30,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: { height: 100, width: 300 },
  uploadedBadge: {
    color: '#a8e6a3',
    fontSize: 13,
    fontFamily: 'LilitaOne_400Regular',
    marginTop: 4,
  },
  zoomIndicator: {
    position: 'absolute', top: 160,
    alignSelf: 'center', alignItems: 'center', gap: 4,
  },
  zoomLabel: {
    color: 'white', fontSize: 16, fontFamily: 'LilitaOne_400Regular',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  zoomBarTrack: { width: 120, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  zoomBarFill: { height: '100%', backgroundColor: '#e4e1d3', borderRadius: 2 },
  zoomContainer: { position: 'absolute', bottom: 120, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  zoomBtn: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  zoomBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'white' },
  zoomBtnDisabled: { opacity: 0.3 },
  zoomTextDisabled: { color: 'rgba(255,255,255,0.3)' },
  zoomText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'LilitaOne_400Regular' },
  zoomTextActive: { color: 'white' },
  controls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 30 },
  flipButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  flipIcon: { fontSize: 24 },
  captureButton: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  captureButtonImage: { width: 80, height: 80 },
  thumbnail: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'white' },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { width: 50, height: 50 },
});