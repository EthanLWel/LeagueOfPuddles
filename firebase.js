import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
 
const firebaseConfig = {
  apiKey: "AIzaSyCeesw0V2HkFIYekmWSR-MBdYB4EvBP28E",
  authDomain: "uoo-quackathon26eug-8241.firebaseapp.com",
  projectId: "uoo-quackathon26eug-8241",
  storageBucket: "uoo-quackathon26eug-8241.firebasestorage.app",
  messagingSenderId: "417755298888",
  appId: "1:417755298888:web:4f7ca8d2152842244dec7d"
};
 
const app = initializeApp(firebaseConfig);
 
// Use platform-appropriate auth persistence
let auth;
if (Platform.OS === 'web') {
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
 
export { auth };
export const storage = getStorage(app);
export const db = getFirestore(app);
