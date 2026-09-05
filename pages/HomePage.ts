import { Page } from '@playwright/test';
import { ContactFormComponent } from './ContactFormComponent';

export class HomePage {
  readonly contactForm: ContactFormComponent;

  constructor(private readonly page: Page) {
    this.contactForm = new ContactFormComponent(page);
  }

  // Client-rendered SPA, so we land on the homepage and let it render
  // the form rather than hitting a form URL directly.
  async goto() {
    await this.page.goto('/');
  }

  // Same form, reached from a room's "Book now" instead of the nav.
  async gotoViaBookNow() {
    await this.page.goto('/');
    await this.page.getByRole('link', { name: 'Book now' }).first().click();
  }
}
