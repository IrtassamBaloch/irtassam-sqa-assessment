import { Locator, Page } from '@playwright/test';
import { ContactData } from '../test-data/ui/contact.data';

export class ContactFormComponent {
  readonly successMessage: Locator;
  readonly messageLengthError: Locator;
  private readonly nameInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly subjectInput: Locator;
  private readonly messageInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.nameInput = page.getByTestId('ContactName');
    this.emailInput = page.getByTestId('ContactEmail');
    this.phoneInput = page.getByTestId('ContactPhone');
    this.subjectInput = page.getByTestId('ContactSubject');
    this.messageInput = page.getByTestId('ContactDescription');
    this.submitButton = page.getByRole('button', { name: 'Submit' }).first();
    this.successMessage = page.getByText('Thanks for getting in touch');
    this.messageLengthError = page.getByText('Message must be between 20 and 2000 characters.');
  }

  async fill(data: ContactData): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.subjectInput.fill(data.subject);
    await this.messageInput.fill(data.message);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
