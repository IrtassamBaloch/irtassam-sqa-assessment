import { Page, Locator } from '@playwright/test';

type ContactDetails = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export class ContactPage {
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.successMessage = page.getByText('Thanks for getting in touch');
  }

  // The site is a client-rendered SPA, so we land on the homepage and let it
  // render the form rather than hitting a URL directly.
  async goto() {
    await this.page.goto('https://automationintesting.online/');
  }

  // Same form, reached from a room's "Book now" instead of the nav.
  async gotoViaBookNow() {
    await this.page.goto('https://automationintesting.online/');
    await this.page.getByRole('link', { name: 'Book now' }).first().click();
  }

  async fillForm({ name, email, phone, subject, message }: ContactDetails) {
    await this.page.fill('#name', name);
    await this.page.fill('#email', email);
    await this.page.fill('#phone', phone);
    await this.page.fill('#subject', subject);
    await this.page.fill('#description', message);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Submit' }).first().click();
  }
}
