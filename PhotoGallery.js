import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  Alert, StyleSheet, Dimensions, Modal, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedPhotos, deletePhoto, downloadToGallery } from './photoStorage';

const THUMB = Dimensions.get('window').width / 3 - 4;

export default function PhotoGallery({ onOpenSettings, user }) {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [bio, setBio] = useState('Splashing through life, one puddle at a time 💦');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');

  const bioKey = `bio_${user?.id ?? 'guest'}`;

  useEffect(() => {
    getSavedPhotos().then(setPhotos);
    // Load saved bio
    AsyncStorage.getItem(bioKey).then(saved => {
      if (saved) setBio(saved);
    });
  }, []);

  const saveBio = async () => {
    const trimmed = bioInput.trim();
    if (trimmed) {
      setBio(trimmed);
      await AsyncStorage.setItem(bioKey, trimmed);
    }
    setEditingBio(false);
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: '#e4e1d3' }}>
      {/* Header */}
      <View style={galleryStyles.header}>
        <Image
          source={require('./waddl/Pretty/Top_logo.png')}
          style={galleryStyles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={onOpenSettings} style={galleryStyles.menuButton}>
          <View style={galleryStyles.menuLine} />
          <View style={galleryStyles.menuLine} />
          <View style={galleryStyles.menuLine} />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={galleryStyles.profileSection}>
        <View style={galleryStyles.profilePic}>
          <Image
            source={require('./waddl/Pretty/waddl.png')}
            style={galleryStyles.profileImage}
            resizeMode="cover"
          />
        </View>
        <Text style={galleryStyles.username}>@{user?.username ?? 'Unknown'}</Text>

        {/* Bio */}
        {editingBio ? (
          <View style={galleryStyles.bioEditContainer}>
            <TextInput
              style={galleryStyles.bioInput}
              value={bioInput}
              onChangeText={setBioInput}
              multiline
              maxLength={100}
              autoFocus
              placeholder="Write your bio..."
              placeholderTextColor="#999"
            />
            <View style={galleryStyles.bioEditButtons}>
              <TouchableOpacity
                style={galleryStyles.bioCancelBtn}
                onPress={() => setEditingBio(false)}
              >
                <Text style={galleryStyles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={galleryStyles.bioSaveBtn}
                onPress={saveBio}
              >
                <Text style={galleryStyles.bioSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setBioInput(bio);
              setEditingBio(true);
            }}
          >
            <Text style={galleryStyles.bio}>{bio}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>Take your first puddle photo!</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.uri}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedPhoto(item)} style={styles.thumb}>
              <Image source={{ uri: item.uri }} style={styles.image} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <Modal
          visible={!!selectedPhoto}
          transparent={true}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalCloseArea}
              onPress={() => setSelectedPhoto(null)}
              activeOpacity={1}
            >
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedPhoto);
                }}
              >
                <Text style={styles.actionButtonText}>⬇</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(selectedPhoto);
                  setSelectedPhoto(null);
                }}
              >
                <Text style={styles.actionButtonText}>🗑</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 2 },
  thumb: { width: THUMB, height: THUMB * 1.4, margin: 2 },
  image: { width: '100%', height: '100%', borderRadius: 4 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 80, marginBottom: 15 },
  emptyText: {
    color: '#333',
    fontSize: 20,
    fontFamily: 'LilitaOne_400Regular',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: { width: '100%', height: '80%' },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 28,
    fontFamily: 'LilitaOne_400Regular',
  },
  downloadButton: {
    position: 'absolute',
    bottom: 80,
    left: 30,
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(41,65,44,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(200,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 24 },
});

const galleryStyles = StyleSheet.create({
  header: {
    backgroundColor: '#29412c',
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: { height: 100, width: 300 },
  menuButton: {
    position: 'absolute',
    right: 20,
    top: 35,
    gap: 5,
  },
  menuLine: {
    width: 30,
    height: 4,
    backgroundColor: '#e4e1d3',
    borderRadius: 2,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#e4e1d3',
    borderBottomWidth: 1,
    borderBottomColor: '#d0cdb8',
  },
  profilePic: {
    width: 150,
    height: 150,
    borderRadius: 20,
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%' },
  username: {
    fontSize: 20,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bioEditHint: {
    fontSize: 11,
    fontFamily: 'LilitaOne_400Regular',
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },
  bioEditContainer: {
    width: '80%',
    alignItems: 'center',
    gap: 8,
  },
  bioInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    fontFamily: 'LilitaOne_400Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#d0cdb8',
    textAlign: 'center',
    minHeight: 60,
  },
  bioEditButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bioCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#29412c',
  },
  bioCancelText: {
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    fontSize: 14,
  },
  bioSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#29412c',
  },
  bioSaveText: {
    fontFamily: 'LilitaOne_400Regular',
    color: '#e4e1d3',
    fontSize: 14,
  },
});