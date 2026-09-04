# Test plan — Booking CRUD

Irtassam · Restful-Booker (`https://restful-booker.herokuapp.com`)

## Scope

The booking lifecycle — create, read, update, partial update, delete — plus the
`/auth` token flow that guards the mutating half of it.

This is where the money is. Every booking a guest makes and every change an admin
applies goes through these five operations, so a bug here either loses a customer's
reservation or gets the price wrong. That's why it's the part worth testing first.

What I'm checking:

- A booking comes back the way it went in, with the right field *types*, not just
  the right field names.
- Authorisation actually holds — a rejected write must also leave the record alone.
- Where the docs and the real behaviour disagree, the real behaviour gets pinned
  in a test instead of living in someone's head.
- Delete really deletes.

### Out of scope

- **Payments** — not implemented in the sandbox, `totalprice` is just a number in a field.
- **Load and performance** — it's shared public infrastructure. Hammering it would be
  rude, and the numbers would measure other people's traffic as much as mine.
- **Cross-browser** — UI runs on Chromium only. Worth doing, but it's its own job.
- **Security testing** beyond authorisation checks — different discipline.
- **Admin room and branding management** — outside the booking feature.

### One constraint worth naming

The sandbox is shared and other people are writing to it while the suite runs. So
every test creates the record it operates on, and nothing asserts on global state.
The list test checks that its own booking is present — not the list length, not the
ordering, since neither is mine to predict.

## Top 5 risks

**1. Authorisation that isn't really there**

`PUT`, `PATCH` and `DELETE` are supposed to need a token. If that check is missing or
shallow, anyone can edit or delete any booking, anonymously. Worst thing that could
plausibly be wrong here.

*How I test it:* hit each mutating endpoint with no token and expect `403` — then
re-read the record and confirm it didn't change. A `403` that still lets the write
through is far worse than a clean rejection, and checking the status alone can't
tell those apart.

**2. Validation gaps letting impossible bookings in**

Negative prices, checkout before checkin, absurd strings. Garbage that gets stored
and then breaks whatever reads it later.

*How I test it:* boundary values on each field — price negative/zero/huge, dates
reversed/identical/malformed, strings empty/very long. **This one turned out to be
real** — see bugs 1 and 2. Both are now pinned by tests asserting the broken
behaviour, so the eventual fix can't land quietly.

**3. Docs and reality disagreeing**

Restful-Booker has a few of these: `200` on failed auth, `201` on delete, `500` on a
missing field. Anyone building a client from the docs gets surprised.

*How I test it:* assert exactly what it does, with a comment saying why the number
is what it is. Deliberately not writing `expect([200, 201]).toContain(...)` — a range
that accepts the right and wrong answer both will never tell you the contract moved.

**4. Types quietly changing**

`totalprice` coming back as `"123"` instead of `123`, or `depositpaid` as the string
`"false"` — which is truthy, so a client's `if (depositpaid)` silently inverts.
A `toHaveProperty` check sails right past this.

*How I test it:* full `toEqual` on the create response plus explicit `typeof` checks
on the number and boolean fields.

**5. Updates losing data**

`PUT` replaces, `PATCH` merges. If `PATCH` drops the fields you didn't send, data
disappears with no error at all.

*How I test it:* after an update, assert on the fields that *should not* have changed
as well as the one that should. Checking only the field you modified is the usual
mistake — it can't see collateral damage.

## Coverage matrix

| Operation | Smoke | Regression | Negative |
|---|:---:|:---:|:---:|
| Auth token | X | X | X |
| Create booking | X | X | X |
| Get booking | X | X | X |
| Update booking (PUT) | X | X | X |
| Partial update (PATCH) | | X | |
| Delete booking | X | X | |

Which test covers what:

| | Test |
|---|---|
| Auth, smoke | `POST /auth with valid credentials` |
| Auth, negative | `POST /auth with invalid credentials` |
| Create, smoke | lifecycle test — structure and types |
| Create, negative | missing firstname; checkout before checkin; negative price |
| Get, smoke | lifecycle test |
| Get, negative | `GET non-existent booking returns 404` |
| Update, smoke | lifecycle test |
| Update, negative | `PUT without an auth token returns 403` |
| Partial update | `PATCH only changes the field sent` |
| Delete, smoke | lifecycle test — `201`, then `404` on re-read |

### Gaps I know about

Two cells are empty and I'd rather say so than pad them:

- **PATCH without a token** should return `403` the same way PUT does. Not automated yet.
  First thing I'd add.
- **DELETE without a token** — I checked this by hand during exploratory testing (it
  returns `403` and the booking survives), but there's no test for it.

Both are five-minute additions to a pattern that already exists. An honest map of what
isn't covered is more useful to whoever picks this up than a grid of uniform ticks.

## Tagging

`@smoke` is the build gate: happy path plus the auth boundary, five tests, runs in
about nine seconds. `@regression` is everything, run before release.

The auth-failure test sits in smoke rather than regression deliberately. Authorisation
breaking isn't a defect you catch in a pre-release sweep — you want it red the moment
it happens.
