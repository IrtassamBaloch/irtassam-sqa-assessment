import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { createContactData, createReservationEnquiryData, expectedValidationMessage } from '../../test-data/ui/contact.data';

test.describe('Contact form', () => {
  test('happy path submission shows a success message @smoke', async ({ page }, testInfo) => {
    const home = new HomePage(page);
    await home.goto();
    await home.contactForm.fill(createContactData(`${testInfo.workerIndex}-${Date.now()}`));
    await home.contactForm.submit();
    // The submit POST is slow on this sandbox's first hit - see
    // tests/auth/admin.setup.ts for the same cold-start pattern.
    await expect(home.contactForm.successMessage).toBeVisible({ timeout: 15000 });
  });

  test('empty submission shows validation errors @regression', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.contactForm.submit();
    await expect(home.contactForm.validationMessage(expectedValidationMessage)).toBeVisible();
  });

  // Picked the reservation enquiry because it's the money path - it's how a
  // guest actually reaches the hotel, and it fails silently if the form breaks.
  test('Book now from a room listing leads to a submitted enquiry @regression', async ({ page }, testInfo) => {
    const home = new HomePage(page);
    await home.gotoViaBookNow();
    await home.contactForm.fill(createReservationEnquiryData(`${testInfo.workerIndex}-${Date.now()}`));
    await home.contactForm.submit();
    // The submit POST is slow on this sandbox's first hit - see
    // tests/auth/admin.setup.ts for the same cold-start pattern.
    await expect(home.contactForm.successMessage).toBeVisible({ timeout: 15000 });
  });
});
