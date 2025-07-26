import type { FormSchema } from '@/components/formRenderer/fields/types';
import { getToken } from './authService';

export type EmbeddedFormResponse = {
  schema: FormSchema;
  data: Record<string, any>;
  formType?: string;
  formName?: string;
};

const API_BASE = 'https://uat.onsite-lite.co.uk/api/Instance/GetEmbeddedForm';

export async function fetchEmbeddedForm(
  userGuid: string,
  surveyGuid: string,
): Promise<EmbeddedFormResponse> {
  const token = await getToken();
  const url = `${API_BASE}?user=${encodeURIComponent(userGuid)}&survey=${encodeURIComponent(surveyGuid)}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as EmbeddedFormResponse;
}
