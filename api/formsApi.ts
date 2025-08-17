import { FORM_API_BASE_URL } from '@/constants/api';
import { Platform } from 'react-native';
import { getToken } from '../services/authService';

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

function extractEtag(r: Response, body: any): string {
  const header = r.headers.get('ETag');
  if (header) return header;
  if (body?.etag) return body.etag;
  const id = body?.formInstanceId ?? body?.id;
  const version = body?.version;
  return id !== undefined && version !== undefined ? `${id}:${version}` : '';
}

export async function getFormTemplates(): Promise<FormDefinition[]> {
  const token = await getToken();
  const r = await fetch(`${base}/formTemplates`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!r.ok) throw new Error('Failed to load templates');
  return r.json();
}

export async function createInstance(
  formType: string,
  formVersion?: number,
  initialData: any = {},
  idempotencyKey?: string,
): Promise<FormInstanceDto> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const bodyPayload: any = { formType, formVersion, initialData };
  if (idempotencyKey) bodyPayload.clientGeneratedId = idempotencyKey;
  const r = await fetch(`${base}/form-instances`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
  });
  if (!r.ok) throw new Error('Failed to create instance');
  const body = await r.json();
  const etag = extractEtag(r, body);
  return { ...body, etag };
}

export async function getInstance(id: number): Promise<FormInstanceDto> {
  const token = await getToken();

  const r = await fetch(`${base}/form-instances/${id}`,
    { credentials: 'include', headers: {
        Authorization: `Bearer ${token}`
      }, });
  if (!r.ok) throw new Error('Not found');
  const body = await r.json();
  const etag = extractEtag(r, body);
  return { ...body, etag };
}

export async function saveSection(params: {
  id: number;
  sectionKey: string;
  patch: any[];
  etag: string;
  idempotencyKey: string;
}): Promise<FormInstanceDto & { validation?: any } & { state?: string }> {
  const token = await getToken();

  const r = await fetch(
    `${base}/form-instances/${params.id}/sections/${encodeURIComponent(params.sectionKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': params.etag,
        'Idempotency-Key': params.idempotencyKey,
        Authorization: `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ patch: params.patch }),
    },
  );
  if (r.status === 409) throw new Error('Version conflict');
  if (!r.ok) throw new Error('Failed to save section');
  const body = await r.json();
  const etag = extractEtag(r, body);
  return { ...body, etag };
}

export async function transitionInstance(params: {
  id: number;
  transitionKey: string;
  etag: string;
}): Promise<FormInstanceDto & { tasksCreated?: any[] }> {
  const token = await getToken();
  const r = await fetch(`${base}/form-instances/${params.id}/transitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': params.etag,
      Authorization: `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify({ transitionKey: params.transitionKey }),
  });
  if (r.status === 409) throw new Error('Version conflict');
  if (!r.ok) throw new Error('Transition failed');
  const body = await r.json();
  const etag = extractEtag(r, body);
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
