// photoStorage.js
import * as FileSystem from 'expo-file-system';

const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';

// Make sure the photos directory exists
export async function ensurePhotoDir() {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

// Save a photo from a temp URI into local storage
export async function savePhoto(tempUri) {
  await ensurePhotoDir();
  const filename = `photo_${Date.now()}.jpg`;
  const destUri = PHOTO_DIR + filename;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

// Get all saved photos
export async function getSavedPhotos() {
  await ensurePhotoDir();
  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR);
  return files
    .filter(f => f.endsWith('.jpg'))
    .map(f => ({ filename: f, uri: PHOTO_DIR + f }))
    .sort((a, b) => b.filename.localeCompare(a.filename)); // newest first
}

// Delete a single photo
export async function deletePhoto(uri) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

// Download a photo to the Android gallery
export async function downloadToGallery(uri) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission denied');
  }
  await MediaLibrary.createAssetAsync(uri);
}