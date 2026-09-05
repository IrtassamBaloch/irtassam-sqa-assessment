import { Locator, Page } from '@playwright/test';
import { adminDashboardText } from '../test-data/ui/admin.data';
import type { RoomData } from '../test-data/ui/room.data';

export class AdminRoomsPage {
  readonly roomManagement: Locator;

  constructor(private readonly page: Page) {
    this.roomManagement = page.getByText(adminDashboardText, { exact: true }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/rooms');
    await this.page.locator('#createRoom').waitFor({ state: 'visible', timeout: 30_000 });
  }

  roomRow(name: string): Locator {
    return this.page.locator('[id^="room"]', { hasText: name }).first();
  }

  async createRoom(room: RoomData): Promise<void> {
    await this.page.locator('#roomName').fill(room.name);
    await this.page.locator('#type').selectOption(room.type);
    await this.page.locator('#accessible').selectOption(String(room.accessible));
    await this.page.locator('#roomPrice').fill(room.price);
    await this.setFeatures(room.features);
    await this.page.locator('#createRoom').click();
    await this.roomRow(room.name).waitFor({ state: 'visible' });
  }

  async openRoom(name: string): Promise<void> {
    await this.roomRow(name).click();
    await this.page.waitForURL(/\/admin\/room\/\d+/);
    await this.page.getByRole('heading', { name: `Room: ${name}` }).waitFor({ state: 'visible' });
  }

  async updateRoom(room: RoomData): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await this.page.locator('#roomName').waitFor({ state: 'visible' });
    await this.page.locator('#roomName').fill(room.name);
    await this.page.locator('#type').selectOption(room.type);
    await this.page.locator('#accessible').selectOption(String(room.accessible));
    await this.page.locator('#roomPrice').fill(room.price);
    await this.setFeatures(room.features);
    await this.page.getByRole('button', { name: /update/i }).click();
    await this.page.getByRole('button', { name: 'Edit', exact: true }).waitFor({ state: 'visible' });
    await this.goto();
  }

  async deleteRoomIfPresent(name: string): Promise<void> {
    if (!this.page.url().includes('/admin/rooms')) {
      await this.goto();
    }
    const row = this.roomRow(name);
    if (await row.count()) {
      await row.locator('.roomDelete').click();
      await row.waitFor({ state: 'detached' });
    }
  }

  private async setFeatures(features: RoomData['features']): Promise<void> {
    const allFeatures: RoomData['features'] = [
      'WiFi',
      'TV',
      'Radio',
      'Refreshments',
      'Safe',
      'Views',
    ];
    for (const feature of allFeatures) {
      await this.page
        .getByRole('checkbox', { name: feature, exact: true })
        .setChecked(features.includes(feature));
    }
  }
}
