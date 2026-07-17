# orangehrms — app-specific workflow reference

Read alongside the root `CLAUDE.md`, which owns the framework-wide POM/Excel/Jira rules and
the step-by-step workflow. This file only holds what's specific to the OrangeHRMS AUT.

- **Base URL**: `https://opensource-demo.orangehrmlive.com` (`orangehrmsConfig.baseUrl`,
  `src/apps/orangehrms/app.config.ts`) — the public OrangeHRM open-source demo instance.
- **Jira project key**: `HRMS` (`orangehrmsConfig.jiraProjectKey`) — currently the same
  project as saucedemo. If OrangeHRMS work should be tracked under its own Jira project,
  update `orangehrmsConfig.jiraProjectKey` (and this line) accordingly.
- **Default credentials**: `orangehrmsConfig.defaultUsername` / `orangehrmsConfig.defaultPassword`
  (`Admin` / `admin123` by default — the demo site's standard admin account; never hardcode
  these in a spec)
- **Playwright config**: `playwright.orangehrms.config.ts` — run with
  `npm run test:orangehrms` (or `--grep @smoke`/`@regression` variants)
- **Generated spec target**: `src/apps/orangehrms/tests/generated/<TASK-KEY>.spec.ts`
- **No API layer yet** — this app currently only has a UI/page-object layer. Add
  `src/apps/orangehrms/api/` + `fixtures/api.fixture.ts`/`e2e.fixture.ts` the same way
  saucedemo's was added, if/when a task needs one.

## Page object inventory (`src/apps/orangehrms/pages/`)

- **`LoginPage`** (`login.page.ts`) — `open()`, `login(username, password)`,
  `getErrorMessage()`, `assertErrorVisible()`, `assertLoginSuccessful()`. Locators
  (`input[name="username"]`, `input[name="password"]`, `button[type="submit"]`,
  `.oxd-alert-content-text`) and the full login flow were verified live against
  `https://opensource-demo.orangehrmlive.com`. Login is a client-side (SPA) route change, not
  a full navigation - `assertLoginSuccessful()` uses `this.actions.assertUrlContains('dashboard')`
  (auto-retrying) rather than reading `getCurrentUrl()` once, which races the route change and
  reads the URL before it updates. There's no `DashboardPage` yet; add one
  (`src/apps/orangehrms/pages/dashboard.page.ts`) the first time a task needs to interact with
  anything past login, rather than reaching into `page` from a spec.
- **`ClaimPage`** (`claim.page.ts`) — `open()` (`/web/index.php/claim/submitClaim`),
  `selectEvent(event)`, `selectCurrency(currency)`, `fillRemarks(remarks)`, `clickCreate()`,
  `createClaim(event, currency, remarks?)` (fills only the non-empty args it's given, so it
  drives both the mandatory-fields-only flow and blank-field negative flows),
  `getValidationMessages()`, `getReferenceId()`, `getStatus()`,
  `assertClaimCreatedSuccessfully()`. Event/Currency are OrangeHRM `oxd-select` custom
  dropdowns (`.oxd-select-text` toggle + `.oxd-select-option` list), not native `<select>`.
- **`EmployeeClaimsPage`** (`employee-claims.page.ts`) — `open()`
  (`/web/index.php/claim/viewAssignClaim` — this one URL serves both the "Employee Claims"
  and "Assign Claim" submenu items under the Claim module for the Admin role; there is no
  separate route per submenu), `searchByReferenceId(referenceId)`,
  `assertSearchResultVisible()`, `getSearchResult()` (returns a `ClaimSearchResult` —
  `referenceId`/`employeeName`/`event`/`remarks`/`currency`/`status`/`amount` — read from the
  first `.oxd-table-card` result row's `.oxd-table-cell`s, verified live: cell indices are
  0=Reference Id, 1=Employee Name, 2=Event, 3=Remarks, 4=Currency, 5=blank, 6=Status,
  7=Amount, 8=Actions/"View Details"). The Reference Id captured from
  `ClaimPage.getReferenceId()` right after creating a claim (a long numeric code like
  `202607170000022`, not the claim's internal `submitClaim/id/<n>` URL id) is what round-trips
  into this search box. On narrow/mobile viewports (e.g. the `mobile-chrome` Playwright
  project) the filter panel loads collapsed behind a `.bi-caret-down-fill` chevron toggle
  button; `searchByReferenceId()` waits for the Reference Id input to be attached to the DOM
  (not merely visible - it's legitimately invisible pre-toggle, and waiting on the role-based
  Search button doesn't work either, since a collapsed panel drops its contents out of the
  accessibility tree) then clicks the toggle only if the input still isn't visible after that.
  The result row's cell markup *and column order* differ by viewport too, verified live: wide
  viewports render a flat, label-less `.oxd-table-cell` sequence (Reference Id, Employee Name,
  Event, Remarks, Currency, blank, Status, Amount, Actions - in that order), while narrow ones
  render `.oxd-table-card-cell`s that each carry an explicit `.header` label plus either a
  `.data` div (plain fields) or a bare `.oxd-text` span (Event/Description) - with Amount and
  Status swapped relative to the wide layout, and no blank column at all. `getSearchResult()`
  therefore looks a field up by its mobile `.header` label when the card layout is present
  (immune to the reordering) and only falls back to the fixed wide-viewport column index when
  no header labels exist in the DOM.

## Excel sheets (`src/apps/orangehrms/data/testdata.xlsx`)

- **`LoginData`**: `testCaseId`, `username`, `password`, `expectedResult`
  (`success`/`invalid`), `run`. Invalid-credential rows are listed before the success row on
  purpose — a successful login leaves a session cookie behind, and OrangeHRM redirects an
  authenticated session straight to the dashboard instead of showing the login form, so a
  passing login must be the last row processed in a single test run. Keep that order when
  adding rows, or add a logout step to `LoginPage`/a `DashboardPage` if you need a different
  order.
- **`ClaimData`**: `testCaseId`, `event`, `currency`, `remarks`, `expectedResult`
  (`success`/`validationError`), `run`. `TC_CLAIM_01` = mandatory fields only (Event+Currency,
  blank Remarks). `TC_CLAIM_02` = all fields filled. `TC_CLAIM_03` = all fields blank, used to
  assert the "Required" validation messages. `TC_CLAIM_04` = Event=Accommodation, used for the
  submit-then-search-by-Reference-Id flow (see `EmployeeClaimsPage` above).

Regenerate/extend via `src/apps/orangehrms/utils/generate-sample-data.ts` +
`npm run generate:testdata:orangehrms`.

## Reference files

- `src/apps/orangehrms/tests/login.spec.ts` — Excel-driven loop pattern, mirrors
  `src/apps/saucedemo/tests/login.spec.ts`.
