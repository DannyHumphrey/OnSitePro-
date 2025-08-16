import { getFormTemplates, type FormTemplate } from '@/services/formTemplateService';
import { useEffect, useMemo, useState } from 'react';

export type AddableForm = {
  key: string;
  label: string;
  icon: string;
  routeName: string;
  params?: Record<string, unknown>;
  enabled?: boolean;
};

export function useAvailableForms(): AddableForm[] {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);

  useEffect(() => {
    getFormTemplates()
      .then(setTemplates)
      .catch((err) => console.log('Error loading form templates', err));
  }, []);

  return useMemo(
    () =>
      templates
        .map((t) => ({
          key: t.id,
          label: t.name,
          icon: 'file-plus',
          routeName: 'FormScreen',
          params: { schema: t.schema, formType: t.id, formName: t.name },
          enabled: true,
        }))
        .filter((f) => f.enabled !== false),
    [templates],
  );
}
