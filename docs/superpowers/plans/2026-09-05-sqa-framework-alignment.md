# SQA Framework Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the current Irtassam Playwright assessment with the final requirements in the shared ChatGPT conversation while retaining the repository's useful API risk analysis and verified defect evidence.

**Architecture:** Split configuration, module-owned test data, page objects, authentication setup, and scenario specs into focused units. Playwright projects separate API, public UI, login UI, and authenticated UI execution; authenticated tests consume one generated `storageState` file instead of logging in repeatedly.

**Tech Stack:** Node.js 18+, TypeScript, `@playwright/test`, `dotenv`, Chromium, Playwright API request contexts.

**Spec:** Shared conversation at `https://chatgpt.com/s/cx_6a9b38b6ebb48191973c6abb24d391b0`, reconciled with `TEST-PLAN.md`, `README.md`, and the current test suites.

## Global Constraints

- Load `API_BASE_URL`, `API_USERNAME`, `API_PASSWORD`, `UI_BASE_URL`, `UI_USERNAME`, and `UI_PASSWORD` from `.env`; do not hard-code credentials or base URLs in tests or page objects.
- Keep `.env` and `playwright/.auth/` out of source control; commit `.env.example` with non-secret local setup values.
- Use native Playwright tags `@smoke`, `@sanity`, and `@regression` and provide an npm command for each selection.
- Page objects own locators and user actions; specs own assertions and scenario intent; module-specific test-data files own payloads and expected values.
- Prefer `getByRole`, `getByLabel`, and `getByTestId`; avoid fixed sleeps, XPath, CSS classes, and positional selectors unless scoped to a component with no semantic alternative.
- Every test creates or identifies its own data and must not assert global list length or ordering on the shared public sandbox.
- API negative-response tests use `response.text()` for observed plain-text `403`, `404`, and `500` bodies.
- Browser authentication is cookie-based. Generate and reuse `playwright/.auth/admin.json` through Playwright `storageState`; do not attempt to force session storage.
- Do not add Docker, CI, custom reporters, schema libraries, or a generic `BasePage` for this assessment.

## Existing Plan Review

Keep these strengths from `TEST-PLAN.md`:

- Booking CRUD and authorization are prioritized by business risk.
- Rejected writes are followed by state verification.
- Observed API quirks are asserted exactly rather than hidden behind loose status checks.
- Tests isolate their own records on the shared sandbox.
- Known automation gaps are stated honestly.

Correct these mismatches during implementation:

| Area | Current state | Required state |
|---|---|---|
| Coverage scope | Matrix covers only API booking operations | Include API, contact form, admin login, authenticated dashboard, and reservation/date-risk UI coverage |
| Authorization | Unauthenticated PUT only | Add unauthenticated PATCH and DELETE, verify records remain unchanged/present, plus tampered-token coverage |
| Tags | Smoke and regression only | Native smoke, sanity, and regression tags with matching scripts |
| Smoke count | Plan says five; current titles select four | Derive documented counts from `--list` after the final suite is built |
| Configuration | URLs and credentials are hard-coded | Validated `.env` configuration shared by config and helpers |
| Test data | Payloads are inline | Typed, module-specific API/admin/contact/reservation data files |
| UI structure | One combined UI spec and two coarse page objects | Separate public, login, authenticated, and reservation specs with focused page objects |
| Auth reuse | Every login scenario performs UI login | Setup project logs in once and authenticated project reuses cookie storage state |
| Documented API cases | List-booking test exists but is absent from matrix | Add it to regression coverage and document its shared-state-safe assertion |
| Defect evidence | API defects dominate the report | Add the reproduced negative-night/negative-total UI defect and incorrect room-image alt text |

---

### Task 1: Environment Contract and TypeScript Configuration

**Files:**
- Create: `.env.example`
- Create: `config/env.ts`
- Create: `tsconfig.json`
- Modify: `.gitignore`
- Modify: `package.json`
- Test: `config/env.ts` through TypeScript compilation and a missing-variable command

**Interfaces:**
- Produces: `env.apiBaseUrl`, `env.apiUsername`, `env.apiPassword`, `env.uiBaseUrl`, `env.uiUsername`, and `env.uiPassword`, all non-empty strings.
- Consumes: process environment populated by `dotenv/config`.

- [ ] **Step 1: Add configuration dependencies and scripts**

Add `dotenv` as a development dependency and scripts for `typecheck`, `test:smoke`, `test:sanity`, `test:regression`, and `report`. Keep the existing API and UI commands.

```json
{
  "typecheck": "tsc --noEmit",
  "test:smoke": "playwright test --grep @smoke",
  "test:sanity": "playwright test --grep @sanity",
  "test:regression": "playwright test --grep @regression",
  "report": "playwright show-report"
}
```

- [ ] **Step 2: Define and validate the environment contract**

Implement one `required(name)` helper that throws `Missing required environment variable <NAME>. Copy .env.example to .env and provide a value.` Export an immutable `env` object using the six exact variable names in Global Constraints.

- [ ] **Step 3: Protect generated and secret files**

Add `.env` and `playwright/.auth/` to `.gitignore`. Put the two public base URLs and documented sandbox credentials in `.env.example`, with the API password documented as `password123` and UI password as `password`.

- [ ] **Step 4: Verify configuration behavior**

Run `npm install`, then `npm run typecheck`. Run a shell with one required variable unset and import `config/env.ts`; expect the exact missing-variable error rather than an undefined URL later in a test.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore config/env.ts tsconfig.json
git commit -m "chore: centralize test environment configuration"
```

### Task 2: Module-Specific Test Data

**Files:**
- Create: `test-data/api/booking.data.ts`
- Create: `test-data/ui/admin.data.ts`
- Create: `test-data/ui/contact.data.ts`
- Create: `test-data/ui/reservation.data.ts`
- Test: TypeScript compilation plus consuming specs in later tasks

**Interfaces:**
- Produces: `BookingData`, `createBookingData(overrides?)`, `invalidAdminCredentials`, `createContactData(uniqueId)`, `validReservationData`, and `reversedDateReservationData`.
- Consumes: no environment configuration; credentials stay in `.env`.

- [ ] **Step 1: Move booking payloads into a typed factory**

Define the nested booking-date interface and a factory that deep-merges `bookingdates`, so a caller can override only `checkin` without losing `checkout`. Include valid, update, PATCH, reversed-date, negative-price, and missing-firstname values.

- [ ] **Step 2: Add immutable UI module data**

Put invalid credentials and expected dashboard text in `admin.data.ts`; contact boundary and unique valid-message data in `contact.data.ts`; valid and reversed date ranges plus guest details in `reservation.data.ts`.

- [ ] **Step 3: Verify exports compile**

Run `npm run typecheck`; expect zero TypeScript errors and no credential literals outside `.env.example`.

- [ ] **Step 4: Commit**

```bash
git add test-data
git commit -m "test: centralize module-specific test data"
```

### Task 3: Playwright Project Boundaries and Reusable Authentication

**Files:**
- Create: `utils/login.utils.ts`
- Create: `tests/auth/admin.setup.ts`
- Modify: `playwright.config.ts`
- Test: `npx playwright test --list`

**Interfaces:**
- Produces: `adminAuthFile` path and `loginAsAdmin(page, credentials)`; project names `auth-setup`, `ui-login`, `ui-public`, `ui-authenticated`, and `api`.
- Consumes: validated `env`, `AdminLoginPage`, and `playwright/.auth/admin.json`.

- [ ] **Step 1: Write the authentication setup**

Use `loginAsAdmin` once, assert `/admin/rooms`, create the auth directory, and save `page.context().storageState({ path: adminAuthFile })`.

- [ ] **Step 2: Configure five focused projects**

Scope each project using `testMatch`; make only `ui-authenticated` depend on `auth-setup` and load `storageState`. Give API and UI projects their respective base URLs. Enable HTML plus line reporters, CI-only retries, `forbidOnly`, screenshots on failure, trace on first retry, and video retention on failure.

- [ ] **Step 3: Verify project discovery**

Run `npx playwright test --list`. Confirm login tests are not dependent on auth setup, public UI tests do not trigger login, API tests do not launch Chromium, and authenticated tests depend on setup.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts utils/login.utils.ts tests/auth/admin.setup.ts
git commit -m "test: reuse admin authentication state"
```

### Task 4: Focused Page Object Model

**Files:**
- Create: `pages/HomePage.ts`
- Create: `pages/ContactFormComponent.ts`
- Create: `pages/AdminLoginPage.ts`
- Create: `pages/AdminRoomsPage.ts`
- Create: `pages/ReservationPage.ts`
- Delete after migration: `pages/contactPage.ts`
- Delete after migration: `pages/adminPage.ts`
- Test: UI specs in Tasks 6 and 7

**Interfaces:**
- Produces: navigation and action methods only; exposes meaningful result locators needed by assertions.
- Consumes: Playwright `Page`, semantic locators, and data types from `test-data/ui`.

- [ ] **Step 1: Split homepage and contact behavior**

`HomePage` navigates, checks availability, and opens a room. `ContactFormComponent` scopes the five `Contact*` test IDs and Submit button, fills typed data, submits, and exposes success/validation messages.

- [ ] **Step 2: Split login and authenticated-room behavior**

`AdminLoginPage` navigates, fills labeled username/password controls, submits, and exposes invalid-login feedback. `AdminRoomsPage` exposes the room-management heading/control used to prove saved authentication works.

- [ ] **Step 3: Encapsulate reservation behavior**

`ReservationPage` fills guest data, exposes Price Summary and Reserve Now, and provides displayed night count and total text for the reversed-date regression.

- [ ] **Step 4: Update login utility and compile**

Make `loginAsAdmin` consume `AdminLoginPage`; run `npm run typecheck` before removing old page objects, then remove them only after no imports remain.

- [ ] **Step 5: Commit**

```bash
git add pages utils/login.utils.ts
git commit -m "refactor: split UI flows into focused page objects"
```

### Task 5: Complete and Harden API Coverage

**Files:**
- Modify: `tests/api/booking-api.spec.ts`
- Test: `tests/api/booking-api.spec.ts`

**Interfaces:**
- Consumes: `env` and `createBookingData` plus named invalid data.
- Produces: independent auth, create, get, list, PUT, PATCH, DELETE, and validation scenarios.

- [ ] **Step 1: Replace inline URLs, credentials, and payloads**

Use the API project's `baseURL`, validated credentials, typed data factory, and a token helper that rejects `{ reason }` responses instead of returning `undefined`.

- [ ] **Step 2: Strengthen existing assertions**

Require a positive integer booking ID, exact full booking equality on create/get/update, follow-up GET after PUT, and exact plain-text bodies for known `403`, `404`, and `500` responses.

- [ ] **Step 3: Add missing authorization tests**

Add unauthenticated PATCH and DELETE cases and a tampered-token case. After rejected PATCH/PUT, GET and assert unchanged data; after rejected DELETE, GET and assert the record still exists.

- [ ] **Step 4: Make cleanup reliable**

Track every created booking ID and delete it from `finally` with a valid token when the test itself does not prove deletion. Never delete a fixed or externally-owned ID.

- [ ] **Step 5: Run API and tag selections**

Run `npm run test:api`, `npm run test:smoke -- --project=api`, `npm run test:sanity -- --project=api`, and `npm run test:regression -- --project=api`; expect all selected tests to pass against the live sandbox.

- [ ] **Step 6: Commit**

```bash
git add tests/api/booking-api.spec.ts
git commit -m "test: complete booking API risk coverage"
```

### Task 6: Public and Login UI Scenarios

**Files:**
- Create: `tests/ui/contact-form.spec.ts`
- Create: `tests/ui/admin-login.spec.ts`
- Delete after migration: `tests/ui/booking-ui.spec.ts`
- Test: new public and login UI specs

**Interfaces:**
- Consumes: `HomePage`, `ContactFormComponent`, `AdminLoginPage`, `env`, and module test data.
- Produces: contact happy/validation scenarios and valid/invalid login scenarios without saved auth.

- [ ] **Step 1: Migrate contact tests**

Keep a tagged happy path with unique synthetic data. Expand validation to assert the relevant required/boundary messages, including the 20–2000 character message rule.

- [ ] **Step 2: Separate login validation from saved authentication**

Valid login asserts `/admin/rooms` and a protected room-management signal. Invalid login asserts `Invalid credentials`, remains on `/admin`, and does not expose protected controls.

- [ ] **Step 3: Run isolated UI projects**

Run `npx playwright test --project=ui-public --project=ui-login`; expect all scenarios to pass in Chromium with no auth setup dependency.

- [ ] **Step 4: Commit**

```bash
git add tests/ui pages
git commit -m "test: separate public and login UI coverage"
```

### Task 7: Authenticated Dashboard and Reservation Risk Coverage

**Files:**
- Create: `tests/ui/admin-dashboard.spec.ts`
- Create: `tests/ui/reservation.spec.ts`
- Test: new authenticated and reservation specs

**Interfaces:**
- Consumes: `adminAuthFile` through project configuration, `AdminRoomsPage`, `HomePage`, `ReservationPage`, and reservation data.
- Produces: a saved-auth sanity check and regression coverage for the reproduced reversed-date defect.

- [ ] **Step 1: Prove storage-state reuse**

Open `/admin/rooms` directly in `ui-authenticated` and assert protected room management is visible. The spec must not call login.

- [ ] **Step 2: Automate the reversed-date regression without submitting data**

Search with checkout before checkin, open the first offered room, and assert the observed negative night count/negative total while Reserve Now remains enabled. Tag it regression and document that expectations must flip when the defect is fixed.

- [ ] **Step 3: Run authenticated and reservation UI tests**

Run `npx playwright test --project=ui-authenticated --project=ui-public`; expect setup to execute once and all tests to pass without creating a reservation or room.

- [ ] **Step 4: Commit**

```bash
git add tests/ui/admin-dashboard.spec.ts tests/ui/reservation.spec.ts
git commit -m "test: add authenticated and reservation risk coverage"
```

### Task 8: Reconcile Test Plan, Bug Report, and README

**Files:**
- Modify: `TEST-PLAN.md`
- Modify: `BUG-REPORT.md`
- Modify: `README.md`
- Test: command and coverage audit against discovered tests

**Interfaces:**
- Consumes: final test titles, tags, project names, environment contract, and reproduced evidence.
- Produces: documentation that matches executable behavior and contains no stale counts.

- [ ] **Step 1: Expand the coverage matrix**

Add API list/PATCH/auth-negative rows and UI contact/login/dashboard/reservation rows. Mark smoke, sanity, regression, and negative coverage explicitly; retain the rationale for exact-contract and shared-sandbox assertions.

- [ ] **Step 2: Update known gaps and counts from discovery output**

Run each `--list` command, record the actual discovered totals, remove the now-implemented PATCH/DELETE authorization gaps, and state any remaining gap instead of presenting a fully checked matrix without evidence.

- [ ] **Step 3: Add reproduced UI defects**

Lead `BUG-REPORT.md` with checkout-before-checkin producing `-1 nights`, `£-60`, and an enabled Reserve Now button. Add the incorrect shared `Single Room` image alternative text for Double and Suite cards with an appropriate accessibility severity.

- [ ] **Step 4: Rewrite setup and execution documentation**

Document `.env` creation, distinct API/UI passwords, auth-state generation, all/API/UI/smoke/sanity/regression/typecheck/report commands, project structure, generated directories, shared-sandbox limitations, and why login tests remain unauthenticated.

- [ ] **Step 5: Commit**

```bash
git add TEST-PLAN.md BUG-REPORT.md README.md
git commit -m "docs: align assessment evidence and execution guide"
```

### Task 9: Final Verification and Clean-Install Audit

**Files:**
- Verify: all committed source and documentation
- Test: full suite, selections, type checking, and ignored artifacts

**Interfaces:**
- Consumes: every prior task.
- Produces: reproducible evidence that the repository meets the shared-chat requirements.

- [ ] **Step 1: Run static and discovery checks**

Run `npm run typecheck`, `npx playwright test --list`, and each tag with `--list`. Confirm expected scenarios are selected and no test is silently untagged unless intentionally setup-only.

- [ ] **Step 2: Run suites independently**

Run `npm run test:api` and `npm run test:ui`. Record passed, failed, and flaky counts separately so a browser issue cannot hide API results.

- [ ] **Step 3: Run release selections and complete suite**

Run `npm run test:smoke`, `npm run test:sanity`, `npm run test:regression`, and `npm test`. Investigate any failure before changing an assertion; distinguish product defects from test defects and shared-sandbox instability.

- [ ] **Step 4: Audit secrets and generated output**

Run `git status --short`, `git check-ignore .env playwright/.auth/admin.json test-results playwright-report`, and `rg -n "password123|automationintesting\.online|restful-booker\.herokuapp\.com" --glob '!README.md' --glob '!TEST-PLAN.md' --glob '!.env.example'`. Expect no hard-coded credentials or base URLs in executable source.

- [ ] **Step 5: Commit final corrections only if verification required changes**

```bash
git add <only-files-changed-by-verification>
git commit -m "test: finalize assessment verification"
```

## Self-Review Results

- Spec coverage: all final shared-chat requirements map to Tasks 1–9.
- Placeholder scan: no deferred implementation placeholders remain; the final commit command intentionally requires explicit verified paths to avoid staging unrelated user changes.
- Type consistency: environment, data-factory, page-object, login-helper, project, and storage-state names are consistent across producing and consuming tasks.
- Scope: GitHub publication and contributor invitations remain excluded because the shared conversation required separate approval for external actions.
