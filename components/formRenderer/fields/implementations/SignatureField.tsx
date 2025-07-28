import * as FileSystem from 'expo-file-system';
import React, { useRef, useState } from 'react';
import { Button, Image, LayoutChangeEvent, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Signature from 'react-native-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import { styles } from '../../styles';
import { FormField } from '../types';

type Props = {
  field: Extract<FormField, { type: 'signature' }>;
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function SignatureField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const sigUri = value;
  const signatureRef = useRef<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSaveSignature = async (dataUrl: string) => {
    if (readOnly) return;

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const formsDir = `${FileSystem.documentDirectory}forms/`;

    try {
      await FileSystem.makeDirectoryAsync(formsDir, { intermediates: true });
    } catch {}

    const filename = `${uuidv4()}.png`;
    const dest = formsDir + filename;

    await FileSystem.writeAsStringAsync(dest, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    onChange(dest);
    setModalVisible(false);
  };

  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>

      {sigUri ? (
        <View style={{ gap: 8 }}>
          <TouchableOpacity onPress={() => setPreview(sigUri)}>
            <Image source={{ uri: sigUri }} style={styles.signatureImage} />
          </TouchableOpacity>
          {!readOnly && (
            <Button
              title="Redo"
              onPress={() => {
                onChange(undefined);
              }}
            />
          )}
        </View>
      ) : (
        !readOnly && <Button title="Add Signature" onPress={() => setModalVisible(true)} />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {preview && (
        <Modal transparent visible onRequestClose={() => setPreview(null)}>
          <TouchableOpacity style={styles.previewContainer} onPress={() => setPreview(null)}>
            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
          </TouchableOpacity>
        </Modal>
      )}

      {modalVisible && (
        <Modal visible animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <Signature
              ref={signatureRef}
              onOK={handleSaveSignature}
              onEmpty={() => setModalVisible(false)}
              style={{ flex: 1 }}
            />
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}
