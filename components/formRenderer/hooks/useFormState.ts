import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FormSchema, FormSection } from '../fields/types';
import { setNestedValue } from '../utils/formUtils';

export function useFormState(schema: FormSchema, initialData?: Record<string, any>) {
  function createEmptySection(section: FormSection) {
    const obj: Record<string, any> = {};
    section.fields.forEach((f) => {
      switch (f.type) {
        case 'photo':
          obj[f.key] = [];
          break;
        case 'signature':
          obj[f.key] = '';
          break;
        case 'boolean':
          obj[f.key] = false;
          break;
        case 'number':
        case 'decimal':
        case 'currency':
          obj[f.key] = undefined;
          break;
        case 'multiselect':
          obj[f.key] = [];
          break;
        case 'time':
        case 'datetime':
        case 'barcode':
        case 'imageSelect':
          obj[f.key] = '';
          break;
        default:
          obj[f.key] = '';
          break;
      }
    });
    return obj;
  }

  function normalizeSectionData(section: FormSection, data: any) {
    const result: Record<string, any> = { ...data };
    section.fields.forEach((f) => {
      if (f.type === 'photo') {
        const val = result[f.key];
        if (val === undefined || val === null) {
          result[f.key] = [];
        } else if (Array.isArray(val)) {
          result[f.key] = val;
        } else {
          result[f.key] = [val];
        }
      }
    });
    return result;
  }

  function buildInitialState() {
    const state: Record<string, any> = {};
    schema.forEach((section) => {
      if (section.repeatable) {
        const arr: Record<string, any>[] = [];
        const initialArr = (initialData?.[section.key] as any[]) ?? [];
        initialArr.forEach((entry) => {
          arr.push({
            ...createEmptySection(section),
            ...normalizeSectionData(section, entry),
          });
        });
        state[section.key] = arr;
      } else {
        state[section.key] = {
          ...createEmptySection(section),
          ...normalizeSectionData(section, initialData?.[section.key] ?? {}),
        };
      }
    });
    return state;
  }

  const [formState, setFormState] = useState<Record<string, any>>(buildInitialState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [instanceIds, setInstanceIds] = useState<Record<string, string[]>>(() => {
    const ids: Record<string, string[]> = {};
    schema.forEach((section) => {
      if (section.repeatable) {
        const length = ((initialData?.[section.key] as any[]) ?? []).length;
        ids[section.key] = Array.from({ length }, () => uuidv4());
      }
    });
    return ids;
  });
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

  const buildExpandedState = () => {
    const expanded: Record<string, boolean> = {};
    schema.forEach((section) => {
      if (section.repeatable) {
        const length = ((initialData?.[section.key] as any[]) ?? []).length;
        for (let i = 0; i < length; i++) {
          expanded[`${section.key}.${i}`] = false;
        }
      } else {
        expanded[section.key] = false;
      }
    });
    return expanded;
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(buildExpandedState);
  const [erroredSections, setErroredSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormState(buildInitialState());
      setInstanceIds(() => {
        const ids: Record<string, string[]> = {};
        schema.forEach((section) => {
          if (section.repeatable) {
            const length = ((initialData?.[section.key] as any[]) ?? []).length;
            ids[section.key] = Array.from({ length }, () => uuidv4());
          }
        });
        return ids;
      });
      setExpandedSections(buildExpandedState());
      setErroredSections({});
    }
  }, [initialData, schema]);

  const handleChange = (path: (string | number)[], value: any) => {
    setFormState((prev) => setNestedValue(prev, path, value));
    setFormErrors((prev) => {
      const key = path.join('.');
      if (!prev[key]) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  return {
    formState,
    setFormState,
    formErrors,
    setFormErrors,
    instanceIds,
    setInstanceIds,
    activeDateKey,
    setActiveDateKey,
    expandedSections,
    setExpandedSections,
    erroredSections,
    setErroredSections,
    handleChange,
    createEmptySection,
  };
}
