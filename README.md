# Restful-Booker test suite

Playwright tests for the Restful-Booker sandbox — the booking API and the hotel
site's UI. Did this for the SQA assessment.

- API: https://restful-booker.herokuapp.com
- UI: https://automationintesting.online

## Setup

Need Node 18+. Then just:

```bash
npm install
```

That installs everything and pulls down Chromium on its own (it's the `prepare`
script), so there's no second command to remember.

## Running it

```bash
npm test            # runs everything, takes about 20s
npm run test:smoke  # just the 5 that have to pass
npm run test:api    # API tests, no browser needed
npm run test:ui     # UI tests only
```

If your network blocks the Chromium download, `npm run test:api` still works fine
since those tests just hit the API directly, no browser involved.

## What's in here

- `tests/api/booking-api.spec.ts` — 10 API tests
- `tests/ui/booking-ui.spec.ts` — 4 UI tests
- `pages/` — page objects, one for the contact form, one for admin login
- `TEST-PLAN.md` — scope, the risks I focused on, coverage matrix
- `BUG-REPORT.md` — what I found poking around

Tests are tagged `@smoke` or `@regression`. Smoke is the stuff that should block a
build — happy path plus the auth check. Regression is everything else.

I put the "PUT without a token" test in smoke on purpose, not regression. If
authorisation ever breaks that's not something you catch in a pre-release sweep,
you want it failing the build right away.

## Heads up about the password

The brief gives `admin` / `password` for both the UI and the API. That's only
right for the UI. The API wants `password123` instead:

- UI admin panel → admin / password
- API `/auth` → admin / password123

Send `password` to `/auth` and it just says `{"reason":"Bad credentials"}`. Send
`password123` to the UI login and it says "Invalid credentials". Same product,
different logins apparently. Wasted a bit of time on this so figured I'd save you
the trouble.

## Why some tests are written the way they are

Delete returns `201`, which is a weird choice for a delete, but I assert exactly
`201` instead of something loose like `[200, 201]`. If I let both pass, the test
stops being able to tell me when that changes.

Two of the tests are basically asserting a bug. The API lets you create a booking
with a negative price, and one where checkout is before checkin. Both are in the
bug report. Rather than skip them I wrote them to check the current (broken)
behaviour, with a note to flip the expectation to `400` whenever someone actually
fixes it — so the fix can't quietly slip in unnoticed.

The admin login test checks for "Rooms" on the page, not "Logout". Turns out the
site shows a Logout link even when you're not logged in, so checking for that
would've passed regardless of whether login actually worked. That one's in the bug
report too.

Also — it's a public shared sandbox, other people are using it while the tests
run. So everything creates its own data and doesn't assume anything about what
else is in there. The "list bookings" test only checks that its own booking shows
up, not the count or order of anything else.

## Repo

Already pushed — https://github.com/IrtassamBaloch/irtassam-sqa-assessment
