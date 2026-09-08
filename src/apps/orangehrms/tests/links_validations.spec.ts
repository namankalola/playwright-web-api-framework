import { test, expect } from '../fixtures/pages.fixture';
import { ExcelReader } from '../../../core/excel.reader';
import { orangehrmsConfig } from '../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(orangehrmsConfig.testDataFile);
});

test.describe('Validate Dashboard Links', () => {
  let dashboardLinkRows = new Array<Map<string, string>>();

  test.beforeAll(async () => {
    dashboardLinkRows = await ExcelReader.getAllRowsFromSheet(orangehrmsConfig.testDataFile, 'DashboardLinksData');
  });

  test.beforeEach(async ({ loginPage }) => {
    await test.step('Login using valid credentials', async () => {
      await loginPage.open();
      await loginPage.login(orangehrmsConfig.defaultUsername, orangehrmsConfig.defaultPassword);
      await loginPage.assertLoginSuccessful();
    });
  });

  test('@smoke @regression HRMS-8 validates all Dashboard links open their respective pages', async ({
    dashboardPage,
  }, testInfo) => {
    // 12 Excel-driven iterations (navigate + click + assert each) run past the
    // shared 60s project timeout on slower browsers/CI, and the shared public
    // demo server (opensource-demo.orangehrmlive.com) is intermittently slow
    // under load - verified live, individual steps have taken over 15s each.
    // This scoped override doesn't touch playwright.base.config.ts's timeout,
    // which every other app/spec also relies on.
    testInfo.setTimeout(240_000);

    for (const row of dashboardLinkRows) {
      await test.step(`${row.get('testCaseId')}: "${row.get('linkName')}" link opens its respective page`, async () => {
        await dashboardPage.open();
        await dashboardPage.clickMenuLink(row.get('linkName') ?? '');
        await dashboardPage.assertModulePageOpened(row.get('expectedUrlFragment') ?? '');
        expect(await dashboardPage.getCurrentUrl()).toContain(row.get('expectedUrlFragment'));
      });
    }
  });
});

test.describe('Validate Quick Launch Links', () => {
  let quickLaunchLinkRows = new Array<Map<string, string>>();

  test.beforeAll(async () => {
    quickLaunchLinkRows = await ExcelReader.getAllRowsFromSheet(orangehrmsConfig.testDataFile, 'QuickLaunchLinksData');
  });

  test.beforeEach(async ({ loginPage }) => {
    await test.step('Login using valid credentials', async () => {
      await loginPage.open();
      await loginPage.login(orangehrmsConfig.defaultUsername, orangehrmsConfig.defaultPassword);
      await loginPage.assertLoginSuccessful();
    });
  });

  test('@smoke @regression HRMS-9 validates all Quick Launch links under Dashboard page open their respective pages', async ({
    dashboardPage,
  }, testInfo) => {
    // 6 Excel-driven iterations (navigate + click + assert each) can run past the
    // shared 60s project timeout on slower browsers/CI, and the shared public
    // demo server (opensource-demo.orangehrmlive.com) is intermittently slow
    // under load - see HRMS_8.spec.ts. This scoped override doesn't touch
    // playwright.base.config.ts's timeout, which every other app/spec relies on.
    testInfo.setTimeout(180_000);

    for (const row of quickLaunchLinkRows) {
      await test.step(`${row.get('testCaseId')}: "${row.get('linkName')}" Quick Launch link opens its respective page`, async () => {
        await dashboardPage.open();
        await dashboardPage.clickQuickLaunchLink(row.get('linkName') ?? '');
        await dashboardPage.assertModulePageOpened(row.get('expectedUrlFragment') ?? '');
        expect(await dashboardPage.getCurrentUrl()).toContain(row.get('expectedUrlFragment'));
      });
    }
  });
});
