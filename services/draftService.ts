import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FormSchema } from '@/components/FormRenderer';

export type DraftForm = {
  id: string;
  name: string;
  formType: string;
  schema: FormSchema;
  data: Record<string, any>;
  status: 'draft';
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
};

const INDEX_KEY = 'drafts:index';

export async function saveDraft(draft: DraftForm) {
  await AsyncStorage.setItem(`draft:${draft.id}`, JSON.stringify(draft));
  const indexRaw = await AsyncStorage.getItem(INDEX_KEY);
  const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
  if (!index.includes(draft.id)) {
    index.push(draft.id);
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}

export async function getAllDrafts(): Promise<DraftForm[]> {
  const indexRaw = await AsyncStorage.getItem(INDEX_KEY);
  const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
  const drafts: DraftForm[] = [];
  for (const id of index) {
    const item = await AsyncStorage.getItem(`draft:${id}`);
    if (item) {
      drafts.push(JSON.parse(item) as DraftForm);
    }
  }
  return drafts;
}

export async function getDraftById(id: string): Promise<DraftForm | null> {
  const item = await AsyncStorage.getItem(`draft:${id}`);
  return item ? ((JSON.parse(item) as DraftForm) ?? null) : null;
}
