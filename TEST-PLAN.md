# Test Plan - Restful-Booker API and Booking UI

## Objective

Validate the booking lifecycle and the highest-risk public and administrative UI flows for:

- API: `https://restful-booker.herokuapp.com`
- UI: `https://automationintesting.online`

The suite checks behavior at public boundaries: HTTP contracts, stored booking state, browser-visible outcomes, and authorization. It does not inspect implementation details or database state.

## Scope

### In scope

- API authentication with valid, invalid, missing, and tampered credentials.
- Booking create, retrieve, list, full update, partial update, and delete.
- Booking schema, primitive types, persistence, and post-deletion state.
- Required-field, date-ordering, and price validation behavior.
- Contact-form submission and validation.
- Valid and invalid admin login.
- Reuse of authenticated admin browser state.
- Reversed UI booking dates and the resulting price calculation.

### Out of scope

- Payments; `totalprice` is only a sandbox field.
- Load and performance testing against shared public infrastructure.
- Penetration testing beyond authentication and authorization checks.
- Cross-browser coverage beyond Chromium.
- Native mobile testing.
- Database-level verification and third-party service validation.
- Creating or modifying persistent admin rooms during automated regression.

## Test Environment

Node.js 18+ and Chromium are required. URLs and credentials are read from an ignored `.env` file. The UI uses `admin/password`; the API uses `admin/password123`.

The targets are shared public sandboxes. Tests create their own records, use generated identifiers where collisions are plausible, and never assert global list length or ordering. Records created by API tests are deleted where the scenario does not itself verify deletion.

## Top Five Risks

### 1. Authorization does not protect mutations

An anonymous or tampered request could alter or delete a booking. The suite sends unauthenticated PUT, PATCH, and DELETE requests plus a PATCH with a false token. It verifies `403 Forbidden` and rereads the booking to prove its state did not change.

### 2. Invalid dates or prices are accepted

Checkout before checkin can create a negative stay and negative total; a negative API price can act like a credit. API and UI regression tests pin the observed broken behavior so a product fix causes an intentional expectation update.

### 3. Updates lose unrelated data

PUT should replace the full record and PATCH should merge only supplied fields. Tests compare complete responses and follow with GET requests to prove persistence and preservation.

### 4. Response types or error contracts drift

A stringified number or boolean can silently break clients. Create assertions compare the complete payload and primitive types. Known plain-text `403`, `404`, and `500` responses are checked with `response.text()` and exact status codes.

### 5. Authentication tests produce false positives

The logged-out UI exposes misleading navigation, and API auth failures return HTTP 200. UI success requires `/admin/rooms` plus protected room content; invalid login must remain on `/admin`. API failure requires the exact `{ "reason": "Bad credentials" }` body.

## Coverage Matrix

| Area | Scenario | Smoke | Sanity | Regression | Negative |
|---|---|:---:|:---:|:---:|:---:|
| API auth | Valid credentials return token | X | X | | |
| API auth | Invalid credentials return reason | | | X | X |
| Booking CRUD | Create, get, PUT, delete lifecycle | X | X | | |
| Booking auth | Missing/tampered auth cannot PUT/PATCH/DELETE | X | | X | X |
| Create validation | Missing firstname returns observed 500 | | | X | X |
| Retrieve | Nonexistent booking returns 404 | | | X | X |
| PATCH | Selected field changes; others persist | | | X | |
| List | Newly created booking appears | | | X | |
| Date validation | Reversed dates are accepted by API | | | X | X |
| Price validation | Negative price is accepted by API | | | X | X |
| Contact UI | Valid enquiry submits | X | X | | |
| Contact UI | Empty message is rejected | | | X | X |
| Admin UI | Valid login reaches protected rooms | X | X | | |
| Admin UI | Invalid login remains logged out | | | X | X |
| Admin UI | Saved cookie state opens protected rooms | | X | X | |
| Reservation UI | Reversed dates produce negative total | | | X | X |

## Tagging Strategy

- `@smoke`: five business-critical checks used as a build gate.
- `@sanity`: five focused checks for quick environment confidence.
- `@regression`: twelve broader behavior and boundary checks.

There are 16 executable scenarios plus one authentication setup test, for 17 discovered tests. Tag runs involving the authenticated dashboard also execute its `auth-setup` dependency.

## Playwright Projects

| Project | Responsibility | Authentication |
|---|---|---|
| `api` | Booking API suite | Token created per protected scenario |
| `ui-login` | Valid and invalid login behavior | Starts logged out |
| `ui-public` | Contact and reservation behavior | None |
| `auth-setup` | Generates admin browser state once | Logs in from `.env` |
| `ui-authenticated` | Protected admin checks | Reuses `playwright/.auth/admin.json` |

## Entry and Exit Criteria

Testing can start when dependencies, Chromium, and all six `.env` values are available and both sandboxes respond. The assessment is ready for submission when TypeScript, API, UI, smoke, sanity, regression, and complete-suite commands pass, generated artifacts are ignored, and documented counts match `playwright test --list`.

## Known Constraints and Remaining Gaps

- The public sandboxes can respond slowly or reset without notice; environment failures must be distinguished from assertion failures.
- Browser coverage is Chromium only.
- Contact submission writes a synthetic message to the public sandbox; data uniqueness reduces collisions but the UI offers no public cleanup path.
- The suite does not submit a reservation or mutate admin room data during regression. Those flows were explored manually and are documented separately.
