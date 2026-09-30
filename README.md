# Playwright + TypeScript Automation Framework by Namankumar Kalola

Production-grade, POM-based UI automation framework with a strict separation of
roles between **tests**, **page objects**, and the **core action layer** — built to run
**multiple applications** out of one workspace, each fully isolated under `src/apps/<app>/`.

## Architecture & Separation of Roles

A clean two-way split: `src/core/` is the framework (100% shared, zero app-specific logic),
`src/apps/<app>/` is one AUT, fully self-contained — including its own tests. Nothing lives
at a top-level `tests/` anymore; every app owns its whole vertical slice.

```
src/
  core/                     <- SHARED across every app. Nothing app-specific belongs here.
    web.actions.ts            ONLY place that calls raw Playwright Locator/Page APIs.
                               Every click/fill/assert is logged, timed, wrapped in
                               try/catch with descriptive errors.
    base.page.ts               Abstract class all Page Objects extend. Exposes
                               `this.actions` (WebActions) to subclasses only.
    logger.ts                  Central structured logger.
    api.client.ts               API-layer equivalent of WebActions: the ONLY class that
                               calls Playwright's APIRequestContext get/post/put/patch/
                               delete. Logs, times, and error-wraps every call.
    spec.builder.ts             Fluent builder for headers/params/body (the RestAssured
                               `given()` equivalent). Carries no app-specific default
                               headers - app auth headers are attached by the caller.
    excel.reader.ts              Apache-POI-style data-driven reader (ExcelJS), shared
                               by every app's test data file.
    env.config.ts               Cross-app/infra settings only (headless, timeouts,
                               retries, workers, Jira credentials). Never a base URL,
                               credential, or test-data path - those are per-app.
    jira.ts                     Shared Jira REST client - talks to Jira, not any AUT.
  apps/
    saucedemo/                 <- one AUT, fully self-contained. Every other app gets its
                               own sibling folder, structured identically, touched only
                               when working on it.
      app.config.ts             baseUrl, apiBaseUrl, credentials, testDataFile,
                               API auth, jiraProjectKey - this app's own env var names.
      pages/                    login.page.ts, inventory.page.ts, cart.page.ts,
                               checkout.page.ts - locators PRIVATE, public methods are
                               business actions ("login", "addProductToCart").
      api/                      routes/, models/, services/, core/token.manager.ts -
                               this app's API domain layer (optional per app).
      fixtures/                 pages.fixture.ts, api.fixture.ts, e2e.fixture.ts -
                               injects this app's page objects/services into tests.
      data/testdata.xlsx        Excel-based test data for this app (generated).
      utils/generate-sample-data.ts
      tests/                    login.spec.ts, checkout.spec.ts <- ONLY call page-object
                               business methods, never see a Locator or raw `page`.
        e2e/                     UI+API combined specs (uses e2e.fixture.ts).
        api/                     API-only specs (uses api.fixture.ts).
        generated/               AI-generated specs land here, named by Jira task key.
      CLAUDE.md                 App-specific Jira project key, base URL, page object
                               inventory, Excel sheet names - read alongside root
                               CLAUDE.md.
playwright.base.config.ts    <- shared factory (timeouts, browsers, reporters); apps
                                 only override testDir/baseURL/report output paths.
playwright.saucedemo.config.ts
```

### The rule this framework enforces

| Layer        | Knows about                                   | Never touches                          |
|--------------|------------------------------------------------|------------------------------------------|
| **Tests**    | Page object business methods, test data, assertions on return values | Locators, `page.*`, raw Playwright API |
| **Page Objects** | Locators (private) + business flows, calls `this.actions.*` | Direct `page.click()`/`page.fill()` |
| **WebActions (core)** | Raw Playwright Locator/Page API, logging, waits, error wrapping | Business/test logic |
| **Apps** | Their own pages/fixtures/data/config/tests | Another app's files, or `src/core/` |

This mirrors the Java/Selenium POM discipline you're used to (PageFactory +
a base `Actions`/`WebDriverUtils` wrapper) but idiomatic to Playwright/TS, extended with
an app-per-folder boundary so multiple AUTs can share the same reusable core without
stepping on each other.

## Getting started

```bash
npm install
npx playwright install --with-deps
cp .env.example .env
npm run generate:testdata:saucedemo   # creates src/apps/saucedemo/data/testdata.xlsx
npm run test:saucedemo                # run the saucedemo suite
```

## Common commands

Every action is scoped to an app via the `<action>:<app>[:variant]` convention. For
`saucedemo`:

| Command | Purpose |
|---|---|
| `npm run test:saucedemo` | Run all saucedemo tests, all configured browsers |
| `npm run test:saucedemo:smoke` | Run only `@smoke`-tagged tests |
| `npm run test:saucedemo:regression` | Run only `@regression`-tagged tests |
| `npm run test:saucedemo:chrome` | Run only on Chromium |
| `npm run test:saucedemo:parallel` | Force 4 parallel workers |
| `npm run report:saucedemo` | Open the last HTML report for saucedemo |
| `npm run allure:saucedemo:generate && npm run allure:saucedemo:open` | Generate & open Allure report |
| `npm run generate:testdata:saucedemo` | Regenerate saucedemo's sample `testdata.xlsx` |
| `npm run typecheck` | TypeScript compile check, no emit (repo-wide) |
| `npm run lint` / `lint:fix` | ESLint (repo-wide) |

A second app gets its own `test:<app>`, `report:<app>`, etc. — see "Adding a new
application" below.

## Adding a new page (within an existing app)

1. Create `src/apps/<app>/pages/<name>.page.ts`, extend `BasePage` (`src/core/base.page.ts`),
   keep locators `private readonly`.
2. Expose only business-level async methods (`login`, `addProductToCart`,
   `completeCheckout`...). All element interaction goes through `this.actions.*`.
3. Register it in `src/apps/<app>/fixtures/pages.fixture.ts` so tests can request it as a
   fixture.

## Adding Excel-driven test data (within an existing app)

1. Add a new sheet/columns to `src/apps/<app>/data/testdata.xlsx` (or extend
   `src/apps/<app>/utils/generate-sample-data.ts`).
2. In your spec: `ExcelReader.readSheet(<app>Config.testDataFile, 'SheetName')`, then loop
   with `test.step(...)`, honoring a `run = Y/N` column where present.

## Reporting

Reports are namespaced per app under `reports/<app>/`:

- **HTML report** (`reports/<app>/html-report`) — Playwright's built-in report, screenshots/video/trace on failure.
- **JUnit XML** (`reports/<app>/junit-results.xml`) — for CI dashboards (Jenkins, Azure DevOps, Zephyr/Xray import).
- **Allure** (`reports/<app>/allure-results` → `reports/<app>/allure-report`) — rich step-by-step reporting; `WebActions`
  step names (e.g. "Click on Login button") appear directly as Allure steps.

## CI

Point a CI job at a single app: `npm ci` → `playwright install --with-deps` →
`npm run test:<app>:regression` → publish `reports/<app>/`. Give each app its own CI job so
one app's failures never block another's pipeline.

## API testing layer

```
src/core/
  api.client.ts                <- SHARED. ONLY class that calls Playwright's
                                  APIRequestContext get/post/put/patch/delete. Logs,
                                  times, and error-wraps every call. Returns an ApiResult
                                  (status/ok/typed body helper).
  spec.builder.ts                <- SHARED. Fluent builder for headers/params/body,
                                  carries no app-specific default headers.
src/apps/<app>/api/
  routes/api.routes.ts          <- ALL endpoint paths for this app. No file outside this
                                  one contains a URL string.
  models/<domain>.model.ts       <- POJO/DTO layer: typed request & response shapes.
  core/token.manager.ts           <- Owns login + token caching/TTL/refresh for this
                                  app's auth flow. Services ask for a token; they never
                                  call the login endpoint themselves. (App-specific, not
                                  promoted to `src/core/` - auth flows vary too much
                                  between real AUTs to generalize speculatively.)
  services/<domain>.api.service.ts <- Common/reusable business API calls. Composes
                                  SpecBuilder + ApiClient + TokenManager + Routes +
                                  Models. THIS is what test files call.
src/apps/<app>/fixtures/api.fixture.ts   <- Injects apiRequestContext, tokenManager,
                                  this app's services into tests.
src/apps/<app>/tests/api/*.spec.ts <- Calls ONLY `<domain>ApiService.*`, asserts on typed
                                  POJOs (User, ApiResult).
```

**Layer flow (bottom to top):** `Routes` (where) -> `Models/POJO` (shape) ->
`TokenManager` (auth) -> `SpecBuilder` (how the request looks) -> `ApiClient`
(executes it) -> `Service` (business call composing all of the above) ->
`Test case` (calls the service, asserts on the result).

Test files never import `ApiRoutes`, `SpecBuilder`, `ApiClient`, or
`APIRequestContext` directly - exactly the same role separation as the UI
layer (`WebActions` / `BasePage` / Page Objects / tests).

### Crossing UI and API in one test

`pages.fixture.ts` and `api.fixture.ts` stay separate on purpose - most tests
are either UI or API, and keeping them decoupled keeps each spec focused.
For the few scenarios that genuinely need both (drive a flow through the UI,
verify the result via API; or seed/clean up state via API around a UI flow),
import `test`/`expect` from `src/apps/<app>/fixtures/e2e.fixture.ts` instead, which
merges the two via Playwright's `mergeTests`:

```ts
import { test, expect } from '../../fixtures/e2e.fixture';

test('adds to cart in UI, verifies via API', async ({ loginPage, inventoryPage, userApiService }) => {
  // loginPage/inventoryPage from pages.fixture, userApiService from api.fixture,
  // both available on the same `test`.
});
```

Put these specs in `src/apps/<app>/tests/e2e/`. Don't reach for this fixture by default -
if a test only touches one side, use that side's fixture file directly.

### Running API tests

```bash
npm run test:saucedemo -- src/apps/saucedemo/tests/api        # all saucedemo API tests
npx playwright test --config=playwright.saucedemo.config.ts src/apps/saucedemo/tests/api --grep @smoke
```

SauceDemo's demo API target is `https://reqres.in` (`API_BASE_URL` in `.env`), a free public
test API used to demonstrate the API layer pattern - it's not part of the real SauceDemo
site. Swap it for your real service by changing `API_BASE_URL`, `API_AUTH_EMAIL`,
`API_AUTH_PASSWORD` in `.env`, or point a new app's own `app.config.ts` at its real API.

### Adding a new API domain (e.g. "Orders") within an existing app

1. `src/apps/<app>/api/models/order.model.ts` - request/response interfaces + optional model class.
2. Add paths to `src/apps/<app>/api/routes/api.routes.ts` (`ApiRoutes.ORDERS = {...}`).
3. `src/apps/<app>/api/services/order.api.service.ts` - business methods using
   `ApiClient` (`src/core/api.client.ts`) + `SpecBuilder` (`src/core/spec.builder.ts`) +
   `TokenManager` + routes/models.
4. Register `orderApiService` in `src/apps/<app>/fixtures/api.fixture.ts`.
5. Write `src/apps/<app>/tests/api/order.api.spec.ts` calling only `orderApiService.*`.

## Adding a new application

The full procedure (with exact file/folder shape) lives in the root `CLAUDE.md`'s "Adding a
new application" section - that's the single source of truth so it doesn't drift from what
the AI workflow actually does. In short: everything is additive - a new self-contained
`src/apps/<app>/` folder (pages, fixtures, data, and its own `tests/`), a new
`playwright.<app>.config.ts`, new app-scoped `package.json` scripts, and one new row in root
`CLAUDE.md`'s app registry table. No existing app's files are ever edited to add a new one.

## Design principles applied

- **SRP** - config, logging, element interaction, page objects, and test intent are each isolated.
- **DIP** - tests depend on Page Object abstractions (business methods), not on Playwright internals.
- **DRY** - all waits/logging/error-handling live once, in `src/core/`, shared by every app.
- **Data/logic separation** - Excel supplies data; page objects supply behavior; tests supply intent.
- **App isolation** - each app owns its pages/fixtures/data/config/tests; only `src/core/` is
  shared, and it's deliberately kept free of any app-specific logic so enhancing one app
  never risks another.
- **Thread/worker safety** - Playwright's fixture-per-test browser context model gives natural
  isolation across parallel workers; `ExcelReader` caches per file+sheet so parallel workers
  don't re-parse the workbook, and the cache is keyed by file path so two apps' data files
  never collide even if a future test process loads both.

  ## CI/CD

Playwright regression tests run automatically on pull requests using GitHub Actions.
