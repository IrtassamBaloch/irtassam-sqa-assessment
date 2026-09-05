import { test, expect } from '@playwright/test';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';
import { loginAsAdmin } from '../../utils/login.utils';

// Runs in the 'ui-authenticated' project, which loads the storage state saved
// by tests/auth/admin.setup.ts. That reuse is the standard Playwright pattern
// and does save a real round-trip most of the time it's used - but on THIS
// site it's unreliable: a fresh context with a cloned (but valid and
// unexpired) token cookie reproducibly lands on the Login screen, while the
// same cookie set naturally by an in-context login survives reloads fine.
// Looks like Cloudflare/Next.js session-fingerprint behaviour rather than a
// token problem - see BUG-REPORT.md. Logging in for real here so this test
// isn't flaky, while leaving the setup/storageState wiring in place as the
// documented pattern.
test('admin can reach the rooms page @smoke @sanity', async ({ page }) => {
  await loginAsAdmin(page);
  const rooms = new AdminRoomsPage(page);
  // The rooms list is slow to load right after login on this sandbox
  // (looks like backend cold-start) - the default 5s timeout isn't enough.
  await expect(rooms.roomsHeading).toBeVisible({ timeout: 15000 });
});
