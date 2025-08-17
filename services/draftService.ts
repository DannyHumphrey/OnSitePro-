import type { FormSchema } from "@/components/formRenderer/fields/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { K } from "./offlineHelpers/keys";
import { LocalInstanceMeta } from "./offlineHelpers/types";

export type DraftForm = {
  id: string;
  name: string;
  formType: string;
  schema: FormSchema;
  data: Record<string, any>;
  status: "draft";
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
};

const getDraftIds = async (): Promise<string[]> => {
  const indexRaw = await AsyncStorage.getItem(K.Drafts);
  const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];

  return index;
};

export async function saveDraft(draftId: string) {
  const index = await getDraftIds();
  if (!index.includes(draftId)) {
    index.push(draftId);
    await AsyncStorage.setItem(K.Drafts, JSON.stringify(index));
  }
}

export async function getAllDrafts(): Promise<LocalInstanceMeta[]> {
  const index = await getDraftIds();
  const drafts: LocalInstanceMeta[] = [];
  for (const id of index) {
    const item = await AsyncStorage.getItem(K.InstanceMeta(id));
    if (item) {
      drafts.push(JSON.parse(item) as LocalInstanceMeta);
    }
  }
  return drafts;
}

export async function getDraftById(id: string): Promise<DraftForm | null> {
  const item = await AsyncStorage.getItem(`draft:${id}`);
  return item ? (JSON.parse(item) as DraftForm) ?? null : null;
}
