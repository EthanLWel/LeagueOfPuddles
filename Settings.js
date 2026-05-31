import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, ScrollView, TextInput, Alert, Modal, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, db } from './firebase';

export const RADIUS_KEY = 'walk_radius';
export const DEFAULT_RADIUS = 2;

export default function Settings({ onBack, onLogout, user }) {
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState('');
  const [pfpUri, setPfpUri] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [pendingPfpUri, setPendingPfpUri] = useState(null);
  const [pendingPfpBlob, setPendingPfpBlob] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedRadius = await AsyncStorage.getItem(RADIUS_KEY);
        if (savedRadius !== null) setRadius(parseFloat(savedRadius));
      } catch (e) {}

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setBio(userDoc.data().bio ?? '');
            setPfpUri(userDoc.data().pfpUrl ?? null);
          }
        } catch (e) {}
      }
      setLoading(false);
    })();
  }, []);

  const updateRadius = (newRadius) => {
    const clamped = Math.max(0, parseFloat(newRadius.toFixed(2)));
    setRadius(clamped);
    AsyncStorage.setItem(RADIUS_KEY, String(clamped));
  };

  const openEditModal = () => {
    setBioInput(bio);
    setPendingPfpUri(pfpUri);
    setPendingPfpBlob(null);
    setEditModalVisible(true);
  };

  const pickImage = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingPfpUri(URL.createObjectURL(file));
        setPendingPfpBlob(file);
      };
      input.click();
    } else {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow photo access.');
          return;
        }
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        }).then((result) => {
          if (result.canceled) return;
          const uri = result.assets[0].uri;
          fetch(uri).then(r => r.blob()).then(blob => {
            setPendingPfpUri(uri);
            setPendingPfpBlob(blob);
          });
        });
      });
    }
  };

  const saveProfile = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      Alert.alert('Error', 'You must be logged in to save your profile.');
      return;
    }
    setSaving(true);
    try {
      const updates = {};

      // Always save bio
      const trimmed = bioInput.trim();
      updates.bio = trimmed;
      setBio(trimmed);

      // Upload new pfp if one was picked
      if (pendingPfpBlob) {
        const pfpRef = ref(storage, `pfps/${firebaseUser.uid}/profile.jpg`);
        await uploadBytes(pfpRef, pendingPfpBlob);
        const downloadUrl = await getDownloadURL(pfpRef);
        updates.pfpUrl = downloadUrl;
        setPfpUri(downloadUrl);
      }

      await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
      setEditModalVisible(false);
    } catch (e) {
      console.error('saveProfile error:', e);
      Alert.alert('Error', e?.message ?? 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#29412c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Image source={require('./waddl/Prettier/Arrow.png')} style={styles.backArrow} resizeMode="contain" />
        </TouchableOpacity>
        <Image
          source={require('./waddl/Prettier/New_name.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {pfpUri ? (
              <Image source={{ uri: pfpUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            )}
          </View>
          <Text style={styles.username}>{user?.username ?? 'Unknown'}</Text>
          <Text style={styles.userId}>ID: {user?.id ?? '-'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.row} onPress={openEditModal}>
            <Text style={styles.rowLabel}>Edit Profile</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Walk Settings</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Walk Radius</Text>
            <View style={styles.radiusRow}>
              <TouchableOpacity style={styles.radiusBtn} onPress={() => updateRadius(radius - 0.5)}>
                <Text style={styles.radiusBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.radiusValue}>
                {radius === 0 ? 'Here' : `${radius} mi`}
              </Text>
              <TouchableOpacity style={styles.radiusBtn} onPress={() => updateRadius(radius + 0.5)}>
                <Text style={styles.radiusBtnText}>+</Text>
              </TouchableOpacity>
            </View>
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

      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={modal.container}>
          <View style={modal.header}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={modal.cancelBtn}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={modal.title}>Edit Profile</Text>
            <TouchableOpacity onPress={saveProfile} disabled={saving} style={modal.saveBtn}>
              {saving
                ? <ActivityIndicator color="#e4e1d3" size="small" />
                : <Text style={modal.saveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modal.body}>

            {/* PFP */}
            <View style={modal.pfpSection}>
              <View style={modal.pfpCircle}>
                {pendingPfpUri ? (
                  <Image source={{ uri: pendingPfpUri }} style={modal.pfpImage} />
                ) : (
                  <Text style={modal.pfpInitial}>
                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={modal.pfpBtn} onPress={pickImage}>
                <Text style={modal.pfpBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Bio */}
            <View style={modal.fieldSection}>
              <Text style={modal.fieldLabel}>BIO</Text>
              <TextInput
                style={modal.bioInput}
                value={bioInput}
                onChangeText={setBioInput}
                multiline
                maxLength={100}
                placeholder="Write something about yourself…"
                placeholderTextColor="#aaa"
              />
              <Text style={modal.charCount}>{bioInput.length}/100</Text>
            </View>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
  header: {
    backgroundColor: '#29412c',
    paddingTop: 30, paddingBottom: 10, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  backBtn: { width: 60 },
  backArrow: { width: 40, height: 40 },
  backText: { color: 'white', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
  logo: { height: 90, width: 240 },
  placeholder: { width: 60 },
  scrollContent: { paddingBottom: 40 },
  profileSection: { alignItems: 'center', marginTop: 24, marginBottom: 8, gap: 6 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#29412c', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#e4e1d3', fontSize: 32, fontFamily: 'LilitaOne_400Regular' },
  username: { fontSize: 22, fontFamily: 'LilitaOne_400Regular', color: '#29412c' },
  userId: { fontSize: 12, fontFamily: 'LilitaOne_400Regular', color: '#999' },
  section: {
    backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: {
    fontSize: 13, fontFamily: 'LilitaOne_400Regular', color: '#29412c',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#d0cdb8',
  },
  rowLabel: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#333' },
  rowArrow: { fontSize: 22, color: '#aaa', marginTop: -2 },
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
  logoutBtn: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#c0392b',
    paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
  header: {
    backgroundColor: '#29412c',
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cancelBtn: { width: 70 },
  cancelText: { color: '#e4e1d3', fontSize: 15, fontFamily: 'LilitaOne_400Regular' },
  title: { color: '#e4e1d3', fontSize: 18, fontFamily: 'LilitaOne_400Regular' },
  saveBtn: { width: 70, alignItems: 'flex-end' },
  saveText: { color: '#e4e1d3', fontSize: 15, fontFamily: 'LilitaOne_400Regular' },
  body: { paddingBottom: 60 },
  pfpSection: { alignItems: 'center', paddingVertical: 32, gap: 14 },
  pfpCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#29412c', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  pfpImage: { width: '100%', height: '100%' },
  pfpInitial: { color: '#e4e1d3', fontSize: 40, fontFamily: 'LilitaOne_400Regular' },
  pfpBtn: {
    backgroundColor: '#29412c', paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 20,
  },
  pfpBtnText: { color: '#e4e1d3', fontSize: 14, fontFamily: 'LilitaOne_400Regular' },
  fieldSection: { marginHorizontal: 16 },
  fieldLabel: {
    fontSize: 12, fontFamily: 'LilitaOne_400Regular', color: '#29412c',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  bioInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, fontFamily: 'LilitaOne_400Regular', color: '#333',
    minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#d0cdb8',
  },
  charCount: {
    textAlign: 'right', fontSize: 12,
    fontFamily: 'LilitaOne_400Regular', color: '#aaa', marginTop: 4,
  },
});