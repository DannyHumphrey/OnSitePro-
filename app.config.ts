import type { ExpoConfig } from '@expo/config-types';
import 'dotenv/config';

const ENV = process.env.APP_ENV || 'dev';

const DEFAULT_API_URL = 'https://uat.onsite-lite.co.uk';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_URL;
const FORM_API_URL =
  process.env.EXPO_PUBLIC_FORM_API_BASE_URL || API_URL;

debugger;

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl: API_URL,
    formApiBaseUrl: FORM_API_URL,
    appEnv: ENV,
  },
});
