import { Page } from '@playwright/test';
import { resolve } from 'node:path';
import { AdminLoginPage } from '../pages/AdminLoginPage';

export const adminAuthFile = resolve('playwright/.auth/admin.json');

interface AdminCredentials {
  username: string;
  password: string;
}

export async function loginAsAdmin(
  page: Page,
  credentials: AdminCredentials,
): Promise<void> {
  const login = new AdminLoginPage(page);
  await login.goto();
  await login.login(credentials.username, credentials.password);
}
