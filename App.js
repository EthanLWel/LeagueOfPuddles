import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import CameraScreen from './Camera';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  const navigateHome = () => {
    setCurrentScreen('home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
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

          <TouchableOpacity style={styles.featureCard} onPress={() => navigateTo('settings')}>
            <Text style={styles.featureTitle}>Settings</Text>
            <Text style={styles.featureDescription}>Send push notifications to users</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {currentScreen === 'maps' && (
        <View style={styles.screenContainer}>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Maps Section</Text>
            <Text style={styles.screenText}>Maps functionality coming soon...</Text>
          </ScrollView>
          <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
            <Text style={styles.backButtonText}>← Back Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentScreen === 'camera' && (
        <View style={styles.screenContainer}>
          <CameraScreen />
          <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
            <Text style={styles.backButtonText}>← Back Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentScreen === 'settings' && (
        <View style={styles.screenContainer}>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Settings Section</Text>
            <Text style={styles.screenText}>Settings functionality coming soon...</Text>
          </ScrollView>
          <TouchableOpacity style={styles.backButton} onPress={navigateHome}>
            <Text style={styles.backButtonText}>← Back Home</Text>
          </TouchableOpacity>
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