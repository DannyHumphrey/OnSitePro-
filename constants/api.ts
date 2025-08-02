import Constants from 'expo-constants';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
  (Constants.manifest?.extra as any)?.apiBaseUrl ||
  'https://uat.onsite-lite.co.uk';

export const FORM_API_BASE_URL: string =
  (Constants.expoConfig?.extra?.formApiBaseUrl as string | undefined) ||
  (Constants.manifest?.extra as any)?.formApiBaseUrl ||
  API_BASE_URL;
