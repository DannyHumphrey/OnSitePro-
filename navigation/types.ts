import type { NavigatorScreenParams } from "@react-navigation/native";
import type { FormSchema } from "@/components/formRenderer/fields/types";

export type DraftsStackParamList = {
  DraftsScreen: undefined;
};

export type MainTabParamList = {
  DraftsTab: NavigatorScreenParams<DraftsStackParamList>;
  InboxTab: undefined;
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
};
