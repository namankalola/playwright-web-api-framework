# Playwright + TypeScript Automation Framework by Namankumar Kalola

Production-grade, POM-based UI automation framework with a strict separation of
roles between **tests**, **page objects**, and the **core action layer**.

## Architecture & Separation of Roles

```
src/
  core/
    web.actions.ts    <- ONLY place that calls raw Playwright Locator/Page APIs.
                          Every click/fill/assert is logged, timed, wrapped in
                          try/catch with descriptive errors.
    base.page.ts       <- Abstract class all Page Objects extend. Exposes
                          `this.actions` (WebActions) to subclasses only.
    logger.ts           <- Central structured logger.
  config/
    env.config.ts       <- Single source of truth for env vars / .env values.
  pages/
    login.page.ts        <- Locators are PRIVATE. Public methods are business
    inventory.page.ts        actions ("login", "addProductToCart"), never
    checkout.page.ts         technical steps.
  fixtures/
    pages.fixture.ts     <- Injects page objects into tests via Playwright's
                            fixture system. Tests import `test` from here,
                            not from '@playwright/test'.
  utils/
    excel.reader.ts       <- Apache-POI-style data-driven reader (ExcelJS).
    generate-sample-data.ts
    types.ts
  data/
    testdata.xlsx          <- Excel-based test data (generated).
tests/
  login.spec.ts             <- ONLY calls page-object business methods.
  checkout.spec.ts             Never sees a Locator or raw `page`.
playwright.config.ts
```

### The rule this framework enforces

| Layer        | Knows about                                   | Never touches                          |
|--------------|------------------------------------------------|------------------------------------------|
| **Tests**    | Page object business methods, test data, assertions on return values | Locators, `page.*`, raw Playwright API |
| **Page Objects** | Locators (private) + business flows, calls `this.actions.*` | Direct `page.click()`/`page.fill()` |
| **WebActions (core)** | Raw Playwright Locator/Page API, logging, waits, error wrapping | Business/test logic |

This mirrors the Java/Selenium POM discipline you're used to (PageFactory +
a base `Actions`/`WebDriverUtils` wrapper) but idiomatic to Playwright/TS.

## Getting started

```bash
npm install
npx playwright install --with-deps
cp .env.example .env
npm run generate:testdata   # creates src/data/testdata.xlsx
npm test                    # run full suite
```

## Common commands

| Command | Purpose |
|---|---|
| `npm test` | Run all tests, all configured browsers |
| `npm run test:smoke` | Run only `@smoke`-tagged tests |
| `npm run test:regression` | Run only `@regression`-tagged tests |
| `npm run test:chrome` | Run only on Chromium |
| `npm run test:parallel` | Force 4 parallel workers |
| `npm run report` | Open the last HTML report |
| `npm run allure:generate && npm run allure:open` | Generate & open Allure report |
| `npm run typecheck` | TypeScript compile check, no emit |
| `npm run lint` / `lint:fix` | ESLint |

## Adding a new page

1. Create `src/pages/<name>.page.ts`, extend `BasePage`, keep locators `private readonly`.
2. Expose only business-level async methods (`login`, `addProductToCart`, `completeCheckout`...).
   All element interaction goes through `this.actions.*`.
3. Register it in `src/fixtures/pages.fixture.ts` so tests can request it as a fixture.

## Adding Excel-driven test data

1. Add a new sheet/columns to `src/data/testdata.xlsx` (or extend `generate-sample-data.ts`).
2. Add a matching interface in `src/utils/types.ts`.
3. In your spec: `ExcelReader.readSheet(envConfig.testDataFile, 'SheetName')`, then
   `ExcelReader.filterRunnable(rows)` to honor a `run = Y/N` column, then loop with `test.step(...)`.

## Reporting

- **HTML report** (`reports/html-report`) - Playwright's built-in report, screenshots/video/trace on failure.
- **JUnit XML** (`reports/junit-results.xml`) - for CI dashboards (Jenkins, Azure DevOps, Zephyr/Xray import).
- **Allure** (`reports/allure-results` → `reports/allure-report`) - rich step-by-step reporting; `WebActions`
  step names (e.g. "Click on Login button") appear directly as Allure steps.

## CI

`.github/workflows/playwright.yml` installs dependencies/browsers, runs the `@regression` suite,
and uploads the HTML report and Allure results as build artifacts. Adapt the same shape for
Jenkins/Azure Pipelines - the important part is: `npm ci` → `playwright install --with-deps` →
`npm run test:regression` → publish `reports/`.

## API testing layer

```
src/api/
  routes/api.routes.ts        <- ALL endpoint paths. No file outside this
                                  one contains a URL string.
  models/user.model.ts         <- POJO/DTO layer: typed request & response
                                  shapes + thin model classes (User).
  core/
    spec.builder.ts             <- Fluent builder for headers/params/body
                                  (the RestAssured `given()` equivalent).
    token.manager.ts             <- Owns login + token caching/TTL/refresh.
                                    Services ask for a token; they never
                                    call the login endpoint themselves.
    api.client.ts                 <- ONLY class that calls Playwright's
                                    APIRequestContext get/post/put/patch/
                                    delete. Logs, times, and error-wraps
                                    every call. Returns an ApiResult
                                    (status/ok/typed body helper).
  services/user.api.service.ts    <- Common/reusable business API calls
                                    (listUsers, getUserById, createUser...).
                                    Composes SpecBuilder + ApiClient +
                                    TokenManager + Routes + Models.
                                    THIS is what test files call.
src/fixtures/api.fixture.ts        <- Injects apiRequestContext,
                                    tokenManager, userApiService into tests.
tests/api/user.api.spec.ts          <- Calls ONLY `userApiService.*`,
                                    asserts on typed POJOs (User, ApiResult).
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
import `test`/`expect` from `src/fixtures/e2e.fixture.ts` instead, which
merges the two via Playwright's `mergeTests`:

```ts
import { test, expect } from '../src/fixtures/e2e.fixture';

test('adds to cart in UI, verifies via API', async ({ loginPage, inventoryPage, userApiService }) => {
  // loginPage/inventoryPage from pages.fixture, userApiService from api.fixture,
  // both available on the same `test`.
});
```

Put these specs in `tests/e2e/`. Don't reach for this fixture by default -
if a test only touches one side, use that side's fixture file directly.

### Running API tests

```bash
npm run test -- tests/api                 # all API tests
npx playwright test tests/api --grep @smoke
```

Default demo target is `https://reqres.in` (`API_BASE_URL` in `.env`),
a free public test API - swap it for your real service by changing
`API_BASE_URL`, `API_AUTH_EMAIL`, `API_AUTH_PASSWORD` in `.env`.

### Adding a new API domain (e.g. "Orders")

1. `src/api/models/order.model.ts` - request/response interfaces + optional model class.
2. Add paths to `src/api/routes/api.routes.ts` (`ApiRoutes.ORDERS = {...}`).
3. `src/api/services/order.api.service.ts` - business methods using `ApiClient` + `SpecBuilder` + `TokenManager` + routes/models.
4. Register `orderApiService` in `src/fixtures/api.fixture.ts`.
5. Write `tests/api/order.api.spec.ts` calling only `orderApiService.*`.

## Design principles applied

- **SRP** - config, logging, element interaction, page objects, and test intent are each isolated.
- **DIP** - tests depend on Page Object abstractions (business methods), not on Playwright internals.
- **DRY** - all waits/logging/error-handling live once, in `WebActions`.
- **Data/logic separation** - Excel supplies data; page objects supply behavior; tests supply intent.
- **Thread/worker safety** - Playwright's fixture-per-test browser context model gives natural
  isolation across parallel workers; `ExcelReader` caches per file+sheet so parallel workers
  don't re-parse the workbook, and cached data is read-only.
