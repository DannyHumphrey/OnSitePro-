export type LocalInstanceMeta = {
  id: string;
  formType: string;
  formVersion?: number | null;
  formDefinitionId?: number | null;
  currentState: string;
  version: number;
  etag: string;
  isLocal: boolean;
  createdAt: string;
  schema: any;
  workflow?: any;
};

export type CreateJob = {
  tmpId: string;
  formType: string;
  formVersion?: number | null;
  initialData: any;
  idempotencyKey: string;
};
