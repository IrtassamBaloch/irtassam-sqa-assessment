import { Page, Locator } from '@playwright/test';

export class AdminPage {
  readonly roomsHeading: Locator;

  constructor(private readonly page: Page) {
    this.roomsHeading = page.getByText('Rooms').first();
  }

  async goto() {
    await this.page.goto('https://automationintesting.online/admin/');
  }

  async login(username: string, password: string) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }
}
