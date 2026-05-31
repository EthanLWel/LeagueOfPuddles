import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  Alert, StyleSheet, Dimensions, Modal,
  ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { ref, deleteObject, listAll, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { auth, storage, db } from './firebase';
import RouteMap from './RouteMap';

const THUMB = Dimensions.get('window').width / 3 - 4;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoGallery({ onOpenSettings, user }) {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [bio, setBio] = useState('Splashing through life, one puddle at a time 💦');
  const [pfpUri, setPfpUri] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        loadPhotos(firebaseUser.uid);
        loadProfile(firebaseUser.uid);
      } else {
        setLoadingPhotos(false);
      }
    });
    return unsubscribe;
  }, []);

  const loadPhotos = async (uid) => {
    setLoadingPhotos(true);
    try {
      const userPhotosRef = ref(storage, `photos/${uid}/`);
      const result = await listAll(userPhotosRef);
      const photos = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const filename = item.name;
          let route = null;
          try {
            const metaDoc = await getDoc(doc(db, 'photos', filename));
            if (metaDoc.exists()) route = metaDoc.data().route ?? null;
          } catch (e) {}
          return { uri: url, ref: item.fullPath, filename, route };
        })
      );
      setPhotos(photos.reverse());
    } catch (e) {
      console.error('Failed to load photos:', e);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        if (userDoc.data().bio) setBio(userDoc.data().bio);
        if (userDoc.data().pfpUrl) setPfpUri(userDoc.data().pfpUrl);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const handleDelete = (photo) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const photoRef = ref(storage, photo.ref);
            await deleteObject(photoRef);
            setPhotos(prev => prev.filter(p => p.ref !== photo.ref));
            setSelectedPhoto(null);
          } catch (e) {
            Alert.alert('Error', 'Could not delete photo.');
          }
        }
      }
    ]);
  };

  const openPhoto = (photo) => {
    setSelectedPhoto(photo);
    setSlideIndex(0);
    setTimeout(() => scrollRef.current?.scrollTo({ x: 0, animated: false }), 50);
  };

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setSlideIndex(idx);
  };

  const hasRoute = selectedPhoto?.route && selectedPhoto.route.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#e4e1d3' }}>

      {/* Header */}
      <View style={galleryStyles.header}>
        <Image
          source={require('./waddl/Prettier/New_name.png')}
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
          {pfpUri ? (
            <Image source={{ uri: pfpUri }} style={galleryStyles.profileImage} resizeMode="cover" />
          ) : (
            <Image
              source={require('./waddl/Pretty/waddl.png')}
              style={galleryStyles.profileImage}
              resizeMode="cover"
            />
          )}
        </View>
        <Text style={galleryStyles.username}>@{user?.username ?? 'Unknown'}</Text>
        <Text style={galleryStyles.bio}>{bio}</Text>
      </View>

      {/* Upload indicator */}
      {uploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator size="small" color="#29412c" />
          <Text style={styles.uploadingText}>Uploading photo...</Text>
        </View>
      )}

      {/* Photos Grid */}
      {loadingPhotos ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#29412c" />
          <Text style={styles.emptyText}>Loading photos...</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>Take your first puddle photo!</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.ref}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openPhoto(item)} style={styles.thumb}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.route && (
                <View style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>🗺</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <Modal visible={!!selectedPhoto} transparent onRequestClose={() => setSelectedPhoto(null)}>
          <View style={modalStyles.overlay}>

            <TouchableOpacity style={modalStyles.closeButton} onPress={() => setSelectedPhoto(null)}>
              <Text style={modalStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {hasRoute && (
              <View style={modalStyles.dots}>
                <View style={[modalStyles.dot, slideIndex === 0 && modalStyles.dotActive]} />
                <View style={[modalStyles.dot, slideIndex === 1 && modalStyles.dotActive]} />
              </View>
            )}

            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
              scrollEnabled={hasRoute}
              style={{ flex: 1 }}
            >
              {/* Slide 1: Photo */}
              <View style={modalStyles.slide}>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={modalStyles.fullImage}
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={modalStyles.deleteButton}
                  onPress={() => handleDelete(selectedPhoto)}
                >
                  <Image
                    source={require('./waddl/Prettier/Delete_button.png')}
                    style={modalStyles.deleteIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Slide 2: Route */}
              {hasRoute && (
                <View style={modalStyles.slide}>
                  <RouteMap route={selectedPhoto.route} />
                </View>
              )}
            </ScrollView>

            {slideIndex === 0 && hasRoute && (
              <View style={modalStyles.swipeHint}>
                <Text style={modalStyles.swipeHintText}>Swipe for route →</Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  closeButton: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  closeButtonText: { color: 'white', fontSize: 28, fontFamily: 'LilitaOne_400Regular' },
  dots: {
    position: 'absolute', bottom: 20, width: '100%',
    flexDirection: 'row', justifyContent: 'center', gap: 8, zIndex: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: 'white' },
  slide: {
    width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 },
  deleteButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  deleteIcon: { width: 200, height: 200 },
  photoActions: { flexDirection: 'row', gap: 20, marginTop: 20 },
  actionButtonText: { fontSize: 24 },
  swipeHint: { position: 'absolute', bottom: 45, width: '100%', alignItems: 'center' },
  swipeHintText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'LilitaOne_400Regular' },
});

const styles = StyleSheet.create({
  grid: { padding: 2 },
  thumb: { width: THUMB, height: THUMB * 1.4, margin: 2 },
  image: { width: '100%', height: '100%', borderRadius: 4 },
  routeBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 2,
  },
  routeBadgeText: { fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 80 },
  emptyText: { color: '#333', fontSize: 20, fontFamily: 'LilitaOne_400Regular' },
  emptySubtext: { color: '#999', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
  uploadingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#d6ecd8', paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#b0d4b4',
  },
  uploadingText: { fontSize: 13, fontFamily: 'LilitaOne_400Regular', color: '#29412c' },
});

const galleryStyles = StyleSheet.create({
  header: {
    backgroundColor: '#29412c', paddingTop: 30, paddingBottom: 10,
    paddingHorizontal: 20, alignItems: 'center',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  logo: { height: 90, width: 240 },
  menuButton: { position: 'absolute', right: 35, top: 60, gap: 5 },
  menuLine: { width: 30, height: 4, backgroundColor: '#e4e1d3', borderRadius: 2 },
  profileSection: {
    alignItems: 'center', paddingVertical: 30,
    backgroundColor: '#e4e1d3', borderBottomWidth: 1, borderBottomColor: '#d0cdb8',
  },
  profilePic: {
    width: 150, height: 150, borderRadius: 20,
    backgroundColor: '#e1e8ed', justifyContent: 'center',
    alignItems: 'center', marginBottom: 15, overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%' },
  username: { fontSize: 20, fontFamily: 'LilitaOne_400Regular', color: '#29412c', marginBottom: 8 },
  bio: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#29412c', textAlign: 'center', paddingHorizontal: 40 },
});