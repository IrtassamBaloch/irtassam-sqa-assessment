import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';
import { env } from '../../config/env';
import { invalidAdminCredentials } from '../../test-data/ui/admin.data';

test.describe('Admin login', () => {
  test('valid credentials reach room management @smoke @sanity', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(env.uiUsername, env.uiPassword);
    await expect(page).toHaveURL(/\/admin\/rooms\/?$/);
    await expect(rooms.roomManagement).toBeVisible();
  });

  test('invalid credentials remain logged out @regression', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(invalidAdminCredentials.username, invalidAdminCredentials.password);
    await expect(login.invalidCredentials).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(rooms.roomManagement).toBeHidden();
  });
});
