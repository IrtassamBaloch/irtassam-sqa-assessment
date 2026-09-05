import { test, expect } from '@playwright/test';
import { ContactFormComponent } from '../../pages/ContactFormComponent';
import { HomePage } from '../../pages/HomePage';
import { createContactData, emptyContactData } from '../../test-data/ui/contact.data';

test.describe('Contact form', () => {
  test('submits a valid enquiry @smoke @sanity', async ({ page }, testInfo) => {
    const home = new HomePage(page);
    const contact = new ContactFormComponent(page);
    await home.goto();
    await contact.fill(createContactData(`${testInfo.workerIndex}-${Date.now()}`));
    await contact.submit();
    await expect(contact.successMessage).toBeVisible();
  });

  test('rejects an empty message @regression', async ({ page }) => {
    const home = new HomePage(page);
    const contact = new ContactFormComponent(page);
    await home.goto();
    await contact.fill(emptyContactData);
    await contact.submit();
    await expect(contact.messageLengthError).toBeVisible();
  });
});
