import React, { useState } from 'react';
import { View, Text, Button, Image, Modal, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { FormField } from '../types';
import { styles } from '../../styles';

import { pickImageFromCamera } from '../../utils/imageUtils';

type Props = {
  field: Extract<FormField, { type: 'photo' }>;
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function PhotoField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const photos: string[] = Array.isArray(value) ? value : [];
  const [preview, setPreview] = useState<string | null>(null);

  const handleAdd = async () => {
    const uri = await pickImageFromCamera();
    if (uri) {
      onChange([...photos, uri]);
    }
  };

  const handleRemove = (idx: number) => {
    if (readOnly) return;
    const updated = photos.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      {!readOnly && <Button title="Take Photo" onPress={handleAdd} />}
      <View style={styles.photoList}>
        {photos.map((uri, idx) => (
          <View key={uri} style={styles.photoWrapper}>
            <TouchableOpacity onPress={() => setPreview(uri)}>
              <Image source={{ uri }} style={styles.thumbnail} />
            </TouchableOpacity>
            {!readOnly && <Button title="Delete" onPress={() => handleRemove(idx)} />}
          </View>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {preview && (
        <Modal transparent visible onRequestClose={() => setPreview(null)}>
          <TouchableOpacity style={styles.previewContainer} onPress={() => setPreview(null)}>
            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
