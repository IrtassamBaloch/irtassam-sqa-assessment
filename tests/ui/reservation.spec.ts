import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ReservationPage } from '../../pages/ReservationPage';
import { reversedDateReservationData } from '../../test-data/ui/reservation.data';

test('checkout before checkin exposes a negative stay total @regression', async ({ page }) => {
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
