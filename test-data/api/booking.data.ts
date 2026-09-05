export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: {
    checkin: string;
    checkout: string;
  };
  additionalneeds: string;
}

export function createBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Test',
    lastname: 'User',
    totalprice: 123,
    depositpaid: false,
    bookingdates: { checkin: '2024-01-01', checkout: '2024-01-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
