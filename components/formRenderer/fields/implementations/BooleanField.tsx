import React from 'react';
import { View, Text, Switch, LayoutChangeEvent } from 'react-native';
import { FormField } from '../types';
import { styles } from '../../styles';

type Props = {
  field: Extract<FormField, { type: 'boolean' }>;
  value: boolean;
  onChange: (val: boolean) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function BooleanField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <Switch value={!!value} onValueChange={onChange} disabled={readOnly} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
