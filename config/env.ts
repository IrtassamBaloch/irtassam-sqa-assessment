import { existsSync } from 'node:fs';
import path from 'node:path';

// Load .env once, here, so every consumer (playwright.config.ts, page
// objects, test files) just imports `env` without worrying about ordering.
// CI can skip this file entirely and inject the vars directly.
const envPath = path.resolve(__dirname, '..', '.env');
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

// Fails fast with a clear message instead of letting tests run against
// undefined URLs or blank credentials.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and provide a value.`
    );
  }
  return value;
}

export const env = {
  apiBaseUrl: required('API_BASE_URL'),
  apiUsername: required('API_USERNAME'),
  apiPassword: required('API_PASSWORD'),
  uiBaseUrl: required('UI_BASE_URL'),
  uiUsername: required('UI_USERNAME'),
  uiPassword: required('UI_PASSWORD'),
};

// Where the logged-in admin browser session is cached between test runs.
export const ADMIN_AUTH_FILE = 'playwright/.auth/admin.json';
