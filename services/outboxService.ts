import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DraftForm } from './draftService';

export type OutboxForm = Omit<DraftForm, 'status'> & { status: 'complete' };

const INDEX_KEY = 'outbox:index';

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
