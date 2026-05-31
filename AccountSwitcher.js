// AccountSwitcher.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert
} from 'react-native';
import { getAccounts, saveAccount, getCurrentUser, setCurrentUser } from './accountStorage';

export default function AccountSwitcher({ onSwitch }) {
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUserState] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  const load = async () => {
    const all = await getAccounts();
    const current = await getCurrentUser();
    setAccounts(all);
    setCurrentUserState(current);
  };

  useEffect(() => { load(); }, []);

  const createAccount = async () => {
    const username = newUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const displayName = newDisplayName.trim();
    if (!username || !displayName) {
      Alert.alert('Fill in both fields');
      return;
    }
    const existing = accounts.find(a => a.username === username);
    if (existing) {
      Alert.alert('Username taken', 'Try a different username.');
      return;
    }
    const user = { username, displayName };
    await saveAccount(user);
    await switchTo(user);
  };

  const switchTo = async (user) => {
    await setCurrentUser(user);
    setCurrentUserState(user);
    await load();
    onSwitch?.(user);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accounts</Text>

      {/* Existing accounts */}
      {accounts.length > 0 && (
        <FlatList
          data={accounts}
          keyExtractor={item => item.username}
          style={styles.list}
          renderItem={({ item }) => {
            const isActive = item.username === currentUser?.username;
            return (
              <TouchableOpacity
                onPress={() => switchTo(item)}
                style={[styles.accountRow, isActive && styles.accountRowActive]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.displayName[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.displayName}>{item.displayName}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
                {isActive && <Text style={styles.activeBadge}>Active</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Create new account */}
      <Text style={styles.sectionLabel}>Create new account</Text>
      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor="#999"
        value={newDisplayName}
        onChangeText={setNewDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Username (no spaces)"
        placeholderTextColor="#999"
        value={newUsername}
        onChangeText={setNewUsername}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.createBtn} onPress={createAccount}>
        <Text style={styles.createBtnText}>Create & Switch</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e4e1d3',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    marginBottom: 20,
  },
  list: {
    marginBottom: 20,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  accountRowActive: {
    borderWidth: 2,
    borderColor: '#29412c',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#29412c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#e4e1d3',
    fontSize: 20,
    fontFamily: 'LilitaOne_400Regular',
  },
  displayName: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#000',
  },
  username: {
    fontSize: 13,
    fontFamily: 'LilitaOne_400Regular',
    color: '#666',
  },
  activeBadge: {
    marginLeft: 'auto',
    fontSize: 12,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    backgroundColor: '#c8dbc9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontFamily: 'LilitaOne_400Regular',
    marginBottom: 10,
    color: '#000',
  },
  createBtn: {
    backgroundColor: '#29412c',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#e4e1d3',
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
  },
});