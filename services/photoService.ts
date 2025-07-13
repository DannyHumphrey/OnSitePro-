import * as FileSystem from 'expo-file-system';

export async function deleteLocalPhoto(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (err) {
    console.log('Error deleting photo:', err);
  }
}
