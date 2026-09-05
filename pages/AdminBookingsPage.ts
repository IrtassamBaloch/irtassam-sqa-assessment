import { Locator, Page } from '@playwright/test';

export class AdminBookingsPage {
  private openGuestName?: string;

  constructor(private readonly page: Page) {}

  bookingEntry(guestName: string): Locator {
    return this.page.getByText(guestName, { exact: false }).first();
  }

  async roomForBooking(guestName: string): Promise<string> {
    const text = await this.bookingEntry(guestName).innerText();
    const room = text.match(/Room:\s*(\S+)/)?.[1];
    if (!room) throw new Error(`Could not determine room for booking ${guestName}`);
    return room;
  }

  async goto(date: string): Promise<void> {
    await this.page.goto('/admin/report');
    await this.page.getByText('Loading...', { exact: true }).first().waitFor({ state: 'hidden' });
    const target = new Date(`${date}T00:00:00Z`);
    const today = new Date();
    const monthDifference =
      (target.getUTCFullYear() - today.getUTCFullYear()) * 12 +
      target.getUTCMonth() -
      today.getUTCMonth();
    const direction = monthDifference >= 0 ? 'Next' : 'Back';
    for (let month = 0; month < Math.abs(monthDifference); month += 1) {
      const label = this.page.locator('.rbc-toolbar-label');
      const previous = await label.innerText();
      await this.page.getByRole('button', { name: direction, exact: true }).click();
      await label.filter({ hasNotText: previous }).waitFor({ state: 'visible' });
    }
  }

  bookingDetails(guestName = this.openGuestName ?? ''): Locator {
    return this.page.locator('.row', { hasText: guestName }).filter({ has: this.page.locator('.bookingEdit') }).first();
  }

  async openRoomBooking(roomName: string, guestName: string): Promise<void> {
    await this.page.goto('/admin/rooms');
    await this.page.locator('#createRoom').waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.locator('[id^="room"]', { hasText: roomName }).first().click();
    await this.page.getByRole('heading', { name: `Room: ${roomName}` }).waitFor({ state: 'visible' });
    this.openGuestName = guestName;
    await this.bookingDetails().waitFor({ state: 'visible' });
  }

  async updateGuestName(firstname: string, lastname: string): Promise<void> {
    const row = this.bookingDetails();
    await row.locator('.bookingEdit').click();
    await this.page.getByRole('textbox').nth(0).fill(firstname);
    await this.page.getByRole('textbox').nth(1).fill(lastname);
    await this.page.locator('.confirmBookingEdit').click();
    this.openGuestName = lastname;
  }

  async deleteOpenBooking(): Promise<void> {
    const row = this.bookingDetails();
    await row.locator('.bookingDelete').click();
    await row.waitFor({ state: 'detached' });
  }

  async deleteBookingIfPresent(guestName: string, roomName?: string): Promise<void> {
    for (const room of roomName ? [roomName] : ['101', '102', '103']) {
      await this.openRoomBooking(room, guestName).catch(() => undefined);
      const row = this.bookingDetails(guestName);
      if (await row.count()) {
        await row.locator('.bookingDelete').click();
        await row.waitFor({ state: 'detached' });
        return;
      }
    }
  }
}
