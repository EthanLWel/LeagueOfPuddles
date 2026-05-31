// accountStorage.js
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const ACCOUNTS_FILE = FileSystem.documentDirectory + 'waddl_accounts.json';
const CURRENT_USER_FILE = FileSystem.documentDirectory + 'waddl_current_user.json';

// ─── Web ──────────────────────────────────────────────────────────

function webGetAccounts() {
  try { return JSON.parse(localStorage.getItem('waddl_accounts')) || []; }
  catch { return []; }
}

function webSaveAccount(user) {
  const accounts = webGetAccounts();
  if (!accounts.find(a => a.username === user.username)) {
    accounts.push(user);
    localStorage.setItem('waddl_accounts', JSON.stringify(accounts));
  }
}

function webGetCurrentUser() {
  try { return JSON.parse(localStorage.getItem('waddl_current_user')) || null; }
  catch { return null; }
}

function webSetCurrentUser(user) {
  localStorage.setItem('waddl_current_user', JSON.stringify(user));
}

// ─── Native ───────────────────────────────────────────────────────

async function nativeGetAccounts() {
  try {
    const str = await FileSystem.readAsStringAsync(ACCOUNTS_FILE);
    return JSON.parse(str);
  } catch { return []; }
}

async function nativeSaveAccount(user) {
  const accounts = await nativeGetAccounts();
  if (!accounts.find(a => a.username === user.username)) {
    accounts.push(user);
    await FileSystem.writeAsStringAsync(ACCOUNTS_FILE, JSON.stringify(accounts));
  }
}

async function nativeGetCurrentUser() {
  try {
    const str = await FileSystem.readAsStringAsync(CURRENT_USER_FILE);
    return JSON.parse(str);
  } catch { return null; }
}

async function nativeSetCurrentUser(user) {
  await FileSystem.writeAsStringAsync(CURRENT_USER_FILE, JSON.stringify(user));
}

// ─── Exported API ─────────────────────────────────────────────────

export const getAccounts    = Platform.OS === 'web' ? webGetAccounts    : nativeGetAccounts;
export const saveAccount    = Platform.OS === 'web' ? webSaveAccount    : nativeSaveAccount;
export const getCurrentUser = Platform.OS === 'web' ? webGetCurrentUser : nativeGetCurrentUser;
export const setCurrentUser = Platform.OS === 'web' ? webSetCurrentUser : nativeSetCurrentUser;