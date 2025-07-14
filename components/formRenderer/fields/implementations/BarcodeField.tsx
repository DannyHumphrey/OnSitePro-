import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, LayoutChangeEvent } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { FormField } from '../types';
import { styles } from '../../styles';

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
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    if (status === 'granted') {
      setScanVisible(true);
    }
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
        <Modal transparent onRequestClose={() => setScanVisible(false)}>
          <BarCodeScanner
            onBarCodeScanned={({ data }) => {
              setScanVisible(false);
              onChange(data);
            }}
            style={{ flex: 1 }}
          />
        </Modal>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
