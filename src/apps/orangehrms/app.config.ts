import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env (shared across apps; each app reads only the vars it owns)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * OrangeHRMS-specific settings: base URL, credentials, test data location,
 * and Jira project key. Nothing outside `src/apps/orangehrms/` should read
 * these directly. Env var names are prefixed `ORANGEHRMS_` so they don't
 * collide with sibling apps' own vars in the shared `.env` file.
 */
class OrangeHrmsConfig {
  readonly baseUrl: string = process.env.ORANGEHRMS_BASE_URL || 'https://opensource-demo.orangehrmlive.com';

  readonly defaultUsername: string = process.env.ORANGEHRMS_USERNAME || 'Admin';
  readonly defaultPassword: string = process.env.ORANGEHRMS_PASSWORD || 'admin123';

  readonly testDataFile: string = process.env.ORANGEHRMS_TEST_DATA_FILE || 'src/apps/orangehrms/data/testdata.xlsx';

  readonly jiraProjectKey: string = 'HRMS';
}

export const orangehrmsConfig = new OrangeHrmsConfig();
