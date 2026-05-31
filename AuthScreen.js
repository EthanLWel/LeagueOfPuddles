import { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput,
  TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ImageBackground,
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
    <ImageBackground
      source={require('./waddl/Prettier/Title_screen_background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Image
            source={require('./waddl/Prettier/Title_screen.png')}
            style={styles.titleImage}
            resizeMode="contain"
          />

          <View style={styles.inputsContainer}>
            {mode === 'register' && (
              <ImageBackground
                source={require('./waddl/Prettier/Blank_button.png')}
                style={styles.inputBackground}
                resizeMode="stretch"
              >
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#7a6449"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </ImageBackground>
            )}

            <ImageBackground
              source={require('./waddl/Prettier/Blank_button.png')}
              style={styles.inputBackground}
              resizeMode="stretch"
            >
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#7a6449"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </ImageBackground>

            <ImageBackground
              source={require('./waddl/Prettier/Blank_button.png')}
              style={styles.inputBackground}
              resizeMode="stretch"
            >
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#7a6449"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </ImageBackground>

            {mode === 'register' && (
              <ImageBackground
                source={require('./waddl/Prettier/Blank_button.png')}
                style={[
                  styles.inputBackground,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                  confirmPassword.length > 0 && password === confirmPassword && styles.inputSuccess,
                ]}
                resizeMode="stretch"
              >
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#7a6449"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </ImageBackground>
            )}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <ImageBackground
            source={require('./waddl/Prettier/Blank_button.png')}
            style={styles.btnBackground}
            resizeMode="stretch"
          >
            <TouchableOpacity
              style={styles.btnTouchable}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#29412c" />
              ) : (
                <Text style={styles.btnText}>{mode === 'login' ? 'Login' : 'Register'}</Text>
              )}
            </TouchableOpacity>
          </ImageBackground>

          <TouchableOpacity 
            style={styles.switchContainer}
            onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? Create one!" : 'Already have an account? Log in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  inner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  titleImage: {
    width: 320,
    height: 160,
    marginBottom: 30,
  },
  inputsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 10,
  },
  inputBackground: {
    width: 280,
    height: 55,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#29412c',
    textAlign: 'center',
  },
  inputError: {
    opacity: 0.6,
  },
  inputSuccess: {
    opacity: 1,
  },
  error: {
    color: '#c0392b',
    fontSize: 14,
    fontFamily: 'LilitaOne_400Regular',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  btnBackground: {
    width: 320,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  btnTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#29412c',
    fontSize: 22,
    fontFamily: 'LilitaOne_400Regular',
  },
  switchContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  switchText: {
    color: '#a87d2f',
    fontSize: 15,
    fontFamily: 'LilitaOne_400Regular',
    textAlign: 'center',
  },
});