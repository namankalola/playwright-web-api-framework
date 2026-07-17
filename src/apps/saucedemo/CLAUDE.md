# saucedemo — app-specific workflow reference

Read alongside the root `CLAUDE.md`, which owns the framework-wide POM/Excel/Jira rules and
the step-by-step workflow. This file only holds what's specific to the SauceDemo AUT.

- **Base URL**: `https://www.saucedemo.com` (`saucedemoConfig.baseUrl`, `src/apps/saucedemo/app.config.ts`)
- **Jira project key**: `SCRUM`
- **Default credentials**: `saucedemoConfig.defaultUsername` / `saucedemoConfig.defaultPassword`
  (`standard_user` / `secret_sauce` by default — never hardcode these in a spec)
- **Playwright config**: `playwright.saucedemo.config.ts` — run with
  `npm run test:saucedemo` (or `--grep @smoke`/`@regression` variants)
- **Generated spec target**: `src/apps/saucedemo/tests/generated/<TASK-KEY>.spec.ts`

## Page object inventory (`src/apps/saucedemo/pages/`)

Check these for reuse before adding a new locator or method.

- **`LoginPage`** (`login.page.ts`) — `open()`, `login(username, password)`,
  `getErrorMessage()`, `assertErrorVisible()`.
- **`InventoryPage`** (`inventory.page.ts`) — `assertLoaded()`,
  `addProductToCart(name)`, `addAllProductsToCart()`, `getCartItemCount()`, `goToCart()`,
  `sortProductsBy(option)`, `getProductNames()`, `getProductPrices()`.
- **`CartPage`** (`cart.page.ts`) — `getCartItemNames()`, `getCartItemCount()`,
  `getRemoveButtonCount()`.
- **`CheckoutPage`** (`checkout.page.ts`) — `startCheckout()`, `fillFirstName/LastName/PostalCode()`,
  `clickContinue()`, `fillShippingInfo(first, last, postal)`, `finishOrder()`,
  `getConfirmationMessage()`, `goBackToHome()`, `getShippingErrorMessage()`,
  `assertShippingErrorVisible()`, `isFirstNameFieldInvalid()/isLastNameFieldInvalid()/isPostalCodeFieldInvalid()`,
  `assertOnCheckoutStepOnePage()`, `completeCheckout(first, last, postal)`.

## Excel sheets (`src/apps/saucedemo/data/testdata.xlsx`)

- **`LoginData`**: `testCaseId`, `username`, `password`, `expectedResult`
  (`success`/`locked`/`invalid`/`missingUsername`), `run`.
- **`CheckoutData`**: `testCaseId`, `product`, `firstName`, `lastName`, `postalCode`,
  `expectedResult`, `expectedMessage`, `stepOneMessage`, `stepTwoMessage`, `stepThreeMessage`,
  `apiJobTitle`, `run`.
- **`SortingData`**: `testCaseId`, `sortOption` (`az`/`za`/`lohi`/`hilo`), `sortLabel`, `run`.

Regenerate/extend via `src/apps/saucedemo/utils/generate-sample-data.ts` +
`npm run generate:testdata:saucedemo`.

## API layer (optional demo layer against reqres.in)

`src/apps/saucedemo/api/` — `UserApiService` (`listUsers`, `getUserById`, `createUser`,
`updateUser`, `deleteUser`), backed by `TokenManager` (login-and-cache) and `ApiRoutes`
(`/api/login`, `/api/users`, ...). Spec files import `test`/`expect` from
`src/apps/saucedemo/fixtures/api.fixture.ts` (API-only) or `e2e.fixture.ts` (UI+API combined,
see `src/apps/saucedemo/tests/e2e/`). This is a demo integration against the public reqres.in
API, not part of the real SauceDemo app — treat it as a template for wiring a real API later.

## Reference files

- `src/apps/saucedemo/tests/login.spec.ts` — fixture usage + Excel-driven loop pattern.
- `src/apps/saucedemo/tests/checkout.spec.ts` — multi-row checkout pattern, `test.step()`
  structure.
- `src/apps/saucedemo/tests/checkout_validation.spec.ts` — **anti-pattern, do not copy** (see
  root `CLAUDE.md`).
