import { test, expect } from '../../fixtures/pages.fixture';
import { ExcelReader } from '../../../../core/excel.reader';
import { bookstoreConfig } from '../../app.config';

// BLOCKED (ARISE-2, see Jira comment for full history): demoqa.com's register/login
// flow crashes client-side on a reCAPTCHA script error. Through Playwright's actual
// test runner this reproduced 5/5 times across every mitigation tried - login redirect
// retries with full page reloads, and capturing the /Account/v1/Login network response
// directly instead of the UI redirect - with trace/video/screenshot recording ruled out
// as the cause (still failed with all three off). The underlying account IS created
// server-side (POST /Account/v1/User -> 201) every time; only the client-side success
// signal (popup, redirect, and even the login request firing at all) is unreliable.
// Retries are kept as a low-cost safety net in case of an occasional pass, scoped to
// this file only (not the shared Playwright config) - do not treat a pass/fail here as
// conclusive without checking run history.
test.describe.configure({ retries: 3 });

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(bookstoreConfig.testDataFile);
});

test('@smoke @regression ARISE-2 Register to Book Store', async ({ registerPage, loginPage }) => {
  const row = await ExcelReader.getTestDataRow(bookstoreConfig.testDataFile, 'RegisterData', 'TC_REGISTER_01');
  const username = `${row.get('usernamePrefix') ?? 'user'}_${Date.now()}`;
  const password = row.get('password') ?? '';

  await test.step('Navigate to Register to Book Store', async () => {
    await registerPage.open();
    await registerPage.assertLoaded();
  });

  await test.step('Enter First Name, Last Name, UserName, Password', async () => {
    await registerPage.register(row.get('firstName') ?? '', row.get('lastName') ?? '', username, password);
  });

  // demoqa.com's "Registration successful" popup never renders due to a client-side
  // reCAPTCHA script error on the site (confirmed live: the account is created
  // server-side - POST /Account/v1/User returns 201 - but the success-modal
  // rendering code throws before it can display, and the same error makes the
  // post-login UI redirect unreliable too). Verifying via the login API response
  // itself - captured directly off a real login submission - proves registration
  // succeeded without depending on either broken client-side behavior.
  await test.step('Verify registration succeeded by logging in with the newly created credentials', async () => {
    await loginPage.open();
    const response = await loginPage.loginAndCaptureResponse(username, password);
    expect(response.status).toBe(200);
    expect((response.body as { username?: string })?.username).toBe(username);
    expect((response.body as { token?: string })?.token).toBeTruthy();
  });
});
