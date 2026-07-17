import { test, expect } from '../fixtures/pages.fixture';
import { ExcelReader } from '../../../core/excel.reader';
import { orangehrmsConfig } from '../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(orangehrmsConfig.testDataFile);
});

test.describe('@smoke @regression OrangeHRMS Login', () => {
  let loginRows = new Array<Map<string, string>>();

  test.beforeAll(async () => {
    loginRows = await ExcelReader.getAllRowsFromSheet(orangehrmsConfig.testDataFile, 'LoginData');
  });

  test('@smoke @regression runs all Excel-driven login scenarios', async ({ loginPage }) => {
    for (const row of loginRows) {
      await test.step(`${row.get('testCaseId')}: ${row.get('username') || '(empty)'} / expect ${row.get('expectedResult')}`, async () => {
        await loginPage.open();
        await loginPage.login(row.get('username') || '', row.get('password') || '');

        switch (row.get('expectedResult')) {
          case 'success':
            await loginPage.assertLoginSuccessful();
            break;
          case 'invalid':
            await loginPage.assertErrorVisible();
            expect(await loginPage.getErrorMessage()).toContain('Invalid credentials');
            break;
        }
      });
    }
  });
});
