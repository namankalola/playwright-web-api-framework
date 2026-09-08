import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env (shared across apps; each app reads only the vars it owns)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Bookstore-specific settings: base URL, credentials, test data location,
 * and Jira project key. Nothing outside `src/apps/bookstore/` should read
 * these directly. Env var names are prefixed `BOOKSTORE_` so they don't
 * collide with sibling apps' own vars in the shared `.env` file.
 */
class BookstoreConfig {
  readonly baseUrl: string = process.env.BOOKSTORE_BASE_URL || 'https://demoqa.com';

  readonly defaultUsername: string = process.env.BOOKSTORE_USERNAME || '';
  readonly defaultPassword: string = process.env.BOOKSTORE_PASSWORD || '';

  readonly testDataFile: string = process.env.BOOKSTORE_TEST_DATA_FILE || 'src/apps/bookstore/data/testdata.xlsx';

  readonly jiraProjectKey: string = 'ARISE';
}

export const bookstoreConfig = new BookstoreConfig();
