import { test, expect, APIRequestContext } from '@playwright/test';

const apiBase = 'https://restful-booker.herokuapp.com';

// Note: the API password is 'password123', not the 'password' in the brief.
// That one only works on the UI admin panel.
async function login(request: APIRequestContext) {
  const resp = await request.post(`${apiBase}/auth`, {
    data: { username: 'admin', password: 'password123' },
  });
  return (await resp.json()).token;
}

function booking(overrides = {}) {
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

test.describe('Booking API tests', () => {
  test('POST /auth with valid credentials @smoke', async ({ request }) => {
    const resp = await request.post(`${apiBase}/auth`, {
      data: { username: 'admin', password: 'password123' },
    });
    expect(resp.status()).toBe(200);
    expect((await resp.json()).token).toBeTruthy();
  });

  // Bad credentials come back as 200, not 401. Asserting the reason string
  // since the status tells us nothing.
  test('POST /auth with invalid credentials @regression', async ({ request }) => {
    const resp = await request.post(`${apiBase}/auth`, {
      data: { username: 'wrong', password: 'nope' },
    });
    expect(resp.status()).toBe(200);
    expect((await resp.json()).reason).toBe('Bad credentials');
  });

  test('Create, Get, Update, Delete booking lifecycle @smoke', async ({ request }) => {
    const data = booking();

    const create = await request.post(`${apiBase}/booking`, { data });
    expect(create.status()).toBe(200);
    const created = await create.json();
    expect(typeof created.bookingid).toBe('number');

    // Checking types too - a stringified "123" would sneak past a shape-only check.
    expect(created.booking).toEqual(data);
    expect(typeof created.booking.totalprice).toBe('number');
    expect(typeof created.booking.depositpaid).toBe('boolean');

    const id = created.bookingid;

    const get = await request.get(`${apiBase}/booking/${id}`);
    expect(get.status()).toBe(200);
    expect((await get.json()).firstname).toBe(data.firstname);

    const token = await login(request);

    const put = await request.put(`${apiBase}/booking/${id}`, {
      headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
      data: booking({ firstname: 'Updated' }),
    });
    expect(put.status()).toBe(200);
    expect((await put.json()).firstname).toBe('Updated');

    // Delete returns 201, oddly. Pinning the exact code - a loose [200, 201]
    // would keep passing if it ever changed.
    const del = await request.delete(`${apiBase}/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
    expect(del.status()).toBe(201);

    const after = await request.get(`${apiBase}/booking/${id}`);
    expect(after.status()).toBe(404);
  });

  test('PUT /booking/:id without an auth token returns 403 @smoke', async ({ request }) => {
    const create = await request.post(`${apiBase}/booking`, {
      data: booking({ firstname: 'NoAuth' }),
    });
    const id = (await create.json()).bookingid;

    const put = await request.put(`${apiBase}/booking/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: booking({ firstname: 'Hijacked' }),
    });
    expect(put.status()).toBe(403);

    // Also check nothing changed. A 403 with the write landing anyway
    // would be the worse bug.
    const after = await request.get(`${apiBase}/booking/${id}`);
    expect((await after.json()).firstname).toBe('NoAuth');
  });

  // Missing a required field gives a 500, not a 400. See BUG-REPORT.md.
  test('POST /booking with missing firstname returns 500 @regression', async ({ request }) => {
    const { firstname, ...withoutFirstname } = booking();
    const resp = await request.post(`${apiBase}/booking`, { data: withoutFirstname });
    expect(resp.status()).toBe(500);
  });

  test('GET non-existent booking returns 404 @regression', async ({ request }) => {
    const resp = await request.get(`${apiBase}/booking/999999999`);
    expect(resp.status()).toBe(404);
  });

  // Added this one because PATCH is easy to get wrong - it should touch only the
  // field you send and leave the rest alone.
  test('Partial update (PATCH) only changes the field sent @regression', async ({ request }) => {
    const create = await request.post(`${apiBase}/booking`, {
      data: booking({ firstname: 'Patch' }),
    });
    const id = (await create.json()).bookingid;
    const token = await login(request);

    const patch = await request.patch(`${apiBase}/booking/${id}`, {
      headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
      data: { firstname: 'Patched' },
    });
    expect(patch.status()).toBe(200);

    const patched = await patch.json();
    expect(patched.firstname).toBe('Patched');
    // The fields we didn't send should be untouched.
    expect(patched.lastname).toBe('User');
    expect(patched.totalprice).toBe(123);

    await request.delete(`${apiBase}/booking/${id}`, { headers: { Cookie: `token=${token}` } });
  });

  // And this one because create can succeed while the record never shows up
  // in the list - worth checking both.
  test('List bookings includes newly created booking @regression', async ({ request }) => {
    const create = await request.post(`${apiBase}/booking`, {
      data: booking({ firstname: 'List' }),
    });
    const id = (await create.json()).bookingid;

    const list = await request.get(`${apiBase}/booking`);
    expect(list.status()).toBe(200);
    const items = await list.json();
    // Only checking our own booking is there - it's a shared sandbox, so
    // length and ordering aren't ours to assert on.
    expect(items.find((i: any) => i.bookingid === id)).toBeTruthy();
  });

  // Bug 1. Asserts what it does today, not what it should do.
  // Flip to 400 when validation gets added.
  test('Booking with checkout before checkin is wrongly accepted @regression', async ({ request }) => {
    const resp = await request.post(`${apiBase}/booking`, {
      data: booking({ bookingdates: { checkin: '2024-06-10', checkout: '2024-06-01' } }),
    });
    expect(resp.status()).toBe(200);
    const dates = (await resp.json()).booking.bookingdates;
    expect(dates.checkout < dates.checkin).toBeTruthy();
  });

  // Bug 2. Same idea - pins the bug so the fix can't land unnoticed.
  test('Booking with negative totalprice is wrongly accepted @regression', async ({ request }) => {
    const resp = await request.post(`${apiBase}/booking`, {
      data: booking({ totalprice: -500 }),
    });
    expect(resp.status()).toBe(200);
    expect((await resp.json()).booking.totalprice).toBe(-500);
  });
});
