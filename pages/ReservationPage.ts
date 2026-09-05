import { Locator, Page } from '@playwright/test';
import type { ReservationGuestData } from '../test-data/ui/reservation.data';

export class ReservationPage {
  readonly negativeNightCount: Locator;
  readonly negativeTotal: Locator;
  readonly reserveButton: Locator;
  readonly confirmation: Locator;

  constructor(private readonly page: Page) {
    this.negativeNightCount = page.getByText(/-1 nights/);
    this.negativeTotal = page.getByText(/Total\s*£-60/);
    this.reserveButton = page.getByRole('button', { name: 'Reserve Now' });
    this.confirmation = page.getByText(/booking confirmed/i);
  }

  async completeReservation(guest: ReservationGuestData): Promise<void> {
    await this.reserveButton.click();
    await this.page.getByPlaceholder('Firstname').fill(guest.firstname);
    await this.page.getByPlaceholder('Lastname').fill(guest.lastname);
    await this.page.getByPlaceholder('Email').fill(guest.email);
    await this.page.getByPlaceholder('Phone').fill(guest.phone);
    await this.reserveButton.click();
  }
}
