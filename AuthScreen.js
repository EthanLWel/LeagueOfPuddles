import { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput,
  TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'That email is already registered.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/user-not-found': return 'No account found with that email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/invalid-credential': return 'Invalid email or password.';
      default: return 'Something went wrong. Please try again.';
    }
  };

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter an email and password.');
      return;
    }
    if (mode === 'register') {
      if (!username.trim()) {
        setError('Please enter a username.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        // Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

        // Set display name
        await updateProfile(cred.user, { displayName: username.trim() });

        // Save user profile to Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          username: username.trim(),
          email: email.trim(),
          bio: 'Splashing through life, one puddle at a time 💦',
          createdAt: new Date().toISOString(),
        });

        onAuth({ id: cred.user.uid, username: username.trim() });

      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        onAuth({
          id: cred.user.uid,
          username: cred.user.displayName || cred.user.email,
        });
      }
    } catch (e) {
      setError(getFriendlyError(e.code));
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

        <Text style={styles.title}>
          {mode === 'login' ? 'Welcome back!' : 'Create account'}
        </Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mode === 'register' && (
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
              confirmPassword.length > 0 && password === confirmPassword && styles.inputSuccess,
            ]}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        )}

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

        <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}>
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
  inputError: { borderColor: '#c0392b' },
  inputSuccess: { borderColor: '#29412c' },
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