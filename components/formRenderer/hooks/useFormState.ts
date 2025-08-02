import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FormSchema, FormSection, FormField } from '../fields/types';
import { getNestedValue, setNestedValue } from '../utils/formUtils';

export function useFormState(schema: FormSchema, initialData?: Record<string, any>) {
  function createEmptySection(section: FormSection): Record<string, any> {
    const obj: Record<string, any> = {};
    section.fields.forEach((f) => {
      if (f.type === 'section') {
        obj[f.key] = f.repeatable ? [] : createEmptySection(f);
      } else {
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
      }
    });
    return obj;
  }

  function buildSection(section: FormSection, data: any): Record<string, any> {
    const base = createEmptySection(section);
    const result: Record<string, any> = { ...base };
    section.fields.forEach((f) => {
      if (f.type === 'section') {
        if (f.repeatable) {
          const arr = (data?.[f.key] as any[]) ?? [];
          result[f.key] = arr.map((entry) => buildSection(f, entry));
        } else {
          result[f.key] = buildSection(f, data?.[f.key] ?? {});
        }
      } else if (f.type === 'photo') {
        const val = data?.[f.key];
        if (val === undefined || val === null) {
          result[f.key] = [];
        } else if (Array.isArray(val)) {
          result[f.key] = val;
        } else {
          result[f.key] = [val];
        }
      } else {
        if (data && Object.prototype.hasOwnProperty.call(data, f.key)) {
          result[f.key] = data[f.key];
        }
      }
    });
    return result;
  }

  function buildInitialState() {
    const state: Record<string, any> = {};
    schema.forEach((section) => {
      if (section.repeatable) {
        const initialArr = (initialData?.[section.key] as any[]) ?? [];
        state[section.key] = initialArr.map((entry) => buildSection(section, entry));
      } else {
        state[section.key] = buildSection(section, initialData?.[section.key] ?? {});
      }
    });
    return state;
  }

  const [formState, setFormState] = useState<Record<string, any>>(buildInitialState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  function buildInstanceMaps(
    sections: FormSchema,
    basePath: (string | number)[],
    data: Record<string, any>,
    ids: Record<string, string[]>,
    names: Record<string, string[]>,
  ) {
    sections.forEach((section) => {
      const currentPath = [...basePath, section.key];
      const pathKey = currentPath.join('.');
      if (section.repeatable) {
        const arr: any[] = getNestedValue(data, currentPath) ?? [];
        ids[pathKey] = Array.from({ length: arr.length }, () => uuidv4());
        names[pathKey] = Array.from({ length: arr.length }, (_, i) => `${section.label} ${i + 1}`);
        arr.forEach((row, idx) => {
          buildInstanceMaps(section.fields.filter((f): f is FormSection => f.type === 'section'), [...currentPath, idx], row, ids, names);
        });
      } else {
        const row: Record<string, any> = getNestedValue(data, currentPath) ?? {};
        buildInstanceMaps(section.fields.filter((f): f is FormSection => f.type === 'section'), currentPath, row, ids, names);
      }
    });
  }

  const [instanceIds, setInstanceIds] = useState<Record<string, string[]>>(() => {
    const ids: Record<string, string[]> = {};
    buildInstanceMaps(schema, [], buildInitialState(), ids, {});
    return ids;
  });
  const [instanceNames, setInstanceNames] = useState<Record<string, string[]>>(() => {
    const names: Record<string, string[]> = {};
    buildInstanceMaps(schema, [], buildInitialState(), {}, names);
    return names;
  });
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);

  const buildExpandedState = (
    sections: FormSchema,
    basePath: (string | number)[],
    data: Record<string, any>,
  ): Record<string, boolean> => {
    const expanded: Record<string, boolean> = {};
    sections.forEach((section) => {
      const currentPath = [...basePath, section.key];
      const pathKey = currentPath.join('.');
      if (section.repeatable) {
        const arr: any[] = getNestedValue(data, currentPath) ?? [];
        for (let i = 0; i < arr.length; i++) {
          expanded[`${pathKey}.${i}`] = false;
          Object.assign(
            expanded,
            buildExpandedState(
              section.fields.filter((f): f is FormSection => f.type === 'section'),
              [...currentPath, i],
              getNestedValue(data, [...currentPath, i]) ?? {},
            ),
          );
        }
      } else {
        expanded[pathKey] = false;
        Object.assign(
          expanded,
          buildExpandedState(
            section.fields.filter((f): f is FormSection => f.type === 'section'),
            currentPath,
            getNestedValue(data, currentPath) ?? {},
          ),
        );
      }
    });
    return expanded;
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    buildExpandedState(schema, [], buildInitialState()),
  );
  const [erroredSections, setErroredSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormState(buildInitialState());
      setInstanceIds(() => {
        const ids: Record<string, string[]> = {};
        buildInstanceMaps(schema, [], buildInitialState(), ids, {});
        return ids;
      });
      setInstanceNames(() => {
        const names: Record<string, string[]> = {};
        buildInstanceMaps(schema, [], buildInitialState(), {}, names);
        return names;
      });
      setExpandedSections(buildExpandedState(schema, [], buildInitialState()));
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
    instanceNames,
    setInstanceNames,
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
