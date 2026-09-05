import { Locator, Page } from '@playwright/test';

export class HomePage {
  private readonly checkinInput: Locator;
  private readonly checkoutInput: Locator;
  private readonly checkAvailabilityButton: Locator;
  private readonly firstBookNowLink: Locator;

  constructor(private readonly page: Page) {
    const bookingSection = page.getByRole('heading', {
      name: 'Check Availability & Book Your Stay',
    }).locator('..');
    this.checkinInput = bookingSection.getByRole('textbox').nth(0);
    this.checkoutInput = bookingSection.getByRole('textbox').nth(1);
    this.checkAvailabilityButton = page.getByRole('button', { name: 'Check Availability' });
    this.firstBookNowLink = page.getByRole('link', { name: 'Book now', exact: true }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async searchAvailability(checkin: string, checkout: string): Promise<void> {
    await this.checkinInput.fill(checkin);
    await this.checkoutInput.fill(checkout);
    await this.checkAvailabilityButton.click();
  }

  async openFirstRoom(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/reservation\/\d+\?/),
      this.firstBookNowLink.click(),
    ]);
  }
}
