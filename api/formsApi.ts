import { Platform } from 'react-native';
import { FORM_API_BASE_URL } from '@/constants/api';

export type FormDefinition = {
  formDefinitionId: number;
  formType: string;
  name: string;
  version: number;
  schema: any;
  ui?: any | null;
  workflow?: any | null;
};

export type FormInstanceDto = {
  formInstanceId: number;
  formDefinitionId: number;
  currentState: string;
  version: number;
  data: any;
  etag: string;
};

const base = Platform.OS === 'web' ? '/api' : `${FORM_API_BASE_URL}/api`;

export async function getFormTemplates(): Promise<FormDefinition[]> {
  const r = await fetch(`${base}/FormTemplates`, { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to load templates');
  return r.json();
}

export async function createInstance(
  formType: string,
  formVersion?: number,
  initialData: any = {},
): Promise<FormInstanceDto> {
  const r = await fetch(`${base}/form-instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ formType, formVersion, initialData }),
  });
  if (!r.ok) throw new Error('Failed to create instance');
  const etag = r.headers.get('ETag') ?? '';
  const body = await r.json();
  return { ...body, etag };
}

export async function getInstance(id: number): Promise<FormInstanceDto> {
  const r = await fetch(`${base}/form-instances/${id}`, { credentials: 'include' });
  if (!r.ok) throw new Error('Not found');
  const etag = r.headers.get('ETag') ?? '';
  const body = await r.json();
  return { ...body, etag };
}

export async function saveSection(params: {
  id: number;
  sectionKey: string;
  patch: any[];
  etag: string;
  idempotencyKey: string;
}): Promise<FormInstanceDto & { validation?: any }> {
  const r = await fetch(
    `${base}/form-instances/${params.id}/sections/${encodeURIComponent(params.sectionKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': params.etag,
        'Idempotency-Key': params.idempotencyKey,
      },
      credentials: 'include',
      body: JSON.stringify({ patch: params.patch }),
    },
  );
  if (r.status === 409) throw new Error('Version conflict');
  if (!r.ok) throw new Error('Failed to save section');
  const etag = r.headers.get('ETag') ?? '';
  const body = await r.json();
  return { ...body, etag };
}

export async function transitionInstance(params: {
  id: number;
  transitionKey: string;
  etag: string;
}): Promise<FormInstanceDto & { tasksCreated?: any[] }> {
  const r = await fetch(`${base}/form-instances/${params.id}/transitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': params.etag,
    },
    credentials: 'include',
    body: JSON.stringify({ transitionKey: params.transitionKey }),
  });
  if (r.status === 409) throw new Error('Version conflict');
  if (!r.ok) throw new Error('Transition failed');
  const etag = r.headers.get('ETag') ?? '';
  const body = await r.json();
  return { ...body, etag };
}

export type TaskItem = {
  formTaskId: number;
  formInstanceId: number;
  sectionKey: string;
  roleRequired: string;
  assignedToUserId?: number | null;
  state: number;
  createdUtc: string;
};

export async function getMyOpenTasks(): Promise<TaskItem[]> {
  const r = await fetch(`${base}/tasks?mine=true&state=open`, { credentials: 'include' });
  if (!r.ok) throw new Error('Failed to load tasks');
  return r.json();
}
