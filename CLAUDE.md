# Claude.md

You are a QA Automation workflow for a **multi-application** Playwright + TypeScript
framework. Multiple AUTs (applications under test) live side by side in this repo, each
fully self-contained under `src/apps/<app>/` — page objects, fixtures, API layer, test data,
**and its own tests** (`src/apps/<app>/tests/`) — plus its own `CLAUDE.md`. Only
`src/core/` is shared across every app (framework infra: web/API action wrappers, logger,
Excel reader, cross-app env config, Jira client).

Your job is to read Jira tasks, create Playwright tests, and update Jira — while strictly
following this repo's Page Object Model (POM) and Excel data-driven architecture, scoped to
the one app the task belongs to. Before writing anything, read `README.md` for the full
architecture reference.

## App registry

The app is always named explicitly in the request (e.g. "pick up saucedemo SCRUM-12") — never
infer it from the Jira key prefix. Resolve `<app>` to its row below and read that app's
`CLAUDE.md` for its Jira project key, base URL, page object inventory, and Excel sheet names
*before* doing anything else.

| App | CLAUDE.md |
|---|---|
| saucedemo | `@src/apps/saucedemo/CLAUDE.md` |
| orangehrms | `@src/apps/orangehrms/CLAUDE.md` |

## Workflow for each task

1. Resolve `<app>` from the request and read `src/apps/<app>/CLAUDE.md` for its Jira project
   key, base URL, page object inventory, and Excel sheet names.
2. Fetch the task from Jira using `src/core/jira.ts`, using the app's Jira project key.
3. Read the description — understand test steps and acceptance criteria.
4. Move the task to **"In Progress"** in Jira.
5. Use Playwright-CLI to inspect the app's base URL (from its `app.config.ts`/`CLAUDE.md`) and
   find real selectors.
6. **Reuse before you build** (see "Page Object Rules" below) — inspect
   `src/apps/<app>/pages/*.page.ts` and `src/apps/<app>/fixtures/pages.fixture.ts` for existing
   page objects/methods that already cover part of this flow. Only add new locators/methods
   for what's genuinely missing.
7. Prepare the test data row(s) in `src/apps/<app>/data/testdata.xlsx` (see "Test Data Rules"
   below) *before* writing the spec — the spec should only ever reference data via
   `ExcelReader`.
8. Generate a Playwright TypeScript test in `src/apps/<app>/tests/generated/` named by task key
   (e.g. `SCRUM_1.spec.ts`).
9. Wrap each step in `test.step()` matching the steps from the Jira description.
10. Every acceptance criterion must be an `expect()` assertion.
11. Run the test with `npx playwright test --config=playwright.<app>.config.ts` to make sure
    it passes.
12. Run `npm run typecheck` and `npm run lint` — both must be clean (repo-wide; these are not
    app-scoped).
13. If everything passes, append a note:

    ```
    🤖 Automation test created: <filename>, Automated by: Namankumar Kalola

    ```

    to the Jira task description.
14. Move the task to **"Done"**.

If a test fails, or `typecheck`/`lint` fails, analyze and fix it — do not move the task to
Done or touch Jira until it's green.

---

## Page Object Rules (POM) — non-negotiable

This framework enforces a strict 3-layer separation (see `README.md` "Architecture &
Separation of Roles" table). Violating it is the #1 review failure mode — check every
generated file against this list before considering the task done:

1. **Spec files import `test`/`expect` from `src/apps/<app>/fixtures/pages.fixture.ts` only.**
   Never `import { test } from '@playwright/test'` in a file under `tests/`. This is what
   injects that app's page objects (e.g. `loginPage`, `inventoryPage`, `checkoutPage` for
   saucedemo) as fixtures. Never import fixtures across apps.
2. **Spec files never reference `page` directly for interactions or locators.** No
   `page.locator(...)`, `page.getByRole(...)`, `page.getByPlaceholder(...)`,
   `page.waitForURL(...)`, `page.click(...)`, etc. in a `tests/**/*.spec.ts` file. If you
   find yourself typing `page.` in a spec, stop — that logic belongs in a page object method.
3. **Every locator lives in a page object as `private readonly`**, built in the class body
   (e.g. `private readonly errorMessage = this.page.locator('[data-test="error"]');`),
   following the selector priority in "Test Writing Rules" below. Locators are never
   constructed inline inside a method body or inside a spec file.
4. **Page objects expose only business-level public methods** (`login`, `addProductToCart`,
   `completeCheckout`...), never raw technical steps. Every element interaction inside a page
   object goes through `this.actions.*` (`WebActions`, shared in `src/core/web.actions.ts`)
   — never `this.page.click()` / `locator.fill()` directly. See `src/core/web.actions.ts` for
   the full action/assertion vocabulary (click, fill, selectOption, hover, assertVisible,
   assertText, assertContainsText, assertUrlContains, getText, getAllTexts, ...). Add a new
   method to `WebActions` only if a truly new interaction primitive is needed that no app has
   — don't bypass it, and don't add app-specific logic to this shared file.
5. **Reuse existing page objects before creating new ones.** Check
   `src/apps/<app>/pages/*.page.ts` and that app's `CLAUDE.md` page object inventory. If the
   Jira task's flow is already covered by an existing method, call it — don't duplicate it
   inline or write a near-identical new method.
6. **Only add a method or locator if it doesn't already exist.** If an existing page object
   is missing what you need (e.g. a new field, a new error state, a new page), extend that
   page object or create a new `src/apps/<app>/pages/<name>.page.ts` that extends `BasePage`
   (`src/core/base.page.ts`), then register it in `src/apps/<app>/fixtures/pages.fixture.ts`.
   Never work around a missing page object by reaching into `page` from the spec, and never
   add a page object for one app into another app's folder.
7. **Assertions on page state also go through page object methods**, e.g.
   `checkoutPage.assertUrlContains(...)`, `loginPage.assertErrorVisible()`, or a getter like
   `getErrorMessage()`/`getConfirmationMessage()` whose return value the spec asserts on with
   `expect(...)`. The only thing a spec asserts on directly is the *return value* of a page
   object method — never a locator or `page` itself.

### Anti-pattern to never produce (this exists in the repo today — do not copy it)

`src/apps/saucedemo/tests/checkout_validation.spec.ts` currently does this and must **not** be
used as a reference — it directly imports raw `page`, builds locators inline
(`page.getByPlaceholder('Last Name')`, `page.locator('[data-test="shopping-cart-link"]')`),
and hardcodes test data (`'Doe'`, `'12345'`). Every one of these breaks rules 1–7 above.
Treat `src/apps/saucedemo/tests/login.spec.ts` and the single-product test in
`src/apps/saucedemo/tests/checkout.spec.ts` (the `completeCheckout('Jane', 'Doe', '380001')` call is
itself a hardcoded-data violation — see Test Data Rules) as the structural example to follow
for `test.step()`/fixture usage, not for data handling.

---

## Test Writing Rules

- Always use role-based selectors, in this priority order:
  - `getByRole()`
  - `getByLabel()`
  - `getByPlaceholder()`
  - `getByText()`
  - `getByAltText()`
  - `getByTitle()`
  - `getByTestId()`
- Use xpath/CSS via `page.locator()` only when none of the above can uniquely build the
  locator — and even then, it must be defined as a `private readonly` field in a page object,
  never inline.
- Never hardcode credentials in test files — use that app's `app.config.ts`
  (`saucedemoConfig.defaultUsername` / `saucedemoConfig.defaultPassword` for saucedemo) or an
  Excel-driven value.
- Always verify selectors with Playwright-CLI against the live site before writing the test.
- If a test fails, analyze the error and fix it before updating Jira.
- For external redirects (like Calendly), use `waitForURL` inside the relevant page object
  method, with a reasonable timeout — never in the spec.
- For dropdown menus, hover first then click the option.
- Review the existing page classes relevant to the current test before writing new locators
  or methods.
- Locators are added in the corresponding page class only.
- There must be zero locators (`page.locator`, `getByRole`, etc.) in `spec.ts` files.

---

## Test Data Rules

All test data for an app lives in `src/apps/<app>/data/testdata.xlsx` (path comes from that
app's `app.config.ts` `testDataFile` field — for saucedemo, `envConfig.testDataFile` no longer
exists; use `saucedemoConfig.testDataFile`). It's read through `ExcelReader`
(`src/core/excel.reader.ts`, shared across apps), never typed as literals in a spec.

1. **No hardcoded test data in spec files.** Usernames, passwords (other than the app's own
   shared default demo credentials), names, postal codes, product names used in assertions,
   expected messages compared for data-driven cases — all of it comes from an Excel row. A
   literal like `completeCheckout('Jane', 'Doe', '380001')` inside a spec is a rule violation,
   even for a single "smoke" scenario — put it in the sheet as one row instead.
2. **One sheet per feature/flow, not per test case.** Follow the existing convention — in
   saucedemo, `LoginData` and `CheckoutData` in `src/apps/saucedemo/data/testdata.xlsx` each
   hold many rows distinguished by a `testCaseId` column, and are read once per file with
   `ExcelReader.getAllRowsFromSheet(saucedemoConfig.testDataFile, 'SheetName')`.
   - If the Jira task's flow already has a sheet, **append new row(s) to that sheet** — don't
     create a duplicate sheet.
   - Only create a new sheet when the task covers a genuinely new feature/page with no
     existing sheet. Name it `<Feature>Data` in PascalCase, matching the
     `LoginData`/`CheckoutData` pattern.
3. **Column convention.** Every sheet's first column is `testCaseId` (e.g. `TC_LOGIN_01`,
   `TC_CHECKOUT_02`) so rows can be looked up individually via
   `ExcelReader.getTestDataRow()` / `getAllRowsForTestID()` or iterated via
   `getAllRowsFromSheet()`. Add one column per input value the test needs, plus an
   `expectedResult` (or similarly named) column when the row also encodes the expected
   outcome (see `LoginData.expectedResult`: `success` / `locked` / `invalid` /
   `missingUsername`), so the spec can `switch`/branch on it instead of hardcoding expected
   strings per row.
4. **How to add data**: extend `src/apps/<app>/utils/generate-sample-data.ts` with the new
   sheet/columns/rows and re-run `npm run generate:testdata:<app>`, OR write a small one-off
   `exceljs` script that opens the existing `src/apps/<app>/data/testdata.xlsx`, adds a
   worksheet or appends rows to an existing worksheet, and saves it. Never hand-edit binary
   `.xlsx` bytes directly — always go through `exceljs`.
5. **In the spec**, load data with:

   ```ts
   test.beforeAll(async () => {
     await ExcelReader.loadWorkbook(saucedemoConfig.testDataFile);
   });
   ...
   const rows = await ExcelReader.getAllRowsFromSheet(saucedemoConfig.testDataFile, 'SheetName');
   for (const row of rows) {
     await test.step(`${row.get('testCaseId')}: ...`, async () => {
       // pass row.get('columnName') into page object methods
     });
   }
   ```

   matching the pattern in `src/apps/saucedemo/tests/login.spec.ts` (`@regression runs all
   Excel-driven login scenarios`) and the Excel-driven test in
   `src/apps/saucedemo/tests/checkout.spec.ts`.
6. Refer to `login.spec.ts` for the single-row lookup pattern and the multi-row/Excel-driven
   loop pattern in the same file; refer to `checkout.spec.ts`'s
   `completes checkout for all Excel-driven customer records` test for the multi-row checkout
   pattern.

---

## Jira Rules

- Use the Jira project key from the resolved app's `CLAUDE.md`/`app.config.ts` — never
  hardcode a project key in this file, since it varies per app.
- Always move to **In Progress** before starting work.
- Always move to **Done** only after the test passes and `typecheck`/`lint` are clean.
- Never overwrite existing description content — only append.

---

## Adding a new application

Never edit an existing app's files to add a new one — every step below only creates new files
or adds one row to a shared registry table.

1. Create `src/apps/<app>/`, fully self-contained: `app.config.ts` (base URL, credentials,
   test data path, API auth if needed, Jira project key — reading whatever env var names make
   sense for that app, independent of every other app's `app.config.ts`), `pages/`,
   `fixtures/` (`pages.fixture.ts`, plus `api.fixture.ts`/`e2e.fixture.ts` only if the app has
   an API layer), `api/` (only if needed), `data/testdata.xlsx`,
   `utils/generate-sample-data.ts`, `tests/` (specs + `tests/generated/` for AI-generated
   ones, plus `tests/e2e/`/`tests/api/` subfolders as needed), and `CLAUDE.md` (app-specific:
   base URL, Jira project key, page object inventory, Excel sheet names/columns,
   generated-spec target dir).
2. Create `playwright.<app>.config.ts` calling `createConfig()` from `playwright.base.config.ts`
   with that app's `testDir` (`./src/apps/<app>/tests`) and `baseURL` — do not touch another
   app's Playwright config.
3. Add app-scoped `package.json` scripts following the `<action>:<app>[:variant]` convention
   (`test:<app>`, `test:<app>:smoke`, `generate:testdata:<app>`, etc.) — do not rename or
   remove another app's scripts.
4. Add a row to the "App registry" table at the top of this file, pointing at
   `@src/apps/<app>/CLAUDE.md`.

Only `src/core/` is shared (framework infra: `web.actions.ts`, `base.page.ts`, `logger.ts`,
`api.client.ts`, `spec.builder.ts`, `excel.reader.ts`, `env.config.ts`, `jira.ts`) — a truly
new interaction primitive or run-wide setting can be added there, but only if it has zero
app-specific logic in it (see `src/core/spec.builder.ts` for the pattern: generic builder,
zero app-specific defaults; app-specific headers are attached by the caller).

---

## Before marking any task Done — self-check

Re-read the generated `.spec.ts` file and confirm ALL of the following, in order:

1. Imports `test`/`expect` from `src/apps/<app>/fixtures/pages.fixture.ts`, not
   `@playwright/test` and not another app's fixtures.
2. Zero occurrences of `page.` inside the spec file.
3. Zero inline locators (`.locator(`, `getBy...(`) inside the spec file.
4. Every literal value passed into a page object method traces back to an
   `ExcelReader`/`<app>Config` call, not a string/number typed directly in the test.
5. New/changed locators and interaction logic live in `src/apps/<app>/pages/*.page.ts`, added
   to an existing page object where one already fits, or a new page object registered in
   `src/apps/<app>/fixtures/pages.fixture.ts` when it doesn't.
6. New test data was added as row(s) in the appropriate existing sheet in
   `src/apps/<app>/data/testdata.xlsx` (or a new PascalCase `<Feature>Data` sheet only if no
   existing sheet fits), not invented inline.
7. Nothing in `src/core/` was edited to add app-specific logic, and no other app's folder was
   touched.

If any of these fail, fix the file before running the test or touching Jira.

---

When I say:

> **"pick up `<app>` `<TASK-KEY>`"** (e.g. "pick up saucedemo SCRUM-12")

execute the full workflow above for that task, scoped to `<app>` unattended, i.e automated.
