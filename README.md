# Restful-Booker Playwright Assessment

TypeScript Playwright coverage for the Restful-Booker API and the Automation in Testing booking UI.

## Prerequisites

- Node.js 18 or newer
- Network access to both public sandbox URLs

## Setup

```bash
npm install
```

`npm install` runs the `prepare` script and installs Chromium. Create `.env` from `.env.example`:

```env
API_BASE_URL=https://restful-booker.herokuapp.com
API_USERNAME=admin
API_PASSWORD=password123
UI_BASE_URL=https://automationintesting.online
UI_USERNAME=admin
UI_PASSWORD=password
```

The API and UI passwords are intentionally different. Configuration validation stops immediately with a clear error when any required value is absent. `.env` is ignored by Git.

## Commands

```bash
npm test                 # complete suite
npm run test:api         # API project only
npm run test:ui          # all UI projects
npm run test:smoke       # five critical scenarios
npm run test:sanity      # five environment-confidence scenarios
npm run test:regression  # fourteen regression scenarios
npm run typecheck        # TypeScript compilation without output
npm run report           # open the latest HTML report
```

## Continuous Integration

GitHub Actions runs TypeScript validation and the complete Playwright suite on pushes and pull requests to `main`. It installs Chromium and its Linux system dependencies on `ubuntu-latest`, uses one worker with retries through `CI=true`, and uploads the HTML report plus failure artifacts. The workflow can also be started manually from the Actions tab.

## Structure

```text
config/
  env.ts                         validated environment contract
pages/
  AdminBookingsPage.ts           admin booking verification and CRUD actions
  AdminLoginPage.ts              admin login actions and feedback
  AdminRoomsPage.ts              protected room-management CRUD actions
  ContactFormComponent.ts        contact form actions and results
  HomePage.ts                    availability search and room selection
  ReservationPage.ts             reservation form and price-summary behavior
playwright/.auth/
  admin.json                     generated authenticated cookie state
test-data/
  api/booking.data.ts            typed booking factories and boundary data
  ui/admin.data.ts               invalid login and dashboard expectations
  ui/contact.data.ts             contact fixtures and unique-data factory
  ui/reservation.data.ts         generated guests, valid dates, and reversed dates
  ui/room.data.ts                room create and update fixtures
tests/
  api/booking-api.spec.ts        API contract and lifecycle coverage
  auth/admin.setup.ts            one-time UI login setup
  ui/booking-ui.spec.ts          required UI scenarios in one deliverable
utils/
  login.utils.ts                 reusable admin login and auth-state path
playwright.config.ts             projects, artifacts, retries, and reporters
TEST-PLAN.md                     scope, risks, and coverage matrix
BUG-REPORT.md                    reproduced product defects
```

Generated `playwright/.auth`, `test-results`, `playwright-report`, and `blob-report` directories are ignored.

## Design Decisions

API tests use Playwright request contexts and do not launch browsers. Each mutation scenario owns its booking data and avoids global-state assertions because the target is shared.

Page objects contain locators and user actions; assertions remain in specs. Module-specific test-data files keep payloads and expected values out of page objects. There is no generic base page because the current flows do not share meaningful behavior.

The `auth-setup` project logs in once and writes cookie-based `storageState`. Only `ui-authenticated` depends on it. Login tests deliberately start without stored authentication so valid and invalid credentials remain independently testable.

Known API quirks are asserted exactly: failed authentication returns HTTP 200 with a reason body, delete returns 201 with `Created`, and some errors are plain text. See `BUG-REPORT.md` for expected-versus-observed behavior.

## Public Sandbox Notes

The services are shared and occasionally slow. A timeout or reset is an environment signal, not a reason to loosen business assertions. API tests clean up their generated bookings where possible. The UI contact test submits synthetic data. The room and reservation CRUD tests create unique records and delete them through the UI in `finally` cleanup blocks.
