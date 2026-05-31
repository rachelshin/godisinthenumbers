// data/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadItem(key, fallback) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}