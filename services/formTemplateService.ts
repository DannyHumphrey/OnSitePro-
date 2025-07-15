import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FormSchema } from '@/components/formRenderer/fields/types';

export type FormTemplate = {
  id: string;
  name: string;
  schema: FormSchema;
};

const API_ENDPOINT = 'https://uat.onsite-lite.co.uk/api/FormTemplates';
const CACHE_KEY = 'cached_form_types';
const TIMESTAMP_KEY = 'cached_form_types_timestamp';
const CACHE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function fetchFromApi(): Promise<FormTemplate[]> {
  const token = await AsyncStorage.getItem('auth:token');
  const response = await fetch(API_ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as FormTemplate[];
}

export async function refreshFormTemplates(): Promise<FormTemplate[]> {
  const data = await fetchFromApi();
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  await AsyncStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  return data;
}

export async function getFormTemplates(): Promise<FormTemplate[]> {
  try {
    const tsRaw = await AsyncStorage.getItem(TIMESTAMP_KEY);
    const cacheRaw = await AsyncStorage.getItem(CACHE_KEY);
    if (cacheRaw && tsRaw) {
      const ts = Number(tsRaw);
      if (!Number.isNaN(ts) && Date.now() - ts < CACHE_MS) {
        return JSON.parse(cacheRaw) as FormTemplate[];
      }
    }
  } catch (err) {
    console.log('Error reading form template cache:', err);
  }

  try {
    return await refreshFormTemplates();
  } catch (err) {
    console.log('Error fetching form templates:', err);
    return [];
  }
}

export async function getFormTemplatesRefreshDate(): Promise<Date | null> {
  const tsRaw = await AsyncStorage.getItem(TIMESTAMP_KEY);
  if (!tsRaw) return null;
  const ts = Number(tsRaw);
  if (Number.isNaN(ts)) return null;
  return new Date(ts);
}
