import type { FormSchema } from '@/components/FormRenderer';

export type TabParamList = {
  Drafts: undefined;
  Inbox: undefined;
  Outbox: undefined;
  Sent: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Tabs: { screen?: keyof TabParamList } | undefined;
  CreateForm: undefined;
  Form: {
    schema: FormSchema;
    formType?: string;
    formName?: string;
    data?: Record<string, any>;
    draftId?: string;
  };
};
