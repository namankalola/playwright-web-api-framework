# bookstore — app-specific workflow reference

Read alongside the root `CLAUDE.md`, which owns the framework-wide POM/Excel/Jira rules and
the step-by-step workflow. This file only holds what's specific to the Bookstore AUT (the
DemoQA Book Store application).

- **Base URL**: `https://demoqa.com` (`bookstoreConfig.baseUrl`, `src/apps/bookstore/app.config.ts`)
- **Jira project key**: `ARISE` (`bookstoreConfig.jiraProjectKey`)
- **Default credentials**: `bookstoreConfig.defaultUsername` / `bookstoreConfig.defaultPassword`
  — both empty by default. DemoQA has no shared demo account; a successful-login test needs a
  real account registered via `/register` first (set `BOOKSTORE_USERNAME`/`BOOKSTORE_PASSWORD`
  in `.env` once one exists). Never invent credentials in a spec or in test data.
- **Playwright config**: `playwright.bookstore.config.ts` — run with `npm run test:bookstore`
  (or `--grep @smoke`/`@regression` variants)
- **Generated spec target**: `src/apps/bookstore/tests/generated/<TASK-KEY>.spec.ts`
- **No API layer yet** — this app currently only has a UI/page-object layer. Add
  `src/apps/bookstore/api/` + `fixtures/api.fixture.ts`/`e2e.fixture.ts` the same way
  saucedemo's was added, if/when a task needs one (DemoQA does expose a BookStore/Account
  REST API under `/BookStoreV1`, `/Account` — see the "Book Store API" link in the site's left
  nav — but it isn't wired up here yet).

## BLOCKED — demoqa.com register/login reCAPTCHA crash (ARISE-2)

ARISE-2 ("Register to Book Store") could not be made to pass reliably and was left **In
Progress** in Jira rather than moved to Done — see the full history in the Jira comment. Do not
attempt to "fix" `ARISE_2.spec.ts` by tweaking selectors or waits; the code is correct, the
target site is not. Summary for whoever picks this up next:

- demoqa.com's register and login pages load a reCAPTCHA script that throws a client-side error
  (`Cannot read properties of undefined (reading '<sitekey>')`). The account/login themselves
  are genuinely created/authenticated server-side every time (`POST /Account/v1/User` → `201`,
  `POST /Account/v1/Login` → `200` with a valid token) — only the client-side success signal is
  broken.
- Three verification strategies were tried and all failed **specifically when run through
  Playwright's actual test runner** (`npx playwright test`), while raw `chromium.launch()`
  scripts outside the test runner sometimes succeeded:
  1. Asserting the "Registration successful" popup — never rendered, 0/2 (headless and headed).
  2. Asserting the post-login redirect to `/profile`, with full-page-reload retries — failed
     5/5 across two full runs.
  3. Capturing the `/Account/v1/Login` network response directly (bypassing the UI entirely) —
     failed 5/5; on some runs the login click's handler crashed before even issuing the request.
- Disabling Playwright's trace/video/screenshot recording for the spec did **not** fix it,
  ruling out CDP instrumentation as the cause. The remaining untested suspect is the
  `devices['Desktop Chrome']` viewport/userAgent fingerprint every project in
  `playwright.base.config.ts` uses (shared across all apps) — not experimented with further
  since that risks affecting saucedemo/orangehrms too.
- `ARISE_2.spec.ts` is left in place with `test.describe.configure({ retries: 3 })` as a
  low-cost safety net (in case of an occasional pass) and the network-response assertion (the
  most defensible of the three approaches), but a failing/passing run here should not be taken
  as conclusive either way without checking history.
- This is a site-side characteristic of the public demo instance, not a framework defect — same
  category as the OrangeHRMS shared-demo-server flakiness noted for that app, but more severe
  (0% reproducible pass rate here vs. intermittent there).

## Page object inventory (`src/apps/bookstore/pages/`)

Check these for reuse before adding a new locator or method. Every locator below was verified
live against `https://demoqa.com`.

- **`LoginPage`** (`login.page.ts`) — `open()` (`/login`), `login(username, password)`,
  `goToRegister()`, `getErrorMessage()`, `assertErrorVisible()`, `assertLoginSuccessful()`,
  `loginAndCaptureResponse(username, password)`. Locators: `#userName`, `#password`, `#login`
  (submit button), `#newUser` (Register button), `#name` (error banner — text reads "Invalid
  username or password!" for bad credentials). `assertLoginSuccessful()` asserts the URL
  contains `profile` — reliable for negative-path tests (URL correctly stays at `/login` on
  invalid credentials, see `ARISE_1.spec.ts`), but per the flakiness note above, do **not** rely
  on it alone for a real successful-login assertion; prefer `loginAndCaptureResponse()`, which
  returns `{ status, body }` off the actual `/Account/v1/Login` network response.
- **`RegisterPage`** (`register.page.ts`) — `open()` (`/register`), `assertLoaded()`,
  `register(firstName, lastName, username, password)`. Locators: `#firstname`, `#lastname`
  (lowercase — not `#firstName`/`#lastName`), `#userName`, `#password` (pattern-validated:
  needs lower + upper + digit + special char, 8+ length), `#register`. A successful registration
  needs a never-before-used username (a duplicate returns "User exists!" instead of creating an
  account) — see `RegisterData.usernamePrefix` below. Do not assert on the "Registration
  successful" popup (`#output`/`.modal-content`) — see flakiness note above.
- **`BooksPage`** (`books.page.ts`) — `open()` (`/books`), `assertLoaded()`, `search(term)`,
  `getRowCount()`, `getBookTitles()`, `getBookAuthors()`, `getBookPublishers()`,
  `openBook(title)`, `goToLogin()`. The book list is a plain native `<table>` (no virtualized
  grid/`react-table` classes), so rows/columns are addressed positionally
  (`table tbody tr td:nth-child(n)`) — there's no better semantic hook since `<td>`s carry no
  role/label beyond generic `cell`. Each title is also independently reachable via
  `getByRole('link', { name: title, exact: true })`, since the title text itself is the link's
  accessible name (used by `openBook`). Search is client-side/instant (no submit button or
  Enter needed) — filling `#searchBox` alone narrows the table. Book count on the unfiltered
  page was 8 at verification time; don't hardcode that in a spec, read it via `getRowCount()`
  or an Excel-driven expected count instead. Clicking a title navigates to
  `/books?search=<isbn>`, a detail view with ISBN/Title/Sub Title/Author/Publisher/Total
  Pages/Description handled by `BookDetailPage` below. `getBookSummary(title)` captures a
  single row's Title/Author/Publisher by matching index across the three column locators (no
  per-row grouping locator exists, per the plain-`<table>` note above).
- **`BookDetailPage`** (`book-detail.page.ts`) — `assertLoaded()`, `getDetails()` (returns
  `{ isbn, title, subTitle, author, publisher, totalPages }`), `backToBookStore()`. Every
  value label on this page shares the same literal `id="userName-value"` (copy-paste artifact
  in demoqa's markup — confirmed live), so fields are scoped through their own
  `#<field>-wrapper` container instead (e.g. `#author-wrapper .col-md-9 label`); wrapper ids
  are lowercase except `#ISBN-wrapper`. The back button's real id is `#addNewRecordButton`
  despite its text reading "Back To Book Store" (another copy-paste artifact, presumably
  reused from a CRUD-form component elsewhere on demoqa) — confirmed live to navigate back to
  `/books` reliably through Playwright's test runner (verified 4/4 in `ARISE_3.spec.ts`); an
  earlier raw-script diagnostic (outside the actual test runner) saw it hang at `about:blank`,
  but that did not reproduce through the framework's real runner — don't trust standalone
  diagnostic scripts alone to characterize this app's behavior, always confirm through an
  actual spec run.

## Excel sheets (`src/apps/bookstore/data/testdata.xlsx`)

- **`LoginData`**: `testCaseId`, `username`, `password`, `expectedResult` (`invalid` so far —
  no `success` row yet, see credentials note above), `run`. `TC_LOGIN_01` uses the exact
  credentials specified by ARISE-1 (`anyuser`/`Password`) — verified live.
- **`RegisterData`**: `testCaseId`, `firstName`, `lastName`, `usernamePrefix`, `password`, `run`.
  `TC_REGISTER_01` is the base data for ARISE-2; the spec appends `_${Date.now()}` to
  `usernamePrefix` at runtime for a guaranteed-unique username (see `RegisterPage` note above)
  — don't add a fixed `username` column here, it would collide on re-run.
- **`BookDetailData`**: `testCaseId`, `bookTitle`, `run`. `TC_BOOKDETAIL_01` =
  "Learning JavaScript Design Patterns" — must be a title that exists on the unfiltered
  `/books` listing.

Regenerate/extend via `src/apps/bookstore/utils/generate-sample-data.ts` +
`npm run generate:testdata:bookstore`.

## Reference files

- `src/apps/orangehrms/tests/login.spec.ts` — Excel-driven loop pattern to mirror once a
  bookstore login/books spec is generated from a real Jira task.
- `src/apps/bookstore/tests/generated/ARISE_1.spec.ts` — invalid-login negative test.
- `src/apps/bookstore/tests/generated/ARISE_2.spec.ts` — registration test; reference for the
  `test.describe.configure({ retries: N })` pattern used to scope retries to a single flaky spec
  without touching the shared Playwright config.
- `src/apps/bookstore/tests/generated/ARISE_3.spec.ts` — books list → book detail → back
  navigation; reference for `BooksPage.getBookSummary()` + `BookDetailPage`.
