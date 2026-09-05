# Bug report

About half an hour of poking at the API and the UI. Everything below I reproduced
against the live sandbox — the status codes and response bodies are copied from the
actual requests, not from the docs.

**Environment:** Chromium via Playwright, and curl. API at
`https://restful-booker.herokuapp.com`, UI at `https://automationintesting.online`.

---

### Bug 1: Reversed dates produce a negative stay price while reservation remains enabled

**Severity:** High
**Layer:** UI / business logic
**Environment:** Chromium, `GET /reservation/1?checkin=2026-09-10&checkout=2026-09-09`

**Steps to Reproduce:**
1. Enter check-in `10/09/2026` and check-out `09/09/2026`.
2. Select **Check Availability**.
3. Open the Single room returned by the search.
4. Inspect the price summary and reservation action.

**Expected Result:**
The reversed date range is rejected before rooms are offered, and reservation cannot continue.

**Actual Result:**
The application offers rooms with the reversed dates in their links. The Single room summary displays `£100 x -1 nights`, subtotal `£-100`, and `Total £-60`; **Reserve Now** remains enabled.

**Why This Matters:**
The UI permits a logically impossible stay with a negative payable total. A user can proceed toward a reservation that downstream billing and inventory systems cannot safely interpret.

---

### Bug 2: Double and Suite cards use Single Room alternative text

**Severity:** Low
**Layer:** UI accessibility
**Environment:** Chromium, homepage room listing

**Steps to Reproduce:**
1. Open the homepage.
2. Inspect the accessible names of the Single, Double, and Suite room images.

**Expected Result:**
Each image describes its associated room, or decorative images use empty alternative text.

**Actual Result:**
All three images expose the accessible name `Single Room`, including the Double and Suite cards.

**Why This Matters:**
Screen-reader users receive incorrect room context, making the card content misleading and harder to compare.

---

### Bug 3: Booking accepted with checkout before checkin

**Severity:** High
**Layer:** API
**Environment:** `POST /booking`

**Steps to Reproduce:**
1. POST a booking with the dates the wrong way round — checkin `2024-06-10`,
   checkout `2024-06-01` — everything else valid.

```bash
curl -X POST https://restful-booker.herokuapp.com/booking \
  -H 'Content-Type: application/json' \
  -d '{"firstname":"Rev","lastname":"Dates","totalprice":50,"depositpaid":true,
       "bookingdates":{"checkin":"2024-06-10","checkout":"2024-06-01"}}'
```

**Expected Result:**
`400 Bad Request` — checkout can't be before checkin.

**Actual Result:**
`200 OK`, stored exactly as sent:

```json
{"bookingid":4464,"booking":{"firstname":"Rev","lastname":"Dates","totalprice":50,
 "depositpaid":true,"bookingdates":{"checkin":"2024-06-10","checkout":"2024-06-01"}}}
```

**Why This Matters:**
A stay of minus nine nights isn't a booking, and anything downstream that subtracts
those two dates now has a negative night count to deal with.

---

### Bug 4: Booking accepted with a negative price

**Severity:** High
**Layer:** API
**Environment:** `POST /booking`

**Steps to Reproduce:**
1. POST a booking with `"totalprice": -500`, everything else valid.

**Expected Result:**
`400 Bad Request` — price can't be negative.

**Actual Result:**
`200 OK`, stored with `"totalprice":-500` (bookingid 4481).

**Why This Matters:**
A negative price is a credit, and this endpoint needs no authentication, so anyone
who can reach it can issue themselves one.

---

### Bug 5: Missing required field returns 500 instead of 400

**Severity:** Medium
**Layer:** API
**Environment:** `POST /booking`

**Steps to Reproduce:**
1. POST a booking with no `firstname`, `Content-Type: application/json`.

**Expected Result:**
`400 Bad Request`, ideally naming the field that's missing.

**Actual Result:**
`500 Internal Server Error`, body is the plain text `Internal Server Error` — not JSON.

(Worth noting: it's `500` for form-encoded too. The behaviour is consistent across
content types, it's just the wrong status class.)

**Why This Matters:**
A 5xx tells the client the server broke and the request is worth retrying, so clients
will sit there retrying something that can never succeed.

---

### Bug 6: Failed login returns HTTP 200

**Severity:** Medium
**Layer:** API
**Environment:** `POST /auth`

**Steps to Reproduce:**
1. POST `{"username":"wrong","password":"nope"}` to `/auth`.

**Expected Result:**
`401 Unauthorized`.

**Actual Result:**
`200 OK` with `{"reason":"Bad credentials"}`.

**Why This Matters:**
Every client and proxy treats 200 as success, so the usual `if (response.ok)` check
sails through with an undefined token and the failure only shows up later as a
confusing 403.

---

### Bug 7: Logged-out users see a "Logout" link

**Severity:** Low
**Layer:** UI
**Environment:** `https://automationintesting.online/admin/`, Chromium 151.0.7922.34 (via Playwright)

**Steps to Reproduce:**
1. Open `/admin/` in a fresh session, never logged in.
2. Enter `admin` / `totally-wrong` and submit.
3. Look at the header.

**Expected Result:**
Just "Front Page" while logged out. "Logout" shows up after you actually log in.

**Actual Result:**
The header reads `Front Page  Logout  Login  Invalid credentials` — a Logout link
sitting next to the login form. Same with a wrong password, a bad password, or no
session at all.

**Why This Matters:**
Beyond looking broken, "Logout" is the obvious thing to assert on when testing that
login worked — and a test written that way would pass whether or not login works.

---

## Smaller things, not worth filing

- `DELETE /booking/{id}` returns `201 Created`. Wrong code for a delete, but the
  delete itself is fine — the record is `404` afterwards.
- Deleting something already deleted gives `405 Method Not Allowed`, not `404`.
- The API and the UI want different admin passwords (`password123` and `password`)
  even though they present as the same product. Not a bug, but it cost me time.

## Things I checked that were fine

- `DELETE` without a token is properly refused with `403`, and the booking is still
  there afterwards — the authorisation is real, not just a status code.
- `GET` on an id that doesn't exist returns `404`.
- `/auth` takes JSON and form-encoded bodies equally happily, both `200` with a token.
- The contact form does reject a message under 20 characters.
