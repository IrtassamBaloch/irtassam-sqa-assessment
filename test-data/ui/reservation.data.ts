export interface ReservationSearchData {
  checkin: string;
  checkout: string;
}

export interface ReservationGuestData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

export function createValidReservationData(seed = Date.now()): ReservationSearchData {
  const checkin = new Date();
  checkin.setUTCDate(checkin.getUTCDate() + 45 + (seed % 240));
  const checkout = new Date(checkin);
  checkout.setUTCDate(checkout.getUTCDate() + 2);
  return {
    checkin: checkin.toISOString().slice(0, 10),
    checkout: checkout.toISOString().slice(0, 10),
  };
}

export const reversedDateReservationData: ReservationSearchData = Object.freeze({
  checkin: '2026-09-10',
  checkout: '2026-09-09',
});

export const reservationGuestData: Readonly<ReservationGuestData> = Object.freeze({
  firstname: 'SQA',
  lastname: 'Automation',
  email: 'sqa-reservation@example.com',
  phone: '01234567890',
});

export function createReservationGuestData(suffix: string): ReservationGuestData {
  return {
    firstname: 'SQA',
    lastname: `Guest-${suffix}`,
    email: `sqa-${suffix}@example.com`,
    phone: '01234567890',
  };
}
