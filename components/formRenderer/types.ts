import type { FormSchema } from './fields/types';

export type FormRendererProps = {
  schema: FormSchema;
  initialData?: Record<string, any>;
  readOnly?: boolean;
};

export type FormRendererRef = {
  getFormData: () => Record<string, unknown>;
  validateForm: () => { isValid: boolean; errors: Record<string, string> };
  openSection: (key: string) => void;
  scrollToSection: (key: string) => void;
  scrollToField: (key: string) => void;
  getSectionErrorMap: () => Record<string, boolean>;
  getPhotoFields: () => { key: string; uri: string }[];
};
