import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env (falls back to .env.example values if a real .env isn't present)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class EnvConfig {
  readonly env: string = process.env.ENV || 'qa';
  readonly baseUrl: string = process.env.BASE_URL || 'https://www.saucedemo.com';
  readonly apiBaseUrl: string = process.env.API_BASE_URL || 'https://reqres.in';

  readonly defaultUsername: string = process.env.DEFAULT_USERNAME || 'standard_user';
  readonly defaultPassword: string = process.env.DEFAULT_PASSWORD || 'secret_sauce';

  readonly headless: boolean = (process.env.HEADLESS ?? 'true') === 'true';
  readonly browser: string = process.env.BROWSER || 'chromium';
  readonly defaultTimeout: number = Number(process.env.DEFAULT_TIMEOUT) || 30000;
  readonly navigationTimeout: number = Number(process.env.NAVIGATION_TIMEOUT) || 30000;
  readonly retries: number = Number(process.env.RETRIES) || 0;
  readonly workers: number = Number(process.env.WORKERS) || 4;

  readonly testDataFile: string = process.env.TEST_DATA_FILE || 'src/data/testdata.xlsx';

  // API auth (used by TokenManager)
  readonly apiAuthEmail: string = process.env.API_AUTH_EMAIL || 'eve.holt@reqres.in';
  readonly apiAuthPassword: string = process.env.API_AUTH_PASSWORD || 'cityslicka';
  readonly apiRequestTimeout: number = Number(process.env.API_REQUEST_TIMEOUT) || 30000;
  // reqres.in (and most real APIs) require a static account-level key on every /api/* call,
  // separate from the per-session Bearer token TokenManager fetches via login.
  readonly apiKey: string = process.env.API_KEY || '';

  get isCI(): boolean {
    return Boolean(process.env.CI);
  }
}

export const envConfig = new EnvConfig();
