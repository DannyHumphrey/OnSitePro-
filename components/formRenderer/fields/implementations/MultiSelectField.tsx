import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { TextInput, Checkbox, Button } from 'react-native-paper';
import { FormField } from '../types';
import { styles as formStyles } from '../../styles';

interface Option {
  label: string;
  value: string;
}

type Props = {
  field: Extract<FormField, { type: 'multiselect' }>;
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function MultiSelectField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const [visible, setVisible] = useState(false);

  const options: Option[] = useMemo(
    () =>
      field.options.map((o) =>
        typeof o === 'string' ? { label: o, value: o } : o,
      ),
    [field.options],
  );

  const selectedLabels = useMemo(
    () =>
      options
        .filter((o) => value.includes(o.value))
        .map((o) => o.label)
        .join(', '),
    [options, value],
  );

  const toggleValue = (val: string) => {
    if (readOnly) return;
    const current = Array.isArray(value) ? [...value] : [];
    if (current.includes(val)) {
      onChange(current.filter((v) => v !== val));
    } else {
      onChange([...current, val]);
    }
  };

  return (
    <View style={[formStyles.fieldContainer, error && formStyles.errorContainer]} onLayout={onLayout}>
      <Text style={formStyles.label}>{field.label}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => !readOnly && setVisible(true)}>
        <TextInput
          pointerEvents="none"
          editable={false}
          value={selectedLabels}
          mode="outlined"
          style={[formStyles.textInput, error && formStyles.errorInput, formStyles.formTextInput]}
        />
      </TouchableOpacity>
      {error && <Text style={formStyles.errorText}>{error}</Text>}
      <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity style={modalStyles.container} activeOpacity={1}>
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={modalStyles.option}
                  onPress={() => toggleValue(opt.value)}
                  disabled={readOnly}
                >
                  <Checkbox status={value.includes(opt.value) ? 'checked' : 'unchecked'} />
                  <Text>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button mode="contained" onPress={() => setVisible(false)} style={modalStyles.doneButton}>
              Done
            </Button>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 32,
  },
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 4,
    maxHeight: '80%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doneButton: {
    marginTop: 8,
  },
});
