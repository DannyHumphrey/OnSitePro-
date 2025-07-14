import { RefObject } from 'react';
import { ScrollView } from 'react-native';
import { FormSchema } from '../fields/types';
import { getNestedValue, getVisibleFields } from '../utils/formUtils';

export function validateForm(
  schema: FormSchema,
  formState: Record<string, any>,
  setFormErrors: (v: Record<string, string>) => void,
  setExpandedSections: (v: Record<string, boolean>) => void,
  setErroredSections: (v: Record<string, boolean>) => void,
  scrollRef: RefObject<ScrollView | null>,
  sectionPositions: RefObject<Record<string, number>>,
) {
  const fields = getVisibleFields(schema, formState);
  const errors: Record<string, string> = {};
  fields.forEach(({ field, path }) => {
    if (field.required) {
      const val = getNestedValue(formState, path);
      const empty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);
      if (empty) {
        errors[path.join('.')] = 'Required';
      }
    }
  });
  setFormErrors(errors);

  const errorKeys = Object.keys(errors);
  const newExpanded: Record<string, boolean> = {};
  const newErrored: Record<string, boolean> = {};
  const erroredOrder: string[] = [];
  schema.forEach((section) => {
    if (section.repeatable) {
      const rows: any[] = formState[section.key] ?? [];
      rows.forEach((_row, idx) => {
        const prefix = `${section.key}.${idx}.`;
        const hasErr = errorKeys.some((k) => k.startsWith(prefix));
        const secKey = `${section.key}.${idx}`;
        newExpanded[secKey] = hasErr;
        if (hasErr) {
          newErrored[secKey] = true;
          erroredOrder.push(secKey);
        }
      });
    } else {
      const prefix = `${section.key}.`;
      const hasErr = errorKeys.some((k) => k.startsWith(prefix));
      newExpanded[section.key] = hasErr;
      if (hasErr) {
        newErrored[section.key] = true;
        erroredOrder.push(section.key);
      }
    }
  });
  setExpandedSections(newExpanded);
  setErroredSections(newErrored);

  if (erroredOrder.length > 0) {
    const firstKey = erroredOrder[0];
    const y = sectionPositions.current[firstKey];
    if (y !== undefined) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y, animated: true });
      }, 50);
    }
  }

  return { isValid: errorKeys.length === 0, errors };
}

export function getPhotoFields(
  schema: FormSchema,
  formState: Record<string, any>,
) {
  const fields = getVisibleFields(schema, formState);
  const photos: { key: string; uri: string }[] = [];
  fields.forEach(({ field, path }) => {
    if (field.type === 'photo') {
      const val = getNestedValue(formState, path);
      if (Array.isArray(val)) {
        val.forEach((uri: string, idx: number) => {
          photos.push({ key: `${path.join('.')}.${idx}`, uri });
        });
      }
    } else if (field.type === 'signature' || field.type === 'imageSelect') {
      const uri = getNestedValue(formState, path);
      if (typeof uri === 'string' && uri) {
        photos.push({ key: path.join('.'), uri });
      }
    }
  });
  return photos;
}
