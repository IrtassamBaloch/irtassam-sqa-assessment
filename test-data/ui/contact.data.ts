export interface ContactData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export function createContactData(uniqueId: string): ContactData {
  return {
    name: 'SQA Automation',
    email: `sqa-${uniqueId}@example.com`,
    phone: '01234567890',
    subject: `Assessment enquiry ${uniqueId}`,
    message: 'Synthetic contact message created by Playwright automation.',
  };
}

export const emptyContactData: ContactData = Object.freeze({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
});
