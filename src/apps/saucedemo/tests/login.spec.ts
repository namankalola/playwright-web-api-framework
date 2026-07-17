import { test, expect } from '../fixtures/pages.fixture';
import { ExcelReader } from '../../../core/excel.reader';
import { saucedemoConfig } from '../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(saucedemoConfig.testDataFile);
});

test.describe('@smoke @regression Login', () => {
  let loginRows = new Array<Map<string, string>>();

  test.beforeAll(async () => {
    loginRows = await ExcelReader.getAllRowsFromSheet(saucedemoConfig.testDataFile, 'LoginData');
  });

  test('@smoke logs in successfully with valid credentials', async ({ loginPage, inventoryPage }) => {
    await loginPage.open();
    await loginPage.login(saucedemoConfig.defaultUsername, saucedemoConfig.defaultPassword);
    await inventoryPage.assertLoaded();
  });

  test('shows an error for a locked-out user', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('locked_out_user', saucedemoConfig.defaultPassword);
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
