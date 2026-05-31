// photoStorage.js
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// ─── Account helpers ──────────────────────────────────────────────

const ACCOUNTS_KEY = 'waddl_accounts';
const CURRENT_USER_KEY = 'waddl_current_user';

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
  } catch { return null; }
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  } catch { return []; }
}

export function saveAccount(user) {
  const accounts = getAccounts();
  if (!accounts.find(a => a.username === user.username)) {
    accounts.push(user);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

// ─── IndexedDB helpers (web) ──────────────────────────────────────

const DB_NAME = 'waddl_photos';
const DB_VERSION = 1;
const STORE = 'photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: 'filename' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbPut(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function idbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbDelete(filename) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(filename);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function uriToDataURL(uri) {
  if (uri.startsWith('blob:') || uri.startsWith('http')) {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return uri;
}

// ─── Web implementations ──────────────────────────────────────────

async function webSavePhoto(tempUri, route = null) {
  const user = getCurrentUser();
  const filename = `photo_${Date.now()}.jpg`;
  const dataURL = await uriToDataURL(tempUri);
  await idbPut({
    filename,
    uri: dataURL,
    savedAt: Date.now(),
    username: user?.username || 'unknown',
    displayName: user?.displayName || 'Unknown',
    route,  // array of {lat, lng} or null
  });
  return dataURL;
}

async function webGetSavedPhotos() {
  const user = getCurrentUser();
  const all = await idbGetAll();
  return all
    .filter(p => p.username === (user?.username || 'unknown'))
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(({ filename, uri }) => ({ filename, uri }));
}

export async function webGetAllOtherPhotos() {
  const user = getCurrentUser();
  const all = await idbGetAll();
  return all
    .filter(p => p.username !== (user?.username || 'unknown'))
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(({ filename, uri, username, displayName, savedAt }) => ({
      filename, uri, username, displayName, savedAt,
    }));
}

async function webDeletePhoto(uri) {
  const all = await idbGetAll();
  const match = all.find(p => p.uri === uri);
  if (match) await idbDelete(match.filename);
}

function webDownloadToGallery(uri) {
  const a = document.createElement('a');
  a.href = uri;
  a.download = `waddl_${Date.now()}.jpg`;
  a.click();
}

// ─── Native implementations ───────────────────────────────────────

const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';
const META_FILE = FileSystem.documentDirectory + 'photos_meta.json';

async function nativeEnsurePhotoDir() {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

async function nativeReadMeta() {
  try {
    const str = await FileSystem.readAsStringAsync(META_FILE);
    return JSON.parse(str);
  } catch { return []; }
}

async function nativeWriteMeta(meta) {
  await FileSystem.writeAsStringAsync(META_FILE, JSON.stringify(meta));
}

async function nativeSavePhoto(tempUri, route = null) {
  await nativeEnsurePhotoDir();
  const user = getCurrentUser();
  const filename = `photo_${Date.now()}.jpg`;
  const destUri = PHOTO_DIR + filename;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  const meta = await nativeReadMeta();
  meta.push({
    filename,
    uri: destUri,
    savedAt: Date.now(),
    username: user?.username || 'unknown',
    displayName: user?.displayName || 'Unknown',
    route,
  });
  await nativeWriteMeta(meta);
  return destUri;
}

async function nativeGetSavedPhotos() {
  await nativeEnsurePhotoDir();
  const user = getCurrentUser();
  const meta = await nativeReadMeta();
  return meta
    .filter(p => p.username === (user?.username || 'unknown'))
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function nativeGetAllOtherPhotos() {
  const user = getCurrentUser();
  const meta = await nativeReadMeta();
  return meta
    .filter(p => p.username !== (user?.username || 'unknown'))
    .sort((a, b) => b.savedAt - a.savedAt);
}

async function nativeDeletePhoto(uri) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
  const meta = await nativeReadMeta();
  await nativeWriteMeta(meta.filter(p => p.uri !== uri));
}

async function nativeDownloadToGallery(uri) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Media library permission denied');
  await MediaLibrary.createAssetAsync(uri);
}

// ─── Exported API ─────────────────────────────────────────────────

export const savePhoto         = Platform.OS === 'web' ? webSavePhoto         : nativeSavePhoto;
export const getSavedPhotos    = Platform.OS === 'web' ? webGetSavedPhotos    : nativeGetSavedPhotos;
export const getAllOtherPhotos = Platform.OS === 'web' ? webGetAllOtherPhotos : nativeGetAllOtherPhotos;
export const deletePhoto       = Platform.OS === 'web' ? webDeletePhoto       : nativeDeletePhoto;
export const downloadToGallery = Platform.OS === 'web' ? webDownloadToGallery : nativeDownloadToGallery;

export async function ensurePhotoDir() {
  if (Platform.OS !== 'web') await nativeEnsurePhotoDir();
}