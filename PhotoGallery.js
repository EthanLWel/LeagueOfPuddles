import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  Alert, StyleSheet, Dimensions
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { getSavedPhotos, deletePhoto, downloadToGallery } from './photoStorage';

const THUMB = Dimensions.get('window').width / 3 - 4;

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    getSavedPhotos().then(setPhotos);
  }, []);

  const handleDelete = (photo) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deletePhoto(photo.uri);
          setPhotos(prev => prev.filter(p => p.uri !== photo.uri));
        }
      }
    ]);
  };

  const handleDownload = async (photo) => {
    try {
      await downloadToGallery(photo.uri);
      Alert.alert('Saved', 'Photo saved to your gallery.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No photos yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={item => item.uri}
      numColumns={3}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <View style={styles.thumb}>
          <Image source={{ uri: item.uri }} style={styles.image} />
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleDownload(item)} style={styles.btn}>
              <Text style={styles.btnText}>⬇</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.btn, styles.deleteBtn]}>
              <Text style={styles.btnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: 2 },
  thumb: { width: THUMB, height: THUMB, margin: 2 },
  image: { width: '100%', height: '100%', borderRadius: 4 },
  actions: {
    position: 'absolute', bottom: 4, right: 4,
    flexDirection: 'row', gap: 4
  },
  btn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6, padding: 4
  },
  deleteBtn: { backgroundColor: 'rgba(200,0,0,0.6)' },
  btnText: { fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16 }
});