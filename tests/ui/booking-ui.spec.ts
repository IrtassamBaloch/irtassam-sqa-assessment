import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';
import { ContactFormComponent } from '../../pages/ContactFormComponent';
import { HomePage } from '../../pages/HomePage';
import { ReservationPage } from '../../pages/ReservationPage';
import { env } from '../../config/env';
import { invalidAdminCredentials } from '../../test-data/ui/admin.data';
import { createContactData, emptyContactData } from '../../test-data/ui/contact.data';
import { reversedDateReservationData } from '../../test-data/ui/reservation.data';

test.describe('Contact form', () => {
  test('submits a valid enquiry @ui-public @smoke @sanity', async ({ page }, testInfo) => {
    const home = new HomePage(page);
    const contact = new ContactFormComponent(page);
    await home.goto();
    await contact.fill(createContactData(`${testInfo.workerIndex}-${Date.now()}`));
    await contact.submit();
    await expect(contact.successMessage).toBeVisible();
  });

  test('rejects an empty message @ui-public @regression', async ({ page }) => {
    const home = new HomePage(page);
    const contact = new ContactFormComponent(page);
    await home.goto();
    await contact.fill(emptyContactData);
    await contact.submit();
    await expect(contact.messageLengthError).toBeVisible();
  });
});

test.describe('Admin login', () => {
  test('valid credentials reach room management @ui-login @smoke @sanity', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(env.uiUsername, env.uiPassword);
    await expect(page).toHaveURL(/\/admin\/rooms\/?$/);
    await expect(rooms.roomManagement).toBeVisible();
  });

  test('invalid credentials remain logged out @ui-login @regression', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(invalidAdminCredentials.username, invalidAdminCredentials.password);
    await expect(login.invalidCredentials).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(rooms.roomManagement).toBeHidden();
  });
});

test('saved authentication opens room management @ui-authenticated @sanity @regression', async ({ page }) => {
  const rooms = new AdminRoomsPage(page);
  await rooms.goto();
  await expect(page).toHaveURL(/\/admin\/rooms\/?$/);
  await expect(rooms.roomManagement).toBeVisible();
});

// This additional flow targets the highest-value booking risk found during
// exploration: reversed dates reach pricing and produce a negative stay total.
test.describe('Reservation date validation', () => {
  test('checkout before checkin exposes a negative stay total @ui-public @regression', async ({ page }) => {
    const home = new HomePage(page);
    const reservation = new ReservationPage(page);
    await home.goto();
    await home.searchAvailability(
      reversedDateReservationData.checkin,
      reversedDateReservationData.checkout,
    );
    await home.openFirstRoom();
    await expect(reservation.negativeNightCount).toBeVisible();
    await expect(reservation.negativeTotal).toBeVisible();
    await expect(reservation.reserveButton).toBeEnabled();
  });
});
