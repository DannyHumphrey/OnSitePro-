import React from 'react';
import { View, Text, Button, LayoutChangeEvent } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FormField } from '../types';
import { styles } from '../../styles';

type Props = {
  field: Extract<FormField, { type: 'datetime' }>;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  readOnly?: boolean;
  activeDateKey: string | null;
  setActiveDateKey: React.Dispatch<React.SetStateAction<string | null>>;
  fieldKey: string;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function DateTimeField({ field, value, onChange, error, readOnly, activeDateKey, setActiveDateKey, fieldKey, onLayout }: Props) {
  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <Button
        title={value ? new Date(value).toLocaleString() : 'Select Date & Time'}
        onPress={() => setActiveDateKey(fieldKey)}
        disabled={readOnly}
      />
      {activeDateKey === fieldKey && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="datetime"
          display="default"
          onChange={(_e: DateTimePickerEvent, date?: Date) => {
            setActiveDateKey(null);
            if (date) onChange(date.toISOString());
          }}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
