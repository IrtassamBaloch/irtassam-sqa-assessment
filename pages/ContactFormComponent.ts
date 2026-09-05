import { Page, Locator } from '@playwright/test';
import { ContactData } from '../test-data/ui/contact.data';

export class ContactFormComponent {
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.successMessage = this.page.getByText('Thanks for getting in touch');
  }

  async fill({ name, email, phone, subject, message }: ContactData) {
    await this.page.fill('#name', name);
    await this.page.fill('#email', email);
    await this.page.fill('#phone', phone);
    await this.page.fill('#subject', subject);
    await this.page.fill('#description', message);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Submit' }).first().click();
  }

  validationMessage(text: string): Locator {
    return this.page.getByText(text);
  }
}
