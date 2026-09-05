export interface ReservationSearchData {
  checkin: string;
  checkout: string;
}

export const validReservationData: ReservationSearchData = Object.freeze({
  checkin: '2026-09-20',
  checkout: '2026-09-22',
});

export const reversedDateReservationData: ReservationSearchData = Object.freeze({
  checkin: '2026-09-10',
  checkout: '2026-09-09',
});

export const reservationGuestData = Object.freeze({
  firstname: 'SQA',
  lastname: 'Automation',
  email: 'sqa-reservation@example.com',
  phone: '01234567890',
});
