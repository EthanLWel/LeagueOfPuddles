import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
<<<<<<< Updated upstream
import CameraScreen from './Camera';
import PhotoGallery from './PhotoGallery';
import Settings from './Settings';
=======
import AsyncStorage from '@react-native-async-storage/async-storage';
import CameraScreen from './Camera';
import PhotoGallery from './PhotoGallery';
import Settings from './Settings';
import Mapscreen from './Mapscreen';

const TODAY_KEY = 'last_opened_date';

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}
>>>>>>> Stashed changes

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
<<<<<<< Updated upstream
=======
  const [dailyResetKey, setDailyResetKey] = useState(null);

  useEffect(() => {
    (async () => {
      const today = getTodayString();
      const lastOpened = await AsyncStorage.getItem(TODAY_KEY);
      if (lastOpened !== today) {
        await AsyncStorage.setItem(TODAY_KEY, today);
        setDailyResetKey(today);
      } else {
        setDailyResetKey(today);
      }
    })();
  }, []);
>>>>>>> Stashed changes

  const navigateTo = (screen) => setCurrentScreen(screen);
  const navigateHome = () => setCurrentScreen('home');

<<<<<<< Updated upstream
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
=======
  if (!dailyResetKey) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

>>>>>>> Stashed changes
      <View style={styles.header}>
        <Text style={styles.headerTitle}>League of Puddles</Text>
      </View>

      {currentScreen === 'home' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Welcome! 🎉</Text>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigateTo('maps')}>
            <Text style={styles.featureTitle}>Maps</Text>
            <Text style={styles.featureDescription}>Display interactive maps with markers and routes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigateTo('camera')}>
            <Text style={styles.featureTitle}>Camera</Text>
            <Text style={styles.featureDescription}>Take photos and videos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigateTo('gallery')}>
            <Text style={styles.featureTitle}>Profile</Text>
            <Text style={styles.featureDescription}>View, download, or delete your saved photos</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {currentScreen === 'maps' && (
<<<<<<< Updated upstream
        <View style={styles.screenContainer}>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Maps Section</Text>
            <Text style={styles.screenText}>Maps functionality coming soon...</Text>
          </ScrollView>
=======
        <Mapscreen key={dailyResetKey} onBack={navigateHome} />
      )}

      {currentScreen === 'camera' && (
        <View style={styles.screenContainer}>
          <CameraScreen />
>>>>>>> Stashed changes
          <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
            <Text style={styles.backButtonText}>← Back Home</Text>
          </TouchableOpacity>
        </View>
      )}

<<<<<<< Updated upstream
      {currentScreen === 'camera' && (
        <View style={styles.screenContainer}>
          <CameraScreen />
          <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
            <Text style={styles.backButtonText}>← Back Home</Text>
          </TouchableOpacity>
=======
      {currentScreen === 'gallery' && (
        <View style={styles.screenContainer}>
          {showSettings ? (
            <Settings onBack={() => setShowSettings(false)} />
          ) : (
            <>
              <PhotoGallery onOpenSettings={() => setShowSettings(true)} />
              <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
                <Text style={styles.backButtonText}>← Back Home</Text>
              </TouchableOpacity>
            </>
          )}
>>>>>>> Stashed changes
        </View>
      )}

      {currentScreen === 'gallery' && (
        <View style={styles.screenContainer}>
          {showSettings ? (
            <Settings onBack={() => setShowSettings(false)} />
          ) : (
            <>
              <PhotoGallery onOpenSettings={() => setShowSettings(true)} />
              <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
                <Text style={styles.backButtonText}>← Back Home</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  screenText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});