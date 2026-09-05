import { Locator, Page } from '@playwright/test';

export class ReservationPage {
  readonly negativeNightCount: Locator;
  readonly negativeTotal: Locator;
  readonly reserveButton: Locator;

  constructor(page: Page) {
    this.negativeNightCount = page.getByText(/-1 nights/);
    this.negativeTotal = page.getByText(/Total\s*£-60/);
    this.reserveButton = page.getByRole('button', { name: 'Reserve Now' });
  }
}
