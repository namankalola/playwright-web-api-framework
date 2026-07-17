import ExcelJS from 'exceljs';
import * as path from 'path';

/**
 * One-time/CI-time generator for sample test data.
 * Run with: npm run generate:testdata:orangehrms
 */
async function generateSampleData(): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  const loginSheet = workbook.addWorksheet('LoginData');
  loginSheet.columns = [
    { header: 'testCaseId', key: 'testCaseId', width: 15 },
    { header: 'username', key: 'username', width: 20 },
    { header: 'password', key: 'password', width: 20 },
    { header: 'expectedResult', key: 'expectedResult', width: 15 },
    { header: 'run', key: 'run', width: 8 },
  ];
  // Invalid-credential rows run before the success row - a successful login
  // leaves a session cookie behind, and re-visiting the login page while
  // authenticated redirects straight to the dashboard instead of showing
  // the form, so a login that succeeds must be the last row in the sheet.
  loginSheet.addRows([
    { testCaseId: 'TC_LOGIN_01', username: 'Admin', password: 'wrong_password', expectedResult: 'invalid', run: 'Y' },
    { testCaseId: 'TC_LOGIN_02', username: 'invalid_user', password: 'admin123', expectedResult: 'invalid', run: 'Y' },
    { testCaseId: 'TC_LOGIN_03', username: 'Admin', password: 'admin123', expectedResult: 'success', run: 'Y' },
  ]);

  const claimSheet = workbook.addWorksheet('ClaimData');
  claimSheet.columns = [
    { header: 'testCaseId', key: 'testCaseId', width: 15 },
    { header: 'event', key: 'event', width: 22 },
    { header: 'currency', key: 'currency', width: 18 },
    { header: 'remarks', key: 'remarks', width: 30 },
    { header: 'expectedResult', key: 'expectedResult', width: 15 },
    { header: 'run', key: 'run', width: 8 },
  ];
  claimSheet.addRows([
    { testCaseId: 'TC_CLAIM_01', event: 'Travel Allowance', currency: 'Euro', remarks: '', expectedResult: 'success', run: 'Y' },
    { testCaseId: 'TC_CLAIM_02', event: 'Medical Reimbursement', currency: 'Australian Dollar', remarks: 'Reimbursement for medical consultation and medication', expectedResult: 'success', run: 'Y' },
    { testCaseId: 'TC_CLAIM_03', event: '', currency: '', remarks: '', expectedResult: 'validationError', run: 'Y' },
    { testCaseId: 'TC_CLAIM_04', event: 'Accommodation', currency: 'Euro', remarks: 'Hotel accommodation during business trip', expectedResult: 'success', run: 'Y' },
    { testCaseId: 'TC_CLAIM_05', event: 'Medical Reimbursement', currency: 'United States Dollar', remarks: 'Reimbursement for doctor visit and prescribed medication', expectedResult: 'success', run: 'Y' },
    { testCaseId: 'TC_CLAIM_06', event: 'Travel Allowance', currency: 'Euro', remarks: 'Airfare and local transport for client site visit', expectedResult: 'success', run: 'Y' },
  ]);

  const outputPath = path.resolve(__dirname, '../data/testdata.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  // eslint-disable-next-line no-console
  console.log(`Sample test data written to ${outputPath}`);
}

generateSampleData().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
