import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>League of Puddles</Text>
        <Text style={styles.headerSubtitle}>React Native + Expo App</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Welcome! 🎉</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>📍 GPS / Location</Text>
          <Text style={styles.featureDescription}>Access device location and track movement</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🗺️ Maps</Text>
          <Text style={styles.featureDescription}>Display interactive maps with markers and routes</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>📸 Camera</Text>
          <Text style={styles.featureDescription}>Take photos and videos</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🔔 Notifications</Text>
          <Text style={styles.featureDescription}>Send push notifications to users</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✨ Getting Started</Text>
          <Text style={styles.infoText}>
            Install packages: expo-location, react-native-maps, expo-camera, expo-notifications
          </Text>
        </View>
      </ScrollView>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e8f0',
  },
  content: {
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
  infoBox: {
    backgroundColor: '#fff9e6',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});
