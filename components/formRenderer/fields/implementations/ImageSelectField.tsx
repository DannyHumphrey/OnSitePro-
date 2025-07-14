import React, { useState } from 'react';
import { View, Text, Button, Image, Modal, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { FormField } from '../types';
import { styles } from '../../styles';
import { pickImageFromLibrary } from '../../utils/imageUtils';

type Props = {
  field: Extract<FormField, { type: 'imageSelect' }>;
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function ImageSelectField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const imgUri = value;
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) onChange(uri);
  };

  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      {!readOnly && <Button title="Select Image" onPress={handleSelect} />}
      {imgUri ? (
        <TouchableOpacity onPress={() => setPreview(imgUri)}>
          <Image source={{ uri: imgUri }} style={styles.thumbnail} />
        </TouchableOpacity>
      ) : null}
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
