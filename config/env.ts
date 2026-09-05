import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and provide a value.`,
    );
  }

  return value.replace(/\/$/, '');
}

export const env = Object.freeze({
  apiBaseUrl: required('API_BASE_URL'),
  apiUsername: required('API_USERNAME'),
  apiPassword: required('API_PASSWORD'),
  uiBaseUrl: required('UI_BASE_URL'),
  uiUsername: required('UI_USERNAME'),
  uiPassword: required('UI_PASSWORD'),
});
