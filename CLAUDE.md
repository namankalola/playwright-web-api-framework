# Claude.md

You are a QA Automation workflow for the SauceDemo project.

Your job is to read Jira tasks, create Playwright tests, and update Jira — while strictly
following this repo's Page Object Model (POM) and Excel data-driven architecture.
Before writing anything, read `README.md` for the full architecture reference.

## Workflow for each task

1. Fetch the task from Jira using `src/utils/jira.ts`.
2. Read the description — understand test steps and acceptance criteria.
3. Move the task to **"In Progress"** in Jira.
4. Use Playwright-CLI to inspect https://www.saucedemo.com and find real selectors.
5. **Reuse before you build** (see "Page Object Rules" below) — inspect `src/pages/*.page.ts`
   and `src/fixtures/pages.fixture.ts` for existing page objects/methods that already cover
   part of this flow. Only add new locators/methods for what's genuinely missing.
6. Prepare the test data row(s) in `src/data/testdata.xlsx` (see "Test Data Rules" below)
   *before* writing the spec — the spec should only ever reference data via `ExcelReader`.
7. Generate a Playwright TypeScript test in `tests/generated/` named by task key
   (e.g. `SCRUM_1.spec.ts`).
8. Wrap each step in `test.step()` matching the steps from the Jira description.
9. Every acceptance criterion must be an `expect()` assertion.
10. Run the test with `npx playwright test` to make sure it passes.
11. Run `npm run typecheck` and `npm run lint` — both must be clean.
12. If everything passes, append a note:
    ```
    🤖 Automation test created: <filename>, Automated by: Namankumar Kalola

    ```
    to the Jira task description.
13. Move the task to **"Done"**.

If a test fails, or `typecheck`/`lint` fails, analyze and fix it — do not move the task to
Done or touch Jira until it's green.

---

## Page Object Rules (POM) — non-negotiable

This framework enforces a strict 3-layer separation (see `README.md` "Architecture &
Separation of Roles" table). Violating it is the #1 review failure mode — check every
generated file against this list before considering the task done:

1. **Spec files import `test`/`expect` from `src/fixtures/pages.fixture.ts` only.**
   Never `import { test } from '@playwright/test'` in a file under `tests/`. This is what
   injects `loginPage`, `inventoryPage`, `checkoutPage`, etc. as fixtures.
2. **Spec files never reference `page` directly for interactions or locators.** No
   `page.locator(...)`, `page.getByRole(...)`, `page.getByPlaceholder(...)`,
   `page.waitForURL(...)`, `page.click(...)`, etc. in a `tests/**/*.spec.ts` file. If you
   find yourself typing `page.` in a spec, stop — that logic belongs in a page object method.
3. **Every locator lives in a page object as `private readonly`**, built in the class body
   (e.g. `private readonly errorMessage = this.page.locator('[data-test="error"]');`),
   following the selector priority in "Test Writing Rules" below. Locators are never
   constructed inline inside a method body or inside a spec file.
4. **Page objects expose only business-level public methods** (`login`, `addProductToCart`,
   `completeCheckout`, `assertErrorVisible`...), never raw technical steps. Every element
   interaction inside a page object goes through `this.actions.*` (`WebActions`) — never
   `this.page.click()` / `locator.fill()` directly. See `src/core/web.actions.ts` for the
   full action/assertion vocabulary (click, fill, selectOption, hover, assertVisible,
   assertText, assertContainsText, assertUrlContains, getText, getAllTexts, ...). Add a new
   method to `WebActions` only if a truly new interaction primitive is needed — don't bypass it.
5. **Reuse existing page objects before creating new ones.** Check `src/pages/*.page.ts`:
   - Login flow → `LoginPage` (`src/pages/login.page.ts`)
   - Product listing / cart badge / sorting → `InventoryPage` (`src/pages/inventory.page.ts`)
   - Checkout steps / confirmation → `CheckoutPage` (`src/pages/checkout.page.ts`)
   If the Jira task's flow is already covered by an existing method, call it — don't
   duplicate it inline or write a near-identical new method.
6. **Only add a method or locator if it doesn't already exist.** If an existing page object
   is missing what you need (e.g. a new field, a new error state, a new page like the cart
   page or checkout-step-two page), extend that page object or create a new
   `src/pages/<name>.page.ts` that extends `BasePage`, then register it in
   `src/fixtures/pages.fixture.ts` so tests can request it as a fixture. Never work around a
   missing page object by reaching into `page` from the spec.
7. **Assertions on page state also go through page object methods**, e.g.
   `checkoutPage.assertUrlContains(...)`, `loginPage.assertErrorVisible()`, or a getter like
   `getErrorMessage()`/`getConfirmationMessage()` whose return value the spec asserts on with
   `expect(...)`. The only thing a spec asserts on directly is the *return value* of a page
   object method — never a locator or `page` itself.

### Anti-pattern to never produce (this exists in the repo today — do not copy it)

`tests/checkout_validation.spec.ts` currently does this and must **not** be used as a
reference — it directly imports raw `page`, builds locators inline
(`page.getByPlaceholder('Last Name')`, `page.locator('[data-test="shopping-cart-link"]')`),
and hardcodes test data (`'Doe'`, `'12345'`). Every one of these breaks rules 1–7 above.
Treat `tests/login.spec.ts` and the single-product test in `tests/checkout.spec.ts` (the
`completeCheckout('Jane', 'Doe', '380001')` call is itself a hardcoded-data violation — see
Test Data Rules) as the structural example to follow for `test.step()`/fixture usage, not for
data handling.

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
- Never hardcode credentials in test files — use `envConfig.defaultUsername` /
  `envConfig.defaultPassword` (`src/config/env.config.ts`) or an Excel-driven value.
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

All test data lives in `src/data/testdata.xlsx` (path comes from
`envConfig.testDataFile`, default `src/data/testdata.xlsx` — **not** `data/generated.xlsx`).
It's read through `ExcelReader` (`src/utils/excel.reader.ts`), never typed as literals in a spec.

1. **No hardcoded test data in spec files.** Usernames, passwords (other than the shared
   `envConfig` default demo credentials), names, postal codes, product names used in
   assertions, expected messages compared for data-driven cases — all of it comes from an
   Excel row. A literal like `completeCheckout('Jane', 'Doe', '380001')` inside a spec is a
   rule violation, even for a single "smoke" scenario — put it in the sheet as one row instead.
2. **One sheet per feature/flow, not per test case.** Follow the existing convention —
   `LoginData` and `CheckoutData` in `src/data/testdata.xlsx` each hold many rows
   distinguished by a `testCaseId` column, and are read once per file with
   `ExcelReader.getAllRowsFromSheet(envConfig.testDataFile, 'SheetName')`.
   - If the Jira task's flow already has a sheet (login → `LoginData`, checkout →
     `CheckoutData`), **append new row(s) to that sheet** — don't create a duplicate sheet.
   - Only create a new sheet when the task covers a genuinely new feature/page with no
     existing sheet (e.g. a new `CartData` sheet for cart-specific scenarios). Name it
     `<Feature>Data` in PascalCase, matching the `LoginData`/`CheckoutData` pattern.
3. **Column convention.** Every sheet's first column is `testCaseId` (e.g. `TC_LOGIN_01`,
   `TC_CHECKOUT_02`) so rows can be looked up individually via
   `ExcelReader.getTestDataRow()` / `getAllRowsForTestID()` or iterated via
   `getAllRowsFromSheet()`. Add one column per input value the test needs, plus an
   `expectedResult` (or similarly named) column when the row also encodes the expected
   outcome (see `LoginData.expectedResult`: `success` / `locked` / `invalid` /
   `missingUsername`), so the spec can `switch`/branch on it instead of hardcoding expected
   strings per row.
4. **How to add data**: extend `src/utils/generate-sample-data.ts` with the new sheet/columns/
   rows and re-run `npm run generate:testdata`, OR write a small one-off `exceljs` script that
   opens the existing `src/data/testdata.xlsx`, adds a worksheet or appends rows to an
   existing worksheet, and saves it. Never hand-edit binary `.xlsx` bytes directly — always
   go through `exceljs`.
5. **In the spec**, load data with:
   ```ts
   test.beforeAll(async () => {
     await ExcelReader.loadWorkbook(envConfig.testDataFile);
   });
   ...
   const rows = await ExcelReader.getAllRowsFromSheet(envConfig.testDataFile, 'SheetName');
   for (const row of rows) {
     await test.step(`${row.get('testCaseId')}: ...`, async () => {
       // pass row.get('columnName') into page object methods
     });
   }
   ```
   matching the pattern in `tests/login.spec.ts` (`@regression runs all Excel-driven login
   scenarios`) and the Excel-driven test in `tests/checkout.spec.ts`.
6. Refer to `login.spec.ts` for the single-row lookup pattern and the multi-row/Excel-driven
   loop pattern in the same file; refer to `checkout.spec.ts`'s
   `completes checkout for all Excel-driven customer records` test for the multi-row checkout
   pattern.

---

## Jira Rules

- Project key is `SCRUM`.
- Always move to **In Progress** before starting work.
- Always move to **Done** only after the test passes and `typecheck`/`lint` are clean.
- Never overwrite existing description content — only append.

---

## Before marking any task Done — self-check

Re-read the generated `.spec.ts` file and confirm ALL of the following, in order:

1. Imports `test`/`expect` from `src/fixtures/pages.fixture.ts`, not `@playwright/test`.
2. Zero occurrences of `page.` inside the spec file.
3. Zero inline locators (`.locator(`, `getBy...(`) inside the spec file.
4. Every literal value passed into a page object method traces back to an
   `ExcelReader`/`envConfig` call, not a string/number typed directly in the test.
5. New/changed locators and interaction logic live in `src/pages/*.page.ts`, added to an
   existing page object where one already fits, or a new page object registered in
   `src/fixtures/pages.fixture.ts` when it doesn't.
6. New test data was added as row(s) in the appropriate existing sheet in
   `src/data/testdata.xlsx` (or a new PascalCase `<Feature>Data` sheet only if no existing
   sheet fits), not invented inline.

If any of these fail, fix the file before running the test or touching Jira.

---

When I say:

> **"pick up SCRUM-X"**

execute the full workflow above for that task.
