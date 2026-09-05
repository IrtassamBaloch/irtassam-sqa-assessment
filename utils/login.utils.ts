import { Page } from '@playwright/test';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { env } from '../config/env';

export async function loginAsAdmin(page: Page) {
  const adminLogin = new AdminLoginPage(page);
  await adminLogin.goto();
  await adminLogin.login(env.uiUsername, env.uiPassword);
}
