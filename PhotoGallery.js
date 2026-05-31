import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  Alert, StyleSheet, Dimensions, Modal, TextInput,
  ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { ref, deleteObject, listAll, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, storage, db } from './firebase';

// Only import react-native-maps on native — never on web
const RouteMapNative = Platform.OS !== 'web' ? require('./RouteMapNative').default : null;

const THUMB = Dimensions.get('window').width / 3 - 4;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyAthF2hGgMDjU9ip9T_jzBiJifp2N8E6w0';

// ─── Route map slide ──────────────────────────────────────────────

function RouteMapSlide({ route }) {
  if (!route || route.length === 0) {
    return (
      <View style={modalStyles.noRoute}>
        <Text style={modalStyles.noRouteText}>No route attached to this photo</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    const pathParam = route
      .filter((_, i) => i % Math.ceil(route.length / 50) === 0)
      .map(p => `${p.lat},${p.lng}`)
      .join('|');
    const first = route[0];
    const last = route[route.length - 1];
    const url = `https://maps.googleapis.com/maps/api/staticmap?size=400x600&path=color:0x29412cff|weight:4|${pathParam}&markers=color:green|label:A|${first.lat},${first.lng}&markers=color:red|label:B|${last.lat},${last.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    return (
      <View style={modalStyles.routeSlide}>
        <Image source={{ uri: url }} style={modalStyles.staticMap} resizeMode="cover" />
        <Text style={modalStyles.routeTitle}>Your Route</Text>
      </View>
    );
  }

  // Native: use the separately imported component so web never bundles react-native-maps
  return (
    <View style={modalStyles.routeSlide}>
      <RouteMapNative route={route} />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function PhotoGallery({ onOpenSettings, user }) {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [bio, setBio] = useState('Splashing through life, one puddle at a time 💦');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        loadPhotos(firebaseUser.uid);
        loadBio(firebaseUser.uid);
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
      // Most recent photo first
      setPhotos(photos.reverse());
    } catch (e) {
      console.error('Failed to load photos:', e);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadBio = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().bio) {
        setBio(userDoc.data().bio);
      }
    } catch (e) {
      console.error('Failed to load bio:', e);
    }
  };

  const saveBio = async () => {
    const firebaseUser = auth.currentUser;
    const trimmed = bioInput.trim();
    if (trimmed && firebaseUser) {
      setBio(trimmed);
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), { bio: trimmed });
      } catch (e) {
        console.error('Failed to save bio:', e);
      }
    }
    setEditingBio(false);
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
          <Image
            source={require('./waddl/Pretty/waddl.png')}
            style={galleryStyles.profileImage}
            resizeMode="cover"
          />
        </View>
        <Text style={galleryStyles.username}>@{user?.username ?? 'Unknown'}</Text>

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
              <TouchableOpacity style={galleryStyles.bioCancelBtn} onPress={() => setEditingBio(false)}>
                <Text style={galleryStyles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={galleryStyles.bioSaveBtn} onPress={saveBio}>
                <Text style={galleryStyles.bioSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => { setBioInput(bio); setEditingBio(true); }}>
            <Text style={galleryStyles.bio}>{bio}</Text>
          </TouchableOpacity>
        )}
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

            {/* Close button */}
            <TouchableOpacity style={modalStyles.closeButton} onPress={() => setSelectedPhoto(null)}>
              <Text style={modalStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Slide dots */}
            <View style={modalStyles.dots}>
              <View style={[modalStyles.dot, slideIndex === 0 && modalStyles.dotActive]} />
              <View style={[modalStyles.dot, slideIndex === 1 && modalStyles.dotActive]} />
            </View>

            {/* Swipeable slides */}
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
              style={{ flex: 1 }}
            >
              {/* Slide 1: Photo */}
              <View style={modalStyles.slide}>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={modalStyles.fullImage}
                  resizeMode="contain"
                />
                <View style={modalStyles.photoActions}>
                  <TouchableOpacity
                    style={modalStyles.deleteButton}
                    onPress={() => handleDelete(selectedPhoto)}
                  >
                    <Text style={modalStyles.actionButtonText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Slide 2: Route */}
              <View style={modalStyles.slide}>
                <RouteMapSlide route={selectedPhoto.route} />
              </View>
            </ScrollView>

            {/* Swipe hint */}
            {slideIndex === 0 && selectedPhoto.route && (
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

// ─── Styles ───────────────────────────────────────────────────────

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
  photoActions: { flexDirection: 'row', gap: 20, marginTop: 20 },
  deleteButton: {
    width: 55, height: 55, borderRadius: 27.5,
    backgroundColor: 'rgba(200,0,0,0.85)', justifyContent: 'center', alignItems: 'center',
  },
  actionButtonText: { fontSize: 24 },
  routeSlide: { width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 16 },
  routeTitle: { color: 'white', fontSize: 20, fontFamily: 'LilitaOne_400Regular' },
  staticMap: { width: SCREEN_WIDTH - 64, height: (SCREEN_WIDTH - 64) * 1.5, borderRadius: 12 },
  noRoute: { alignItems: 'center', paddingTop: 40 },
  noRouteText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
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
  bioEditContainer: { width: '80%', alignItems: 'center', gap: 8 },
  bioInput: {
    width: '100%', backgroundColor: '#fff', borderRadius: 10,
    padding: 10, fontSize: 14, fontFamily: 'LilitaOne_400Regular',
    color: '#333', borderWidth: 1, borderColor: '#d0cdb8',
    textAlign: 'center', minHeight: 60,
  },
  bioEditButtons: { flexDirection: 'row', gap: 10 },
  bioCancelBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#29412c' },
  bioCancelText: { fontFamily: 'LilitaOne_400Regular', color: '#29412c', fontSize: 14 },
  bioSaveBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#29412c' },
  bioSaveText: { fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3', fontSize: 14 },
});