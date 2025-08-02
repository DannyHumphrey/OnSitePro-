export function getNestedValue(obj: any, path: (string | number)[]) {
  return path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function setNestedValue(
  obj: any,
  path: (string | number)[],
  value: any,
): any {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  if (rest.length === 0) {
    clone[key as any] = value;
  } else {
    clone[key as any] = setNestedValue(
      obj ? obj[key as any] : undefined,
      rest,
      value,
    );
  }
  return clone;
}

export function parsePath(key: string): (string | number)[] {
  return key.split('.').map((part) => (/^[0-9]+$/.test(part) ? Number(part) : part));
}

import type { VisibleWhen, VisibleWhenCondition, FormSchema, FormField } from '../fields/types';

function evaluateCondition(
  condition: VisibleWhenCondition,
  state: Record<string, any>,
  localContext?: Record<string, any>,
): boolean {
  const value = getNestedValue(localContext ?? state, parsePath(condition.key));
  if ('equals' in condition) {
    return value === condition.equals;
  }
  if ('notEquals' in condition) {
    return value !== condition.notEquals;
  }
  return true;
}

export function evaluateVisibleWhen(
  rule: VisibleWhen | undefined,
  state: Record<string, any>,
  localContext?: Record<string, any>,
): boolean {
  if (!rule) return true;
  const allPass = rule.all ? rule.all.every((c) => evaluateCondition(c, state, localContext)) : true;
  const anyPass = rule.any ? rule.any.some((c) => evaluateCondition(c, state, localContext)) : true;
  return allPass && anyPass;
}

export function getVisibleFields(
  schema: FormSchema,
  state: Record<string, any>,
): { field: FormField; path: (string | number)[] }[] {
  const fields: { field: FormField; path: (string | number)[] }[] = [];

  const traverseSections = (
    sections: FormSchema,
    basePath: (string | number)[],
  ) => {
    sections.forEach((section) => {
      const currentPath = [...basePath, section.key];
      if (section.repeatable) {
        const rows: Record<string, any>[] = getNestedValue(state, currentPath) ?? [];
        rows.forEach((row, idx) => {
          traverseFields(section.fields, [...currentPath, idx], row);
        });
      } else {
        const row: Record<string, any> = getNestedValue(state, currentPath) ?? {};
        traverseFields(section.fields, currentPath, row);
      }
    });
  };

  const traverseFields = (
    fs: FormField[],
    basePath: (string | number)[],
    localContext: Record<string, any>,
  ) => {
    fs.forEach((f) => {
      if (f.type === 'section') {
        if (evaluateVisibleWhen(f.visibleWhen, state, localContext)) {
          traverseSections([f], basePath);
        }
      } else if (evaluateVisibleWhen(f.visibleWhen, state, localContext)) {
        fields.push({ field: f, path: [...basePath, f.key] });
      }
    });
  };

  traverseSections(schema, []);
  return fields;
}
