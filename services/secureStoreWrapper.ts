import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function getItemAsync(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key, options);
}

export async function setItemAsync(
  key: string,
  value: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value, options);
}

export async function deleteItemAsync(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key, options);
}

/**
 * Equivalent to iOS-only getValueWithKeyAsync
 * On Web/Android it just calls getItemAsync.
 */
export async function getValueWithKeyAsync(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  if ((SecureStore as any).getValueWithKeyAsync) {
    return (SecureStore as any).getValueWithKeyAsync(key, options);
  }
  return SecureStore.getItemAsync(key, options);
}
