import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { v4 as uuidv4 } from 'uuid';

async function processImage(result: ImagePicker.ImagePickerResult): Promise<string | undefined> {
  if (result.canceled) return undefined;
  const asset = result.assets[0];
  let width = asset.width ?? 0;
  let height = asset.height ?? 0;
  const maxDim = Math.max(width, height);
  if (maxDim > 1000) {
    const scale = 1000 / maxDim;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width, height } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  const formsDir = `${FileSystem.documentDirectory}forms/`;
  try {
    await FileSystem.makeDirectoryAsync(formsDir, { intermediates: true });
  } catch {}
  const extension = manipulated.uri.split('.').pop() || 'jpg';
  const filename = `${uuidv4()}.${extension}`;
  const dest = formsDir + filename;
  await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
  return dest;
}

export async function pickImageFromCamera(): Promise<string | undefined> {
  await ImagePicker.requestCameraPermissionsAsync();
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.5,
  });
  return processImage(result);
}

export async function pickImageFromLibrary(): Promise<string | undefined> {
  await ImagePicker.requestMediaLibraryPermissionsAsync();
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.5,
  });
  return processImage(result);
}
