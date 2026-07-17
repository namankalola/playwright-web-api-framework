import { test, expect } from '../src/fixtures/pages.fixture';
import { ExcelReader } from '../src/utils/excel.reader';
import { envConfig } from '../src/config/env.config';
// import { LoginTestData } from '../src/utils/types';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(envConfig.testDataFile);
});

test.describe('@smoke @regression Login', () => {
  let loginRows = new Array<Map<string, string>>();

  test.beforeAll(async () => {
    loginRows = await ExcelReader.getAllRowsFromSheet(envConfig.testDataFile, 'LoginData');
  });

  test('@smoke logs in successfully with valid credentials', async ({ loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(envConfig.defaultUsername, envConfig.defaultPassword);
    await inventoryPage.assertLoaded();
  });

  test('shows an error for a locked-out user', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('locked_out_user', envConfig.defaultPassword);
    await loginPage.assertErrorVisible();
    expect(await loginPage.getErrorMessage()).toContain('locked out');
  });

  test('@regression runs all Excel-driven login scenarios', async ({ loginPage, inventoryPage }) => {
    for (const row of loginRows) {
      await test.step(`${row.get('testCaseId')}: ${row.get('username') || '(empty)'} / expect ${row.get('expectedResult')}`, async () => {
        await loginPage.open();
        await loginPage.login(row.get('username') || '', row.get('password') || '');

        switch (row.get('expectedResult')) {
          case 'success':
            await inventoryPage.assertLoaded();
            break;
          case 'locked':
            expect(await loginPage.getErrorMessage()).toContain('locked out');
            break;
          case 'invalid':
            expect(await loginPage.getErrorMessage()).toContain('do not match');
            break;
          case 'missingUsername':
            expect(await loginPage.getErrorMessage()).toContain('Username is required');
            break;
        }
      });
    }
  });
});
