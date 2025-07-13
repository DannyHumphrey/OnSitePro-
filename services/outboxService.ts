import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import * as FileSystem from 'expo-file-system';
import type { DraftForm } from './draftService';

export type OutboxForm = Omit<DraftForm, 'status'> & { status: 'complete' };

const INDEX_KEY = 'outbox:index';
const SENT_INDEX_KEY = 'sent:index';
const SYNC_ENDPOINT = 'https://uat.onsite-lite.co.uk/api/Instance/SaveInstance';

async function convertImagesToBase64(obj: any): Promise<any> {
  if (Array.isArray(obj)) {
    const arr = [] as any[];
    for (const item of obj) {
      if (typeof item === 'string' && item.startsWith('file://')) {
        try {
          const base64 = await FileSystem.readAsStringAsync(item, {
            encoding: FileSystem.EncodingType.Base64,
          });
          arr.push(`data:image/jpeg;base64,${base64}`);
        } catch {
          arr.push(null);
        }
      } else if (Array.isArray(item) || (item && typeof item === 'object')) {
        arr.push(await convertImagesToBase64(item));
      } else {
        arr.push(item);
      }
    }
    return arr;
  }

  if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string' && value.startsWith('file://')) {
        try {
          const base64 = await FileSystem.readAsStringAsync(value, {
            encoding: FileSystem.EncodingType.Base64,
          });
          newObj[key] = `data:image/jpeg;base64,${base64}`;
        } catch {
          newObj[key] = null;
        }
      } else if (Array.isArray(value) || (value && typeof value === 'object')) {
        newObj[key] = await convertImagesToBase64(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }

  return obj;
}

export async function getAllOutbox(): Promise<OutboxForm[]> {
  const indexRaw = await AsyncStorage.getItem(INDEX_KEY);
  const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
  const forms: OutboxForm[] = [];
  for (const id of index) {
    const item = await AsyncStorage.getItem(`outbox:${id}`);
    if (item) {
      forms.push(JSON.parse(item) as OutboxForm);
    }
  }
  return forms;
}

export async function syncOutbox() {
  const indexRaw = await AsyncStorage.getItem(INDEX_KEY);
  let ids = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];

  for (const id of [...ids]) {
    try {
      const item = await AsyncStorage.getItem(`outbox:${id}`);
      if (!item) continue;
      const form = JSON.parse(item) as OutboxForm;
      const token = await AsyncStorage.getItem('auth:token');
      if (!token) throw new Error('Missing auth token');

      const decoded = jwtDecode<{ UserID: string }>(token);

      const base64Data = await convertImagesToBase64(form.data);

      const payload = {
        Active: true,
        Address1: form.data.Address1 || '',
        Address2: form.data.Address2 || '',
        Address3: form.data.Address3 || '',
        City: form.data.City || '',
        Contact: form.data.Contact || '',
        Postcode: form.data.Postcode || '',
        Telephone: form.data.Telephone || '',
        Address: `${form.data.Address1}, ${form.data.Address2}, ${form.data.Postcode}`.trim(),
        Name: form.name,
        StartedDateTime: form.createdAt,
        SubmittedDateTime: '0001-01-01T00:00:00',
        Status: 0,
        SurveyCount: 1,
        SyncedDateTime: null,
        UserInfoId: Number((decoded as any).UserID),
        Id: 0,
        guid: form.id,
        Surveys: [base64Data],
      };

      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const sentForm = { ...form, isSynced: true };
      await AsyncStorage.setItem(`sent:${id}`, JSON.stringify(sentForm));

      const sentIndexRaw = await AsyncStorage.getItem(SENT_INDEX_KEY);
      const sentIndex = sentIndexRaw ? (JSON.parse(sentIndexRaw) as string[]) : [];
      if (!sentIndex.includes(id)) {
        sentIndex.push(id);
        await AsyncStorage.setItem(SENT_INDEX_KEY, JSON.stringify(sentIndex));
      }

      await AsyncStorage.removeItem(`outbox:${id}`);
      ids = ids.filter((i) => i !== id);
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
    } catch (err) {
      console.log('Error syncing form', id, err);
    }
  }
}
