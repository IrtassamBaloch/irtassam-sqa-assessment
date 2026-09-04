import { test, expect } from '@playwright/test';
import { ContactPage } from '../../pages/contactPage';
import { AdminPage } from '../../pages/adminPage';

test.describe('Booking UI tests', () => {
  test('Contact form - happy path @smoke', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();
    await contact.fillForm({
      name: 'QA Tester',
      email: 'qa@example.com',
      phone: '12345678901',
      subject: 'Test Subject',
      message: 'This is a sufficiently long test message for validation.',
    });
    await contact.submit();
    await expect(contact.successMessage).toBeVisible();
  });

  test('Contact form - validation @regression', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.goto();
    await contact.submit();
    await expect(page.getByText('Message must be between 20 and 2000 characters.')).toBeVisible();
  });

  // Asserting on 'Rooms', not 'Logout' - the header shows Logout even when
  // you're logged out, so that locator would pass no matter what. See BUG-REPORT.md.
  test('Admin login @smoke', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.login('admin', 'password');
    await expect(admin.roomsHeading).toBeVisible();
  });

  // Picked the reservation enquiry because it's the money path - it's how a
  // guest actually reaches the hotel, and it fails silently if the form breaks.
  test.describe('Reservation enquiry (chosen additional scenario)', () => {
    test('Book now from a room listing leads to a submitted enquiry @regression', async ({ page }) => {
      const contact = new ContactPage(page);
      await contact.gotoViaBookNow();
      await contact.fillForm({
        name: 'UI Tester',
        email: 'ui.tester@example.com',
        phone: '12345678901',
        subject: 'Reservation',
        message: 'This is a reservation request for testing purposes.',
      });
      await contact.submit();
      await expect(contact.successMessage).toBeVisible();
    });
  });
});
