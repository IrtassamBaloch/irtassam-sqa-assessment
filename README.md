# Restful-Booker test suite

Playwright tests for the Restful-Booker sandbox, covering the booking API and the
hotel website's UI. Written for the SQA assessment.

- API: https://restful-booker.herokuapp.com
- UI: https://automationintesting.online

## Setup

Node 18 or newer.

```bash
npm install
```

That pulls the dependencies and downloads Chromium (the `prepare` script runs on
its own, no second command needed).

## Running

```bash
npm test            # everything, ~20s
npm run test:smoke  # the 5 must-pass tests
npm run test:api    # API only, doesn't need a browser
npm run test:ui     # UI only
```

If you're behind a proxy that blocks the browser download, `npm run test:api`
still works — those tests use Playwright's request client, not a browser.

## What's here

```
tests/api/booking-api.spec.ts   10 API tests
tests/ui/booking-ui.spec.ts      4 UI tests
pages/                           page objects for the contact form and admin login
TEST-PLAN.md                     scope, risks, coverage matrix
BUG-REPORT.md                    what I found while exploring
```

Tests are tagged `@smoke` or `@regression`. Smoke is the happy path plus the auth
boundary — the things that should block a build. Everything else is regression.

I tagged the "PUT without a token" test as smoke rather than regression on purpose.
If authorisation breaks, that's not a quality issue to catch before release, it's
something you want failing immediately.

## The password in the brief is wrong for the API

The brief says `admin` / `password` for both layers. That works on the UI admin
panel, but the API wants `password123`:

| | username | password |
|---|---|---|
| UI admin panel | admin | password |
| API `/auth` | admin | password123 |

Send `password` to `/auth` and you get `{"reason":"Bad credentials"}` back. Send
`password123` to the UI login form and it says "Invalid credentials". They look
like one product but they don't share a login. Took me a while to work that out,
so it's worth flagging.

## Notes on a few choices

**Exact status codes, not ranges.** Delete returns `201`, which is odd, but I
assert `201` rather than `[200, 201]`. A range that accepts both the right and the
wrong answer won't tell you when the contract changes, which is the whole job.

**Two tests assert broken behaviour.** The API happily accepts a booking with a
negative price, or with checkout before checkin. Both are in BUG-REPORT.md. The
tests pin what it does *today*, with a comment to flip them to `400` once someone
fixes it — that way the fix can't land without anyone noticing.

**The admin login test checks for "Rooms", not "Logout".** The header renders a
Logout link even when you're logged out, so asserting on it would pass no matter
what. That's in the bug report too.

**Shared sandbox.** Other people are writing to the same instance, so every test
creates the record it works on and never asserts on global state. The list test
only checks its own booking is in there, not the length or the order.

## Pushing this up

```bash
git remote add origin <repo-url>
git push -u origin main
```

Then add https://github.com/Dehya as a collaborator under Settings → Collaborators.
