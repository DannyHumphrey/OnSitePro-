import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFormTemplates } from '@/api/formsApi';

const KEY = 'cache:FormTemplates';

export async function getFormTemplatesCached(online: boolean) {
  if (online) {
    const defs = await getFormTemplates();
    await AsyncStorage.setItem(KEY, JSON.stringify(defs));
    return defs;
  }
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
