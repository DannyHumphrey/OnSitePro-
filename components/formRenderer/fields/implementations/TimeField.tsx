import React from 'react';
import { View, Text, Button, LayoutChangeEvent } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FormField } from '../types';
import { styles } from '../../styles';

type Props = {
  field: Extract<FormField, { type: 'time' }>;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  readOnly?: boolean;
  activeDateKey: string | null;
  setActiveDateKey: React.Dispatch<React.SetStateAction<string | null>>;
  fieldKey: string;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function TimeField({ field, value, onChange, error, readOnly, activeDateKey, setActiveDateKey, fieldKey, onLayout }: Props) {
  return (
    <View style={[styles.fieldContainer, error && styles.errorContainer]} onLayout={onLayout}>
      <Text style={styles.label}>{field.label}</Text>
      <Button
        title={value ? value : 'Select Time'}
        onPress={() => setActiveDateKey(fieldKey)}
        disabled={readOnly}
      />
      {activeDateKey === fieldKey && (
        <DateTimePicker
          value={value ? new Date(`1970-01-01T${value}`) : new Date()}
          mode="time"
          display="default"
          onChange={(_e: DateTimePickerEvent, date?: Date) => {
            setActiveDateKey(null);
            if (date) {
              const h = date.getHours().toString().padStart(2, '0');
              const m = date.getMinutes().toString().padStart(2, '0');
              onChange(`${h}:${m}`);
            }
          }}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
