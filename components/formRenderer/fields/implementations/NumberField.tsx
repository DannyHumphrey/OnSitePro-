import React from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { styles } from '../../styles';
import { FormField } from '../types';

type Props = {
  field: Extract<FormField, { type: 'number' | 'decimal' }>; // used for both
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  error?: string;
  readOnly?: boolean;
  keyboardType?: 'numeric' | 'decimal-pad';
  onLayout: (e: LayoutChangeEvent) => void;
};

export function NumberField({ field, value, onChange, error, readOnly, keyboardType = 'numeric', onLayout }: Props) {
  return (
    <View style={styles.fieldContainer} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        style={[styles.textInput, error && styles.errorInput]}
        keyboardType={keyboardType}
        mode='outlined'
        value={value !== undefined ? String(value) : ''}
        editable={!readOnly}
        onChangeText={(text) => onChange(text === '' ? undefined : keyboardType === 'numeric' ? Number(text) : parseFloat(text))}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
