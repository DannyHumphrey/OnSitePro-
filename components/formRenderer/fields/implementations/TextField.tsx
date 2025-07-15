import React from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { styles } from '../../styles';
import { FormField } from '../types';

type Props = {
  field: Extract<FormField, { type: 'text' }>;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function TextField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  return (
    <View style={styles.fieldContainer} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        style={[styles.textInput, error && styles.errorInput]}
        value={value}
        editable={!readOnly}
        onChangeText={onChange}
        mode='outlined'
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
