import { Locator, Page } from '@playwright/test';
import { adminDashboardText } from '../test-data/ui/admin.data';

export class AdminRoomsPage {
  readonly roomManagement: Locator;

  constructor(private readonly page: Page) {
    this.roomManagement = page.getByText(adminDashboardText, { exact: true }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/rooms');
  }
}
