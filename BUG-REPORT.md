# Bug Report

I spent approximately 30 minutes exploring the API and UI. Each finding below was reproduced against the live public sandbox.

### Bug 1: Reversed booking dates produce a negative stay total

**Severity:** High
**Layer:** Both
**Environment:** Chromium 151.0.7922.34; `GET /reservation/1?checkin=2026-09-10&checkout=2026-09-09`; `POST https://restful-booker.herokuapp.com/booking`

**Steps to Reproduce:**
1. Enter check-in `10/09/2026` and check-out `09/09/2026` on the booking page.
2. Select **Check Availability** and open the Single room.
3. Inspect the price summary and reservation action.
4. Separately, POST a booking whose `checkin` is `2026-09-10` and `checkout` is `2026-09-09`.

**Expected Result:**
Both layers reject checkout before checkin with a validation response, and the UI prevents reservation.

**Actual Result:**
The API returns `200 OK` and stores the reversed dates. The UI displays `£100 x -1 nights`, subtotal `£-100`, and `Total £-60`; **Reserve Now** remains enabled.

**Why This Matters:**
Guests can proceed with an impossible stay and negative payable amount, corrupting availability and billing behavior.

---

### Bug 2: API accepts a negative booking price

**Severity:** High
**Layer:** API
**Environment:** `POST https://restful-booker.herokuapp.com/booking`

**Steps to Reproduce:**
1. POST an otherwise valid booking with `"totalprice": -500`.
2. Inspect the response body.

**Expected Result:**
The API returns `400 Bad Request` because a booking price cannot be negative.

**Actual Result:**
The API returns `200 OK` and stores `"totalprice": -500` in the booking.

**Why This Matters:**
A client can create a credit-valued booking that downstream payment and reporting systems may treat as valid.

---

### Bug 3: Missing required firstname returns an internal server error

**Severity:** Medium
**Layer:** API
**Environment:** `POST https://restful-booker.herokuapp.com/booking`

**Steps to Reproduce:**
1. POST a booking with no `firstname` and `Content-Type: application/json`.
2. Inspect the status, content type, and body.

**Expected Result:**
The API returns `400 Bad Request` with a validation message identifying the missing field.

**Actual Result:**
The API returns `500 Internal Server Error` with the plain-text body `Internal Server Error`.

**Why This Matters:**
Clients may retry an invalid request because the server reports it as a transient internal failure.

---

### Bug 4: Logged-out users are shown a Logout link

**Severity:** Low
**Layer:** UI
**Environment:** Chromium 151.0.7922.34; `https://automationintesting.online/admin/`

**Steps to Reproduce:**
1. Open `/admin/` in a new browser context without authenticating.
2. Enter invalid credentials and submit the login form.
3. Inspect the page header.

**Expected Result:**
Logged-out users see the login form and no Logout action.

**Actual Result:**
The header displays a Logout link alongside the login form and `Invalid credentials` message.

**Why This Matters:**
The misleading session state confuses users and can cause a login test that asserts only Logout visibility to pass falsely.

## Known Contract Quirks, Not Filed as New Bugs

- Invalid API credentials return `200 OK` with `{ "reason": "Bad credentials" }`; the assessment identifies this as known behavior.
- Successful DELETE returns `201 Created`; the automated test asserts the observed contract and then confirms the record is gone.
