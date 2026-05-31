import { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput,
  TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'registered_users';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUsers = async () => {
    try {
      const raw = await AsyncStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const saveUsers = async (users) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter a username and password');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const users = await getUsers();

      if (mode === 'register') {
        const exists = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
        if (exists) {
          setError('Username already taken');
          setLoading(false);
          return;
        }
        const newUser = { id: Date.now().toString(), username: username.trim(), password };
        await saveUsers([...users, newUser]);
        onAuth({ id: newUser.id, username: newUser.username });
      } else {
        const user = users.find(
          u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
        );
        if (!user) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }
        onAuth({ id: user.id, username: user.username });
      }
    } catch (e) {
      setError('Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Image
          source={require('./waddl/Pretty/Top_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{mode === 'login' ? 'Welcome back!' : 'Create account'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#e4e1d3" />
            : <Text style={styles.btnText}>{mode === 'login' ? 'Log in' : 'Register'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  logo: { width: 280, height: 100, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'LilitaOne_400Regular', color: '#29412c', marginBottom: 8 },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#d0cdb8',
  },
  error: { color: '#c00', fontSize: 13, fontFamily: 'LilitaOne_400Regular', textAlign: 'center' },
  btn: {
    width: '100%',
    backgroundColor: '#29412c',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { backgroundColor: '#aaa' },
  btnText: { color: '#e4e1d3', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
  switchText: { color: '#29412c', fontSize: 13, fontFamily: 'LilitaOne_400Regular', marginTop: 8 },
});