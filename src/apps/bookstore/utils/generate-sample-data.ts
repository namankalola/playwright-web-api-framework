import ExcelJS from 'exceljs';
import * as path from 'path';

/**
 * One-time/CI-time generator for sample test data.
 * Run with: npm run generate:testdata:bookstore
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
  // Only the invalid-credentials case is seeded for now (verified live against
  // https://demoqa.com/login - error text "Invalid username or password!").
  // TC_LOGIN_01 uses the exact credentials specified by ARISE-1 (username=anyuser,
  // password=Password) - any non-existent account produces the same generic error.
  // A success-case row needs a real registered demoqa.com account; add one via
  // BOOKSTORE_USERNAME/BOOKSTORE_PASSWORD in .env plus a corresponding row here
  // once that account exists, rather than inventing credentials.
  loginSheet.addRows([
    { testCaseId: 'TC_LOGIN_01', username: 'anyuser', password: 'Password', expectedResult: 'invalid', run: 'Y' },
  ]);

  const registerSheet = workbook.addWorksheet('RegisterData');
  registerSheet.columns = [
    { header: 'testCaseId', key: 'testCaseId', width: 15 },
    { header: 'firstName', key: 'firstName', width: 15 },
    { header: 'lastName', key: 'lastName', width: 15 },
    { header: 'usernamePrefix', key: 'usernamePrefix', width: 20 },
    { header: 'password', key: 'password', width: 20 },
    { header: 'run', key: 'run', width: 8 },
  ];
  // demoqa.com/register requires a never-before-used username per successful
  // registration (a duplicate returns "User exists!" instead of creating an
  // account), so the spec appends a runtime-unique suffix to `usernamePrefix`
  // rather than using a fixed username. `password` must satisfy the field's
  // pattern (lower + upper + digit + special char, 8+ length) - verified live.
  registerSheet.addRows([
    { testCaseId: 'TC_REGISTER_01', firstName: 'Test', lastName: 'User', usernamePrefix: 'arise2user', password: 'Password@123', run: 'Y' },
  ]);

  const bookDetailSheet = workbook.addWorksheet('BookDetailData');
  bookDetailSheet.columns = [
    { header: 'testCaseId', key: 'testCaseId', width: 15 },
    { header: 'bookTitle', key: 'bookTitle', width: 40 },
    { header: 'run', key: 'run', width: 8 },
  ];
  // Must be a title that exists on the unfiltered /books listing - verified live.
  bookDetailSheet.addRows([
    { testCaseId: 'TC_BOOKDETAIL_01', bookTitle: 'Learning JavaScript Design Patterns', run: 'Y' },
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
