import { test, expect, APIRequestContext } from '@playwright/test';
import { env } from '../../config/env';
import {
  BookingData,
  bookingWithoutFirstname,
  createBookingData,
  negativePriceBookingData,
  partialBookingUpdate,
  reversedDateBookingData,
  updatedBookingData,
} from '../../test-data/api/booking.data';

interface CreateBookingResponse {
  bookingid: number;
  booking: BookingData;
}

async function login(request: APIRequestContext): Promise<string> {
  const response = await request.post('/auth', {
    data: { username: env.apiUsername, password: env.apiPassword },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { token?: string; reason?: string };
  if (!body.token) {
    throw new Error(`API authentication failed: ${body.reason ?? 'token missing'}`);
  }
  return body.token;
}

async function createBooking(
  request: APIRequestContext,
  data: BookingData = createBookingData(),
): Promise<CreateBookingResponse> {
  const response = await request.post('/booking', { data });
  expect(response.status()).toBe(200);
  return response.json() as Promise<CreateBookingResponse>;
}

async function deleteBooking(
  request: APIRequestContext,
  id: number,
  token: string,
): Promise<void> {
  await request.delete(`/booking/${id}`, {
    headers: { Cookie: `token=${token}` },
  });
}

test.describe('Booking API', () => {
  test('valid credentials return a token @smoke @sanity', async ({ request }) => {
    const response = await request.post('/auth', {
      data: { username: env.apiUsername, password: env.apiPassword },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).token).toEqual(expect.any(String));
  });

  // The API's documented quirk returns HTTP 200 for rejected credentials, so
  // the reason body, rather than a 4xx status, proves authentication failed.
  test('invalid credentials return the documented reason @regression', async ({ request }) => {
    const response = await request.post('/auth', {
      data: { username: 'wrong', password: 'nope' },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ reason: 'Bad credentials' });
  });

  test('create, get, replace, and delete lifecycle @smoke @sanity', async ({ request }) => {
    const original = createBookingData();
    const created = await createBooking(request, original);
    expect(Number.isInteger(created.bookingid)).toBeTruthy();
    expect(created.bookingid).toBeGreaterThan(0);
    expect(created.booking).toEqual(original);
    expect(typeof created.booking.totalprice).toBe('number');
    expect(typeof created.booking.depositpaid).toBe('boolean');

    const get = await request.get(`/booking/${created.bookingid}`);
    expect(get.status()).toBe(200);
    expect(await get.json()).toEqual(original);

    const token = await login(request);
    const put = await request.put(`/booking/${created.bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: updatedBookingData,
    });
    expect(put.status()).toBe(200);
    expect(await put.json()).toEqual(updatedBookingData);

    const persisted = await request.get(`/booking/${created.bookingid}`);
    expect(persisted.status()).toBe(200);
    expect(await persisted.json()).toEqual(updatedBookingData);

    const deleted = await request.delete(`/booking/${created.bookingid}`, {
      headers: { Cookie: `token=${token}` },
    });
    expect(deleted.status()).toBe(201);
    expect(await deleted.text()).toBe('Created');

    const afterDelete = await request.get(`/booking/${created.bookingid}`);
    expect(afterDelete.status()).toBe(404);
    expect(await afterDelete.text()).toBe('Not Found');
  });

  test('missing and tampered authentication cannot mutate a booking @smoke @regression', async ({ request }) => {
    const original = createBookingData({ firstname: 'Protected' });
    const created = await createBooking(request, original);
    const token = await login(request);

    try {
      const unauthenticatedPut = await request.put(`/booking/${created.bookingid}`, {
        data: updatedBookingData,
      });
      expect(unauthenticatedPut.status()).toBe(403);
      expect(await unauthenticatedPut.text()).toBe('Forbidden');

      const unauthenticatedPatch = await request.patch(`/booking/${created.bookingid}`, {
        data: partialBookingUpdate,
      });
      expect(unauthenticatedPatch.status()).toBe(403);
      expect(await unauthenticatedPatch.text()).toBe('Forbidden');

      const tamperedPatch = await request.patch(`/booking/${created.bookingid}`, {
        headers: { Cookie: 'token=not-a-valid-token' },
        data: partialBookingUpdate,
      });
      expect(tamperedPatch.status()).toBe(403);
      expect(await tamperedPatch.text()).toBe('Forbidden');

      const unauthenticatedDelete = await request.delete(`/booking/${created.bookingid}`);
      expect(unauthenticatedDelete.status()).toBe(403);
      expect(await unauthenticatedDelete.text()).toBe('Forbidden');

      const unchanged = await request.get(`/booking/${created.bookingid}`);
      expect(unchanged.status()).toBe(200);
      expect(await unchanged.json()).toEqual(original);
    } finally {
      await deleteBooking(request, created.bookingid, token);
    }
  });

  // Actual sandbox behavior is HTTP 500 with plain text rather than a 400
  // validation response; this assertion records that defect without masking it.
  test('missing firstname returns an internal server error @regression', async ({ request }) => {
    const response = await request.post('/booking', { data: bookingWithoutFirstname() });
    expect(response.status()).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');
  });

  test('a nonexistent booking returns not found @regression', async ({ request }) => {
    const response = await request.get('/booking/999999999');
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  // Bonus: PATCH is a common source of silent data loss, so this proves fields
  // omitted from the request remain unchanged in both response and storage.
  test('partial update preserves fields not supplied @regression', async ({ request }) => {
    const original = createBookingData({ firstname: `PatchTarget${Date.now()}` });
    const created = await createBooking(request, original);
    const token = await login(request);

    try {
      const patch = await request.patch(`/booking/${created.bookingid}`, {
        headers: { Cookie: `token=${token}` },
        data: partialBookingUpdate,
      });
      expect(patch.status()).toBe(200);
      expect(await patch.json()).toEqual({ ...original, ...partialBookingUpdate });

      const persisted = await request.get(`/booking/${created.bookingid}`);
      expect(await persisted.json()).toEqual({ ...original, ...partialBookingUpdate });
    } finally {
      await deleteBooking(request, created.bookingid, token);
    }
  });

  // Bonus: create can return success even when indexing fails; this checks the
  // new record reaches the collection without relying on shared list ordering.
  test('booking list includes the test-created record @regression', async ({ request }) => {
    const created = await createBooking(request, createBookingData({ firstname: 'ListCheck' }));
    const token = await login(request);

    try {
      const response = await request.get('/booking');
      expect(response.status()).toBe(200);
      const items = (await response.json()) as Array<{ bookingid: number }>;
      expect(items.some(({ bookingid }) => bookingid === created.bookingid)).toBeTruthy();
    } finally {
      await deleteBooking(request, created.bookingid, token);
    }
  });

  // Bonus: reversed dates threaten availability and billing calculations, so
  // the regression pins the sandbox's observed validation gap.
  test('checkout before checkin is wrongly accepted @regression', async ({ request }) => {
    const created = await createBooking(request, reversedDateBookingData);
    const token = await login(request);

    try {
      expect(created.booking.bookingdates).toEqual({
        checkin: '2026-09-10',
        checkout: '2026-09-09',
      });
    } finally {
      await deleteBooking(request, created.bookingid, token);
    }
  });

  test('negative total price is wrongly accepted @regression', async ({ request }) => {
    const created = await createBooking(request, negativePriceBookingData);
    const token = await login(request);

    try {
      expect(created.booking.totalprice).toBe(-500);
    } finally {
      await deleteBooking(request, created.bookingid, token);
    }
  });
});
