import type { FormSchema } from "@/components/formRenderer/fields/types";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type DraftsStackParamList = {
  DraftsScreen: undefined;
};

export type MainTabParamList = {
  DraftsTab: NavigatorScreenParams<DraftsStackParamList>;
  InboxTab: undefined;
  MyTasksTab: undefined;
  OutboxTab: undefined;
  SentTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CreateFormScreen: undefined;
  FormScreen: {
    schema: FormSchema;
    formType?: string;
    formName?: string;
    data?: Record<string, any>;
    draftId?: string;
    readOnly?: boolean;
  };
  EmbeddedFormScreen: {
    user?: string;
    survey?: string;
    readOnly?: boolean | string;
  };
  FormBuilderScreen: undefined;
  FormInstance: { id: number | string; sectionKey?: string };
};
