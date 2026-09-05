import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { env } from '../../config/env';
import { loginAsAdmin, adminAuthFile } from '../../utils/login.utils';

setup('authenticate admin', async ({ page }) => {
  await loginAsAdmin(page, {
    username: env.uiUsername,
    password: env.uiPassword,
  });
  await expect(page).toHaveURL(/\/admin\/rooms\/?$/, { timeout: 30_000 });
  await mkdir(dirname(adminAuthFile), { recursive: true });
  await page.context().storageState({ path: adminAuthFile });
});
