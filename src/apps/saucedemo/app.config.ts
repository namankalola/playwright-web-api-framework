import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env (shared across apps; each app reads only the vars it owns)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * SauceDemo-specific settings: base URL, credentials, test data location,
 * API auth, and Jira project key. Nothing outside `src/apps/saucedemo/`
 * should read these directly - a sibling app defines its own app.config.ts
 * with its own env var names, independent of this file.
 */
class SauceDemoConfig {
  readonly baseUrl: string = process.env.BASE_URL || 'https://www.saucedemo.com';
  readonly apiBaseUrl: string = process.env.API_BASE_URL || 'https://reqres.in';

  readonly defaultUsername: string = process.env.DEFAULT_USERNAME || 'standard_user';
  readonly defaultPassword: string = process.env.DEFAULT_PASSWORD || 'secret_sauce';

  readonly testDataFile: string = process.env.TEST_DATA_FILE || 'src/apps/saucedemo/data/testdata.xlsx';

  // API auth (used by TokenManager)
  readonly apiAuthEmail: string = process.env.API_AUTH_EMAIL || 'eve.holt@reqres.in';
  readonly apiAuthPassword: string = process.env.API_AUTH_PASSWORD || 'cityslicka';
  readonly apiRequestTimeout: number = Number(process.env.API_REQUEST_TIMEOUT) || 30000;
  // reqres.in (and most real APIs) require a static account-level key on every /api/* call,
  // separate from the per-session Bearer token TokenManager fetches via login.
  readonly apiKey: string = process.env.API_KEY || '';

  readonly jiraProjectKey: string = 'SCRUM';
}

export const saucedemoConfig = new SauceDemoConfig();
