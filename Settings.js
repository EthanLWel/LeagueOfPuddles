import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RADIUS_KEY = 'walk_radius';
export const DEFAULT_RADIUS = 2;

export default function Settings({ onBack }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  useEffect(() => {
    AsyncStorage.getItem(RADIUS_KEY).then(val => {
      if (val !== null) setRadius(parseFloat(val));
    });
  }, []);

  const updateRadius = (newRadius) => {
    const clamped = Math.max(0.5, parseFloat(newRadius.toFixed(2)));
    setRadius(clamped);
    AsyncStorage.setItem(RADIUS_KEY, String(clamped));
  };

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Walk Settings</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Walk Radius</Text>
          <View style={styles.radiusRow}>
            <TouchableOpacity style={styles.radiusBtn} onPress={() => updateRadius(radius - 0.5)}>
              <Text style={styles.radiusBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.radiusValue}>{radius} mi</Text>
            <TouchableOpacity style={styles.radiusBtn} onPress={() => updateRadius(radius + 0.5)}>
              <Text style={styles.radiusBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
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
  backBtn: { width: 60 },
  backText: { color: 'white', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
  logo: { height: 100, width: 300 },
  placeholder: { width: 60 },
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
  rowLabel: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#333' },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radiusBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#29412c', alignItems: 'center', justifyContent: 'center',
  },
  radiusBtnText: { color: '#e4e1d3', fontSize: 20, lineHeight: 22, fontFamily: 'LilitaOne_400Regular' },
  radiusValue: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#333', minWidth: 48, textAlign: 'center' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  aboutLabel: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#333' },
  aboutValue: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#666' },
});