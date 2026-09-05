import { defineConfig, devices } from '@playwright/test';
import { env, ADMIN_AUTH_FILE } from './config/env';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  reporter: 'html',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // This is a shared public sandbox, not a real test environment - running
  // UI specs in parallel overloads it and produces flaky timeouts.
  workers: 1,
  use: {
    actionTimeout: 5000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
      use: { baseURL: env.apiBaseUrl },
    },
    {
      name: 'auth-setup',
      testMatch: 'auth/**/*.setup.ts',
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl },
    },
    {
      name: 'ui-login',
      testMatch: 'ui/admin-login.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl },
    },
    {
      name: 'ui-public',
      testMatch: 'ui/contact-form.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl },
    },
    {
      name: 'ui-authenticated',
      testMatch: 'ui/admin-dashboard.spec.ts',
      dependencies: ['auth-setup'],
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl, storageState: ADMIN_AUTH_FILE },
    },
  ],
});
