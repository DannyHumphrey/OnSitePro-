import React from 'react';
import { View, Text, Switch, LayoutChangeEvent } from 'react-native';
import { FormField } from '../types';
import { styles } from '../../styles';

type Props = {
  field: Extract<FormField, { type: 'multiselect' }>;
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function MultiSelectField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      {field.options.map((opt) => {
        const selected = Array.isArray(value) ? value.includes(opt) : false;
        return (
          <View key={opt} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch
              value={selected}
              onValueChange={(val) => {
                const current: string[] = Array.isArray(value) ? [...value] : [];
                if (val) {
                  if (!current.includes(opt)) current.push(opt);
                } else {
                  const idx = current.indexOf(opt);
                  if (idx > -1) current.splice(idx, 1);
                }
                onChange(current);
              }}
              disabled={readOnly}
            />
            <Text>{opt}</Text>
          </View>
        );
      })}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
