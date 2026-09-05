export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface BookingData {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds: string;
}

export type BookingOverrides = Partial<Omit<BookingData, 'bookingdates'>> & {
  bookingdates?: Partial<BookingDates>;
};

const defaultBooking: BookingData = {
  firstname: 'Test',
  lastname: 'User',
  totalprice: 123,
  depositpaid: false,
  bookingdates: {
    checkin: '2026-10-01',
    checkout: '2026-10-05',
  },
  additionalneeds: 'Breakfast',
};

export function createBookingData(overrides: BookingOverrides = {}): BookingData {
  return {
    ...defaultBooking,
    ...overrides,
    bookingdates: {
      ...defaultBooking.bookingdates,
      ...overrides.bookingdates,
    },
  };
}

export const updatedBookingData = createBookingData({
  firstname: 'Updated',
  lastname: 'Booking',
  totalprice: 240,
  depositpaid: true,
  bookingdates: { checkin: '2026-11-10', checkout: '2026-11-14' },
  additionalneeds: 'Late checkout',
});

export const partialBookingUpdate = { firstname: 'Patched' } as const;

export const reversedDateBookingData = createBookingData({
  bookingdates: { checkin: '2026-09-10', checkout: '2026-09-09' },
});

export const negativePriceBookingData = createBookingData({ totalprice: -500 });

export function bookingWithoutFirstname(): Omit<BookingData, 'firstname'> {
  const { firstname: _firstname, ...data } = createBookingData();
  return data;
}
