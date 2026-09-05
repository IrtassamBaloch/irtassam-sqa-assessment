export interface ContactData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

// uniqueId keeps parallel/repeated runs from colliding on the same email/subject.
export function createContactData(uniqueId: string): ContactData {
  return {
    name: 'QA Tester',
    email: `qa-${uniqueId}@example.com`,
    phone: '12345678901',
    subject: `Test Subject ${uniqueId}`,
    message: 'This is a sufficiently long test message for validation.',
  };
}

export function createReservationEnquiryData(uniqueId: string): ContactData {
  return {
    name: 'UI Tester',
    email: `ui-tester-${uniqueId}@example.com`,
    phone: '12345678901',
    subject: 'Reservation',
    message: 'This is a reservation request for testing purposes.',
  };
}

export const expectedValidationMessage = 'Message must be between 20 and 2000 characters.';
