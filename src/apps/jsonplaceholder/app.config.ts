import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env (shared across apps; each app reads only the vars it owns)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * JSONPlaceholder-specific settings: API base URL, request timeout and test
 * data location. Nothing outside `src/apps/jsonplaceholder/` should read
 * these directly. Env var names are prefixed `JSONPLACEHOLDER_` so they don't
 * collide with sibling apps' own vars in the shared `.env` file.
 *
 * API-only app: no UI, no credentials (the API is public, no key/auth), and
 * no Jira project - test cases are tracked in this app's TEST_CASES.md.
 */
class JsonPlaceholderConfig {
  readonly apiBaseUrl: string = process.env.JSONPLACEHOLDER_API_BASE_URL || 'https://jsonplaceholder.typicode.com';
  readonly apiRequestTimeout: number = Number(process.env.JSONPLACEHOLDER_API_REQUEST_TIMEOUT) || 30000;

  readonly testDataFile: string =
    process.env.JSONPLACEHOLDER_TEST_DATA_FILE || 'src/apps/jsonplaceholder/data/testdata.xlsx';
}

export const jsonplaceholderConfig = new JsonPlaceholderConfig();
