import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';
import { env } from '../../config/env';
import { invalidAdminCredentials } from '../../test-data/ui/admin.data';

// Runs in the 'ui-login' project, which starts logged out - the auth-setup
// project's saved session must not leak in here.
test.describe('Admin login', () => {
  test('valid credentials log the admin in @smoke @sanity', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(env.uiUsername, env.uiPassword);
    // See tests/auth/admin.setup.ts - the rooms list is slow right after login.
    await expect(rooms.roomsHeading).toBeVisible({ timeout: 15000 });
  });

  // Asserting on 'Rooms', not 'Logout' - the header shows Logout even when
  // you're logged out, so that locator would pass no matter what. See BUG-REPORT.md.
  test('invalid credentials show an error and stay logged out @regression', async ({ page }) => {
    const login = new AdminLoginPage(page);
    await login.goto();
    await login.login(invalidAdminCredentials.username, invalidAdminCredentials.password);
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });
});
