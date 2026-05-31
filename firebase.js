import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeesw0V2HkFIYekmWSR-MBdYB4EvBP28E",
  authDomain: "uoo-quackathon26eug-8241.firebaseapp.com",
  projectId: "uoo-quackathon26eug-8241",
  storageBucket: "uoo-quackathon26eug-8241.firebasestorage.app",
  messagingSenderId: "417755298888",
  appId: "1:417755298888:web:4f7ca8d2152842244dec7d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);