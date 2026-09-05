import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';
import { adminAuthFile } from './utils/login.utils';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line'], ['html', { open: 'never' }]],
  expect: {
    timeout: 5000,
  },
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /tests[\\/]auth[\\/].*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl, actionTimeout: 5000 },
    },
    {
      name: 'ui-login',
      testMatch: /tests[\\/]ui[\\/]admin-login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl, actionTimeout: 5000 },
    },
    {
      name: 'ui-public',
      testMatch: /tests[\\/]ui[\\/](contact-form|reservation)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl, actionTimeout: 5000 },
    },
    {
      name: 'ui-authenticated',
      testMatch: /tests[\\/]ui[\\/]admin-dashboard\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.uiBaseUrl,
        actionTimeout: 5000,
        storageState: adminAuthFile,
      },
    },
    {
      name: 'api',
      testMatch: /tests[\\/]api[\\/].*\.spec\.ts/,
      use: { baseURL: env.apiBaseUrl, actionTimeout: 15000 },
    },
  ],
});
