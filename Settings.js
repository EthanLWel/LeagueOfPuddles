import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image } from 'react-native';

export default function Settings({ onBack, onLogout, user }) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Image
          source={require('./waddl/Pretty/Top_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.placeholder} />
      </View>

      {/* Profile section */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username ?? 'Unknown'}</Text>
        <Text style={styles.userId}>ID: {user?.id ?? '-'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ccc', true: '#29412c' }}
            thumbColor={notificationsEnabled ? '#e4e1d3' : '#f4f3f4'}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#ccc', true: '#29412c' }}
            thumbColor={darkMode ? '#e4e1d3' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e4e1d3',
  },
  header: {
    backgroundColor: '#29412c',
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
  },
  logo: {
    height: 100,
    width: 300,
  },
  placeholder: {
    width: 60,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#29412c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#e4e1d3',
    fontSize: 32,
    fontFamily: 'LilitaOne_400Regular',
  },
  username: {
    fontSize: 22,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
  },
  userId: {
    fontSize: 12,
    fontFamily: 'LilitaOne_400Regular',
    color: '#999',
  },
  section: {
    backgroundColor: '#e4e1d3',
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d0cdb8',
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#333',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#333',
  },
  aboutValue: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#666',
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#c0392b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
  },
});