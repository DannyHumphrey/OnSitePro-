import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { FormField } from '../types';
import { styles } from '../../styles';

type Props = {
  field: Extract<FormField, { type: 'select' }>;
  value: string | null;
  onChange: (val: string | null) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function SelectField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldContainer} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <DropDownPicker
        open={open}
        value={value}
        items={field.options}
        setOpen={setOpen}
        setValue={(cb) => onChange(cb(value))}
        disabled={readOnly}
        style={[styles.dropdown, error && styles.errorInput]}
        dropDownContainerStyle={styles.dropdownContainer}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
