import { test, expect } from '@playwright/test';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';

test('saved authentication opens room management @sanity @regression', async ({ page }) => {
  const rooms = new AdminRoomsPage(page);
  await rooms.goto();
  await expect(page).toHaveURL(/\/admin\/rooms\/?$/);
  await expect(rooms.roomManagement).toBeVisible();
});
