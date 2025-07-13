import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

/**
 * Remove sent forms older than 7 days along with any locally stored images.
 * Returns the number of deleted forms.
 */
export async function cleanupOldSentForms(): Promise<number> {
  const indexRaw = await AsyncStorage.getItem('sent:index');
  const index = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const remaining: string[] = [];
  let removed = 0;

  for (const id of index) {
    const key = `sent:${id}`;
    const item = await AsyncStorage.getItem(key);
    if (!item) continue;

    try {
      const form = JSON.parse(item) as { updatedAt?: string; data?: any };
      const updatedAt = form.updatedAt ? new Date(form.updatedAt).getTime() : 0;

      if (updatedAt < cutoff) {
        await AsyncStorage.removeItem(key);
        removed += 1;
        const images = findLocalImages(form.data ?? {});
        for (const uri of images) {
          if (uri.startsWith('file://')) {
            try {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (err) {
              console.log('Error deleting image:', err);
            }
          }
        }
      } else {
        remaining.push(id);
      }
    } catch {
      remaining.push(id);
    }
  }

  await AsyncStorage.setItem('sent:index', JSON.stringify(remaining));
  return removed;
}

function findLocalImages(data: any): string[] {
  const images: string[] = [];
  const traverse = (val: any) => {
    if (Array.isArray(val)) {
      val.forEach(traverse);
    } else if (val && typeof val === 'object') {
      Object.values(val).forEach(traverse);
    } else if (typeof val === 'string' && val.startsWith('file://')) {
      images.push(val);
    }
  };
  traverse(data);
  return images;
}
