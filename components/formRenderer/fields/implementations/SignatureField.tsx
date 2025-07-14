import React, { useRef, useState } from 'react';
import { View, Text, Button, Image, Modal, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Signature from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import { FormField } from '../types';
import { styles } from '../../styles';

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
  const [preview, setPreview] = useState<string | null>(null);
  const signatureRef = useRef<any>(null);
  const [showPad, setShowPad] = useState(!sigUri);

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
    setShowPad(false);
  };

  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      {showPad && !readOnly ? (
        <>
          <Signature
            ref={signatureRef}
            onOK={handleSaveSignature}
            webStyle=".m-signature-pad--footer { display: none; margin: 0px; }"
          />
          <Button title="Clear" onPress={() => signatureRef.current?.clearSignature()} />
        </>
      ) : sigUri ? (
        <View style={{ gap: 8 }}>
          <TouchableOpacity onPress={() => setPreview(sigUri)}>
            <Image source={{ uri: sigUri }} style={styles.signatureImage} />
          </TouchableOpacity>
          {!readOnly && (
            <Button
              title="Redo"
              onPress={() => {
                onChange(undefined);
                setShowPad(true);
              }}
            />
          )}
        </View>
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
