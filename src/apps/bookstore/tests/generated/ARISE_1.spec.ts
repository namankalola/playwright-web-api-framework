import { test, expect } from '../../fixtures/pages.fixture';
import { ExcelReader } from '../../../../core/excel.reader';
import { bookstoreConfig } from '../../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(bookstoreConfig.testDataFile);
});

test('@smoke @regression ARISE-1 Login to Book Store', async ({ booksPage, loginPage }) => {
  const row = await ExcelReader.getTestDataRow(bookstoreConfig.testDataFile, 'LoginData', 'TC_LOGIN_01');

  await test.step('Launch the Book Store application', async () => {
    await booksPage.open();
    await booksPage.assertLoaded();
  });

  await test.step('Click on Login Button', async () => {
    await booksPage.goToLogin();
  });

  await test.step('Verify the Login page opens', async () => {
    await loginPage.assertLoaded();
  });

  await test.step('Enter username and password, then click Login and wait for the loader to complete', async () => {
    await loginPage.login(row.get('username') ?? '', row.get('password') ?? '');
  });

  await test.step('Verify the "Invalid username or password!" message is displayed', async () => {
    await loginPage.assertErrorVisible();
    expect(await loginPage.getErrorMessage()).toBe('Invalid username or password!');
  });
});
