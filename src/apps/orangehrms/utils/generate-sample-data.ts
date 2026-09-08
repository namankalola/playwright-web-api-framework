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

  const dashboardLinksSheet = workbook.addWorksheet('DashboardLinksData');
  dashboardLinksSheet.columns = [
    { header: 'testCaseId', key: 'testCaseId', width: 18 },
    { header: 'linkName', key: 'linkName', width: 15 },
    { header: 'expectedUrlFragment', key: 'expectedUrlFragment', width: 40 },
    { header: 'run', key: 'run', width: 8 },
  ];
  // Every top-level sidebar module link on the Dashboard, and the landing-page
  // URL fragment it redirects to once clicked (verified live against
  // https://opensource-demo.orangehrmlive.com - "viewXModule" hrefs redirect
  // server-side to a default submodule page, e.g. Admin -> viewSystemUsers).
  dashboardLinksSheet.addRows([
    { testCaseId: 'TC_DASHBOARD_01', linkName: 'Admin', expectedUrlFragment: 'admin/viewSystemUsers', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_02', linkName: 'PIM', expectedUrlFragment: 'pim/viewEmployeeList', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_03', linkName: 'Leave', expectedUrlFragment: 'leave/viewLeaveList', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_04', linkName: 'Time', expectedUrlFragment: 'time/viewEmployeeTimesheet', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_05', linkName: 'Recruitment', expectedUrlFragment: 'recruitment/viewCandidates', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_06', linkName: 'My Info', expectedUrlFragment: 'pim/viewPersonalDetails', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_07', linkName: 'Performance', expectedUrlFragment: 'performance/searchEvaluatePerformanceReview', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_08', linkName: 'Dashboard', expectedUrlFragment: 'dashboard/index', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_09', linkName: 'Directory', expectedUrlFragment: 'directory/viewDirectory', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_10', linkName: 'Maintenance', expectedUrlFragment: 'maintenance/purgeEmployee', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_11', linkName: 'Claim', expectedUrlFragment: 'claim/viewAssignClaim', run: 'Y' },
    { testCaseId: 'TC_DASHBOARD_12', linkName: 'Buzz', expectedUrlFragment: 'buzz/viewBuzz', run: 'Y' },
  ]);

  const quickLaunchLinksSheet = workbook.addWorksheet('QuickLaunchLinksData');
  quickLaunchLinksSheet.columns = [
    { header: 'testCaseId', key: 'testCaseId', width: 18 },
    { header: 'linkName', key: 'linkName', width: 15 },
    { header: 'expectedUrlFragment', key: 'expectedUrlFragment', width: 40 },
    { header: 'run', key: 'run', width: 8 },
  ];
  // Every card in the Dashboard's Quick Launch widget, and the page URL fragment
  // it navigates to once clicked (verified live against
  // https://opensource-demo.orangehrmlive.com).
  quickLaunchLinksSheet.addRows([
    { testCaseId: 'TC_QUICKLAUNCH_01', linkName: 'Assign Leave', expectedUrlFragment: 'leave/assignLeave', run: 'Y' },
    { testCaseId: 'TC_QUICKLAUNCH_02', linkName: 'Leave List', expectedUrlFragment: 'leave/viewLeaveList', run: 'Y' },
    { testCaseId: 'TC_QUICKLAUNCH_03', linkName: 'Timesheets', expectedUrlFragment: 'time/viewEmployeeTimesheet', run: 'Y' },
    { testCaseId: 'TC_QUICKLAUNCH_04', linkName: 'Apply Leave', expectedUrlFragment: 'leave/applyLeave', run: 'Y' },
    { testCaseId: 'TC_QUICKLAUNCH_05', linkName: 'My Leave', expectedUrlFragment: 'leave/viewMyLeaveList', run: 'Y' },
    { testCaseId: 'TC_QUICKLAUNCH_06', linkName: 'My Timesheet', expectedUrlFragment: 'time/viewMyTimesheet', run: 'Y' },
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
