import { test as setup, expect } from '@playwright/test';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';
import { loginAsAdmin } from '../../utils/login.utils';
import { ADMIN_AUTH_FILE } from '../../config/env';

setup('authenticate as admin', async ({ page }) => {
  await loginAsAdmin(page);
  const rooms = new AdminRoomsPage(page);
  // The rooms list is slow to load right after login on this sandbox
  // (looks like backend cold-start) - the default 5s timeout isn't enough.
  await expect(rooms.roomsHeading).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
