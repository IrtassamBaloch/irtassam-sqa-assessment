import { Page, Locator } from '@playwright/test';

export class AdminRoomsPage {
  readonly roomsHeading: Locator;

  constructor(private readonly page: Page) {
    // The header shows "Logout" even when logged out, so "Rooms" is the
    // locator that actually tells the two states apart. See BUG-REPORT.md.
    this.roomsHeading = this.page.getByText('Rooms').first();
  }

  async goto() {
    await this.page.goto('/admin/');
  }
}
