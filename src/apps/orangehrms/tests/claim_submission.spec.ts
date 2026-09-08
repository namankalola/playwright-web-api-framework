import { test, expect } from '../fixtures/pages.fixture';
import { ExcelReader } from '../../../core/excel.reader';
import { orangehrmsConfig } from '../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(orangehrmsConfig.testDataFile);
});

test.describe('Claim Submission', () => {
  test.beforeEach(async ({ loginPage }) => {
    await test.step('Login using valid credentials', async () => {
      await loginPage.open();
      await loginPage.login(orangehrmsConfig.defaultUsername, orangehrmsConfig.defaultPassword);
      await loginPage.assertLoginSuccessful();
    });
  });

  test('@smoke @regression HRMS-2 creates a claim with only mandatory fields (Event, Currency)', async ({ claimPage }) => {
    const row = await ExcelReader.getTestDataRow(orangehrmsConfig.testDataFile, 'ClaimData', 'TC_CLAIM_01');

    await test.step('Navigate to Submit Claim', async () => {
      await claimPage.open();
    });

    await test.step('Validate the list of mandatory fields before filling them', async () => {
      const mandatoryFields = await claimPage.getMandatoryFieldLabels();
      expect(mandatoryFields).toEqual(['Event', 'Currency']);
    });

    await test.step('Fill only the mandatory fields (Event, Currency) and leave Remarks blank', async () => {
      await claimPage.createClaim(row.get('event') ?? '', row.get('currency') ?? '', row.get('remarks') ?? '');
    });

    await test.step('Verify the claim request is created successfully', async () => {
      await claimPage.assertClaimCreatedSuccessfully();
      expect(await claimPage.getStatus()).toBe('Initiated');
      expect((await claimPage.getReferenceId()).length).toBeGreaterThan(0);
    });
  });

  test('@smoke @regression HRMS-3 Successful claim creation with all fields (Event, Currency, Remarks)', async ({ claimPage }) => {
    const row = await ExcelReader.getTestDataRow(orangehrmsConfig.testDataFile, 'ClaimData', 'TC_CLAIM_02');

    await test.step('Navigate to Submit Claim', async () => {
      await claimPage.open();
    });

    await test.step('Fill all fields (Event, Currency, Remarks)', async () => {
      await claimPage.createClaim(row.get('event') ?? '', row.get('currency') ?? '', row.get('remarks') ?? '');
    });

    await test.step('Verify the claim request is created successfully', async () => {
      await claimPage.assertClaimCreatedSuccessfully();
      expect(await claimPage.getStatus()).toBe('Initiated');
      expect((await claimPage.getReferenceId()).length).toBeGreaterThan(0);
    });
  });

  test('@smoke @regression HRMS-4 Create Claim Request -> Mandatory Fields Validation', async ({
    claimPage,
  }) => {
    const row = await ExcelReader.getTestDataRow(orangehrmsConfig.testDataFile, 'ClaimData', 'TC_CLAIM_03');

    await test.step('Navigate to Submit Claim', async () => {
      await claimPage.open();
    });

    await test.step('Click Create without filling the mandatory fields (Event, Currency)', async () => {
      await claimPage.createClaim(row.get('event') ?? '', row.get('currency') ?? '', row.get('remarks') ?? '');
    });

    await test.step('Verify required-field validation messages are shown for Event and Currency', async () => {
      const messages = await claimPage.getValidationMessages();
      expect(messages).toHaveLength(2);
      for (const message of messages) {
        expect(message).toBe('Required');
      }
    });
  });

  test('@smoke @regression HRMS-5 Submit claim and validate details via Employee Claims search', async ({
    claimPage,
    employeeClaimsPage,
  }) => {
    const row = await ExcelReader.getTestDataRow(orangehrmsConfig.testDataFile, 'ClaimData', 'TC_CLAIM_04');

    let referenceId = '';

    await test.step('Submit a claim with Event=Accommodation', async () => {
      await claimPage.open();
      await claimPage.createClaim(row.get('event') ?? '', row.get('currency') ?? '', row.get('remarks') ?? '');
      await claimPage.assertClaimCreatedSuccessfully();
      referenceId = await claimPage.getReferenceId();
      expect(referenceId.length).toBeGreaterThan(0);
    });

    await test.step('Search for the claim in Employee Claims by Reference Id', async () => {
      await employeeClaimsPage.open();
      await employeeClaimsPage.searchByReferenceId(referenceId);
      await employeeClaimsPage.assertSearchResultVisible();
    });

    await test.step('Verify the claim details match what was entered', async () => {
      const result = await employeeClaimsPage.getSearchResult();
      expect(result.referenceId).toBe(referenceId);
      expect(result.event).toBe(row.get('event'));
      expect(result.currency).toBe(row.get('currency'));
      expect(result.remarks).toBe(row.get('remarks'));
      expect(result.status).toBe('Initiated');
    });
  });

    test('@smoke @regression HRMS-6 submits a Medical Reimbursement claim and validates it via Employee Claims search by Reference Id', async ({
    claimPage,
    employeeClaimsPage,
  }) => {
    const row = await ExcelReader.getTestDataRow(orangehrmsConfig.testDataFile, 'ClaimData', 'TC_CLAIM_05');

    let referenceId = '';

    await test.step('Submit a claim with Event=Medical Reimbursement', async () => {
      await claimPage.open();
      await claimPage.createClaim(row.get('event') ?? '', row.get('currency') ?? '', row.get('remarks') ?? '');
      await claimPage.assertClaimCreatedSuccessfully();
      referenceId = await claimPage.getReferenceId();
      expect(referenceId.length).toBeGreaterThan(0);
    });

    await test.step('Search for the claim in Employee Claims by Reference Id', async () => {
      await employeeClaimsPage.open();
      await employeeClaimsPage.searchByReferenceId(referenceId);
      await employeeClaimsPage.assertSearchResultVisible();
    });

    await test.step('Verify the claim details match what was entered', async () => {
      const result = await employeeClaimsPage.getSearchResult();
      expect(result.referenceId).toBe(referenceId);
      expect(result.event).toBe(row.get('event'));
      expect(result.currency).toBe(row.get('currency'));
      expect(result.remarks).toBe(row.get('remarks'));
      expect(result.status).toBe('Initiated');
    });
  });

    test('@smoke @regression HRMS-7 Submit Travel Allowance claim and validate details via Employee Claims search by Reference Id', async ({
    claimPage,
    employeeClaimsPage,
  }) => {
    const row = await ExcelReader.getTestDataRow(orangehrmsConfig.testDataFile, 'ClaimData', 'TC_CLAIM_06');

    let referenceId = '';

    await test.step('Submit a claim with Event=Travel Allowance', async () => {
      await claimPage.open();
      await claimPage.createClaim(row.get('event') ?? '', row.get('currency') ?? '', row.get('remarks') ?? '');
      await claimPage.assertClaimCreatedSuccessfully();
      referenceId = await claimPage.getReferenceId();
      expect(referenceId.length).toBeGreaterThan(0);
    });

    await test.step('Search for the claim in Employee Claims by Reference Id', async () => {
      await employeeClaimsPage.open();
      await employeeClaimsPage.searchByReferenceId(referenceId);
      await employeeClaimsPage.assertSearchResultVisible();
    });

    await test.step('Verify the claim details match what was entered', async () => {
      const result = await employeeClaimsPage.getSearchResult();
      expect(result.referenceId).toBe(referenceId);
      expect(result.event).toBe(row.get('event'));
      expect(result.currency).toBe(row.get('currency'));
      expect(result.remarks).toBe(row.get('remarks'));
      expect(result.status).toBe('Initiated');
    });
  });
});
