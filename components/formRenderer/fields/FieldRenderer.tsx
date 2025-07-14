import React, { memo } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { FormField } from './types';
import { evaluateVisibleWhen, getNestedValue } from '../utils/formUtils';
import { styles } from '../styles';

import { TextField } from './implementations/TextField';
import { BooleanField } from './implementations/BooleanField';
import { NumberField } from './implementations/NumberField';
import { CurrencyField } from './implementations/CurrencyField';
import { SelectField } from './implementations/SelectField';
import { MultiSelectField } from './implementations/MultiSelectField';
import { BarcodeField } from './implementations/BarcodeField';
import { SignatureField } from './implementations/SignatureField';
import { PhotoField } from './implementations/PhotoField';
import { DateField } from './implementations/DateField';
import { TimeField } from './implementations/TimeField';
import { DateTimeField } from './implementations/DateTimeField';
import { ImageSelectField } from './implementations/ImageSelectField';

export type FieldRendererProps = {
  field: FormField;
  path: (string | number)[];
  formState: Record<string, any>;
  localContext?: Record<string, any>;
  activeDateKey: string | null;
  setActiveDateKey: React.Dispatch<React.SetStateAction<string | null>>;
  handleChange: (path: (string | number)[], value: any) => void;
  error?: string;
  readOnly?: boolean;
  registerFieldPosition: (key: string, y: number) => void;
};

export const FieldRenderer = memo(function FieldRenderer({
  field,
  path,
  formState,
  localContext,
  activeDateKey,
  setActiveDateKey,
  handleChange,
  error,
  readOnly,
  registerFieldPosition,
}: FieldRendererProps) {
  const key = path.join('.');
  const isVisible = React.useMemo(
    () => evaluateVisibleWhen(field.visibleWhen, formState, localContext),
    [formState, localContext, field.visibleWhen],
  );
  const value = getNestedValue(formState, path);
  const onLayout = (e: LayoutChangeEvent) => {
    registerFieldPosition(key, e.nativeEvent.layout.y);
  };

  if (!isVisible) return null;

  const common = {
    fieldKey: key,
    onLayout,
    error,
    readOnly,
    activeDateKey,
    setActiveDateKey,
  } as any;

  switch (field.type) {
    case 'text':
      return (
        <TextField
          {...common}
          field={field}
          value={value}
          onChange={(v: string) => handleChange(path, v)}
        />
      );
    case 'boolean':
      return (
        <BooleanField
          {...common}
          field={field}
          value={!!value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'number':
      return (
        <NumberField
          {...common}
          field={field}
          keyboardType="numeric"
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'decimal':
      return (
        <NumberField
          {...common}
          field={field}
          keyboardType="decimal-pad"
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'currency':
      return (
        <CurrencyField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'select':
      return (
        <SelectField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'multiselect':
      return (
        <MultiSelectField
          {...common}
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'barcode':
      return (
        <BarcodeField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'date':
      return (
        <DateField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'time':
      return (
        <TimeField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'datetime':
      return (
        <DateTimeField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'photo':
      return (
        <PhotoField
          {...common}
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'imageSelect':
      return (
        <ImageSelectField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    case 'signature':
      return (
        <SignatureField
          {...common}
          field={field}
          value={value}
          onChange={(v) => handleChange(path, v)}
        />
      );
    default:
      return null;
  }
});
