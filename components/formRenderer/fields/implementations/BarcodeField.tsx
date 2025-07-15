import { Camera, CameraView } from 'expo-camera';
import React, { useState } from 'react';
import { Button, LayoutChangeEvent, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles';
import { FormField } from '../types';

type Props = {
  field: Extract<FormField, { type: 'barcode' }>;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function BarcodeField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const [scanVisible, setScanVisible] = useState(false);

  const startScan = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setScanVisible(true);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanVisible(false);
    onChange(data);
  };

  return (
    <View style={styles.fieldContainer} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          style={[styles.textInput, { flex: 1 }, error && styles.errorInput]}
          value={value}
          editable={!readOnly}
          onChangeText={onChange}
        />
        {!readOnly && <Button title="Scan" onPress={startScan} />}
      </View>
      {scanVisible && (
        <Modal transparent animationType="slide" onRequestClose={() => setScanVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            <CameraView
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "pdf417", 'codabar'],
              }}
              style={{ flex: 1 }}
            />
            <View style={{ position: 'absolute', bottom: 40, right: 20 }}>
              <TouchableOpacity onPress={() => setScanVisible(false)}>
                <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
