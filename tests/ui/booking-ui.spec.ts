import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { AdminRoomsPage } from '../../pages/AdminRoomsPage';
import { AdminBookingsPage } from '../../pages/AdminBookingsPage';
import { ContactFormComponent } from '../../pages/ContactFormComponent';
import { HomePage } from '../../pages/HomePage';
import { ReservationPage } from '../../pages/ReservationPage';
import { env } from '../../config/env';
import { invalidAdminCredentials } from '../../test-data/ui/admin.data';
import { createContactData, emptyContactData } from '../../test-data/ui/contact.data';
import {
  createReservationGuestData,
  createValidReservationData,
  reversedDateReservationData,
} from '../../test-data/ui/reservation.data';
import { createRoomData, createUpdatedRoomData } from '../../test-data/ui/room.data';

test.describe('Contact form', () => {
  test('submits a valid enquiry @ui-public @smoke @sanity', async ({ page }, testInfo) => {
    const home = new HomePage(page);
    const contact = new ContactFormComponent(page);
    await home.goto();
    await contact.fill(createContactData(`${testInfo.workerIndex}-${Date.now()}`));
    await contact.submit();
    await expect(contact.successMessage).toBeVisible();
  });

  test('rejects an empty message @ui-public @regression', async ({ page }) => {
    const home = new HomePage(page);
    const contact = new ContactFormComponent(page);
    await home.goto();
    await contact.fill(emptyContactData);
    await contact.submit();
    await expect(contact.messageLengthError).toBeVisible();
  });
});

test.describe('Admin login', () => {
  test('valid credentials reach room management @ui-login @smoke @sanity', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(env.uiUsername, env.uiPassword);
    await expect(page).toHaveURL(/\/admin\/rooms\/?$/);
    await expect(rooms.roomManagement).toBeVisible();
  });

  test('invalid credentials remain logged out @ui-login @regression', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const rooms = new AdminRoomsPage(page);
    await login.goto();
    await login.login(invalidAdminCredentials.username, invalidAdminCredentials.password);
    await expect(login.invalidCredentials).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(rooms.roomManagement).toBeHidden();
  });
});

test('saved authentication opens room management @ui-authenticated @sanity @regression', async ({ page }) => {
  const rooms = new AdminRoomsPage(page);
  await rooms.goto();
  await expect(page).toHaveURL(/\/admin\/rooms\/?$/);
  await expect(rooms.roomManagement).toBeVisible();
});

test('admin creates, reads, updates, and deletes a room through the UI @ui-authenticated @regression', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const rooms = new AdminRoomsPage(page);
  const room = createRoomData(`${testInfo.workerIndex}-${Date.now()}`);
  const updatedRoom = createUpdatedRoomData(room.name);

  await rooms.goto();
  try {
    await rooms.createRoom(room);
    await expect(rooms.roomRow(room.name)).toContainText(
      `${room.name}${room.type}${room.accessible}${room.price}${room.features.join(', ')}`,
    );

    await rooms.openRoom(room.name);
    await rooms.updateRoom(updatedRoom);
    await expect(rooms.roomRow(room.name)).toContainText(
      `${updatedRoom.name}${updatedRoom.type}${updatedRoom.accessible}${updatedRoom.price}${updatedRoom.features.join(', ')}`,
    );
  } finally {
    await rooms.deleteRoomIfPresent(room.name);
  }

  await expect(rooms.roomRow(room.name)).toHaveCount(0);
});

test('guest reservation is created, verified, updated, and deleted through the UI @ui-authenticated @regression', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const home = new HomePage(page);
  const reservation = new ReservationPage(page);
  const bookings = new AdminBookingsPage(page);
  const suffix = `${testInfo.workerIndex}-${Date.now()}`;
  const guest = createReservationGuestData(suffix);
  const dates = createValidReservationData();
  let bookedRoom: string | undefined;

  try {
    await home.goto();
    await home.searchAvailability(dates.checkin, dates.checkout);
    await home.openFirstRoom();
    await reservation.completeReservation(guest);
    await expect(reservation.confirmation).toBeVisible();

    await bookings.goto(dates.checkin);
    await expect(bookings.bookingEntry(guest.lastname)).toBeVisible({ timeout: 30_000 });
    bookedRoom = await bookings.roomForBooking(guest.lastname);

    await bookings.openRoomBooking(bookedRoom, guest.lastname);
    await expect(bookings.bookingDetails()).toContainText(guest.firstname);
    await expect(bookings.bookingDetails()).toContainText(guest.lastname);
    await expect(bookings.bookingDetails()).toContainText(dates.checkin);
    await expect(bookings.bookingDetails()).toContainText(dates.checkout);

    await bookings.updateGuestName(`${guest.firstname}-Updated`, guest.lastname);
    await expect(bookings.bookingDetails()).toContainText(`${guest.firstname}-Updated`);
    await bookings.deleteOpenBooking();
    await expect(bookings.bookingDetails(guest.lastname)).toHaveCount(0);
  } finally {
    await bookings.deleteBookingIfPresent(guest.lastname, bookedRoom);
  }
});

// This additional flow targets the highest-value booking risk found during
// exploration: reversed dates reach pricing and produce a negative stay total.
test.describe('Reservation date validation', () => {
  test('checkout before checkin exposes a negative stay total @ui-public @regression', async ({ page }) => {
    const home = new HomePage(page);
    const reservation = new ReservationPage(page);
    await home.goto();
    await home.searchAvailability(
      reversedDateReservationData.checkin,
      reversedDateReservationData.checkout,
    );
    await home.openFirstRoom();
    await expect(reservation.negativeNightCount).toBeVisible();
    await expect(reservation.negativeTotal).toBeVisible();
    await expect(reservation.reserveButton).toBeEnabled();
  });
});
