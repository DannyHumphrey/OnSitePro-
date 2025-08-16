import { getFormTemplates, type FormDefinition } from '@/api/formsApi';
import { useEffect, useMemo, useState } from 'react';

export type AddableForm = {
  key: string;
  label: string;
  icon: string;
  formType: string;
  version: number;
};

export function useAvailableForms(): AddableForm[] {
  const [templates, setTemplates] = useState<FormDefinition[]>([]);

  useEffect(() => {
    getFormTemplates()
      .then(setTemplates)
      .catch((err) => console.log('Error loading form templates', err));
  }, []);

  return useMemo(
    () =>
      templates.map((t) => ({
        key: String(t.formDefinitionId),
        label: t.name,
        icon: 'file-plus',
        formType: t.formType,
        version: t.version,
      })),
    [templates],
  );
}
