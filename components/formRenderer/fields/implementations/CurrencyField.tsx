import React from 'react';
import { LayoutChangeEvent, Text, TextInput, View } from 'react-native';
import { styles } from '../../styles';
import { FormField } from '../types';

type Props = {
  field: Extract<FormField, { type: 'currency' }>;
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function CurrencyField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  return (
    <View style={styles.fieldContainer} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>{field.currencySymbol ?? '£'}</Text>
        <TextInput
          style={[styles.textInput, { flex: 1 }, error && styles.errorInput]}
          keyboardType="decimal-pad"
          value={value !== undefined ? String(value) : ''}
          editable={!readOnly}
          onChangeText={(text) => onChange(text === '' ? undefined : parseFloat(text))}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
