import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useFonts, LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import HomeFeed from './HomeFeed';
import CameraScreen from './Camera';
import MapScreen from './MapScreen';
import PhotoGallery from './PhotoGallery';
import Settings from './Settings';
import AuthScreen from './AuthScreen';

const TODAY_KEY = 'last_opened_date';
const PHOTOS_DIR = FileSystem.documentDirectory + 'photos/';

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [dailyResetKey, setDailyResetKey] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [fontsLoaded] = useFonts({ LilitaOne_400Regular });

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // Daily reset logic
  useEffect(() => {
    (async () => {
      const today = getTodayString();
      const lastOpened = await AsyncStorage.getItem(TODAY_KEY);

      if (lastOpened !== today) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(PHOTOS_DIR, { idempotent: true });
          }
        } catch (e) {}

        try {
          if (typeof localStorage !== 'undefined') localStorage.removeItem('daily_pin');
          await AsyncStorage.removeItem('daily_pin');
        } catch (e) {}

        await AsyncStorage.setItem(TODAY_KEY, today);
        setDailyResetKey(today);
      } else {
        setDailyResetKey(today);
      }
    })();
  }, []);

  const handleAuth = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentScreen('home');
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    setShowSettings(false);
  };

  if (!authChecked || !dailyResetKey || !fontsLoaded) return null;

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {currentScreen === 'home' && <HomeFeed user={user} />}
      {currentScreen === 'camera' && <CameraScreen user={user} />}
      {currentScreen === 'maps' && <MapScreen key={dailyResetKey} />}
      {currentScreen === 'gallery' && (
        showSettings ? (
          <Settings onBack={() => setShowSettings(false)} onLogout={handleLogout} user={user} />
        ) : (
          <PhotoGallery onOpenSettings={() => setShowSettings(true)} user={user} />
        )
      )}

      <View style={[styles.bottomNav, currentScreen === 'camera' && styles.bottomNavFlat]}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('home')}>
          <Image
            source={currentScreen === 'home'
              ? require('./waddl/Pretty/Home_Highlighted.png')
              : require('./waddl/Pretty/Home_unhighlighted.png')}
            style={styles.navIcon} resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('camera')}>
          <Image
            source={currentScreen === 'camera'
              ? require('./waddl/Pretty/Camera_highlighted.png')
              : require('./waddl/Pretty/Camera_Unhighted.png')}
            style={styles.navIcon} resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('maps')}>
          <Image
            source={currentScreen === 'maps'
              ? require('./waddl/Pretty/Map_highlighted.png')
              : require('./waddl/Pretty/Maps_unhighlighted.png')}
            style={styles.navIcon} resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('gallery')}>
          <Image
            source={currentScreen === 'gallery'
              ? require('./waddl/Pretty/Profile_highlighted.png')
              : require('./waddl/Pretty/Account_unhighlighted.png')}
            style={styles.navIcon} resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#29412c',
    paddingBottom: 10,
    paddingTop: 5,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1a2a1b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomNavFlat: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  navButton: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  navIcon: { width: 55, height: 55 },
});