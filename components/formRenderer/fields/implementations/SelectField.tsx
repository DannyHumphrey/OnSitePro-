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
import { TextInput, Checkbox } from 'react-native-paper';
import { FormField } from '../types';
import { styles as formStyles } from '../../styles';

type Props = {
  field: Extract<FormField, { type: 'select' }>;
  value: string | null;
  onChange: (val: string | null) => void;
  error?: string;
  readOnly?: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

interface Option {
  label: string;
  value: string;
}

export function SelectField({ field, value, onChange, error, readOnly, onLayout }: Props) {
  const [visible, setVisible] = useState(false);

  const options: Option[] = useMemo(() => field.options, [field.options]);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  const selectValue = (val: string) => {
    if (readOnly) return;
    onChange(val);
    setVisible(false);
  };

  return (
    <View style={[formStyles.fieldContainer, error && formStyles.errorContainer]} onLayout={onLayout}>
      <Text style={formStyles.label}>{field.label}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => !readOnly && setVisible(true)}>
        <TextInput
          pointerEvents="none"
          editable={false}
          value={selectedLabel}
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
                  onPress={() => selectValue(opt.value)}
                  disabled={readOnly}
                >
                  <Checkbox status={value === opt.value ? 'checked' : 'unchecked'} />
                  <Text>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
});
