import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { sha256 } from 'js-sha256';

const TOKEN_KEY = 'auth:token';
const USER_KEY = 'auth:username';
const OFFLINE_KEY = 'auth:offlineKey';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem('auth:isLoggedIn', 'true');
}

export async function saveOfflineLoginKey(username: string, password: string) {
  const hash = sha256(`${username}:${password}`);
  await SecureStore.setItemAsync(OFFLINE_KEY, hash);
}

export async function getValidToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (typeof exp === 'number' && exp * 1000 <= Date.now()) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (typeof exp === 'number' && exp * 1000 <= Date.now()) {
      await signOut();
      return null;
    }
    return token;
  } catch {
    await signOut();
    return null;
  }
}

export async function signOut() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(OFFLINE_KEY);
  await AsyncStorage.removeItem('auth:isLoggedIn');
}

export async function saveUsername(username: string) {
  await AsyncStorage.setItem(USER_KEY, username);
}

export async function getSavedUsername(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}

export async function clearUsername() {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function attemptOfflineLogin(
  username: string,
  password: string
): Promise<{ token: string; expired: boolean } | null> {
  const storedHash = await SecureStore.getItemAsync(OFFLINE_KEY);
  if (!storedHash) return null;
  const hash = sha256(`${username}:${password}`);
  if (storedHash !== hash) return null;

  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  let expired = false;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (typeof exp === 'number' && exp * 1000 <= Date.now()) {
      expired = true;
    }
  } catch {
    expired = true;
  }
  await AsyncStorage.setItem('auth:isLoggedIn', 'true');
  return { token, expired };
}
