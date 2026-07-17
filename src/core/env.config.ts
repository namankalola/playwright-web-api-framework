import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env (falls back to .env.example values if a real .env isn't present)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Cross-app/infra settings only - one Playwright run configuration, one Jira
 * instance for the whole org. Anything specific to a single AUT (base URL,
 * credentials, test data file, API auth, Jira project key) lives in that
 * app's own `src/apps/<app>/app.config.ts` instead.
 */
class EnvConfig {
  readonly env: string = process.env.ENV || 'qa';

  readonly headless: boolean = (process.env.HEADLESS ?? 'true') === 'true';
  readonly browser: string = process.env.BROWSER || 'chromium';
  readonly defaultTimeout: number = Number(process.env.DEFAULT_TIMEOUT) || 30000;
  readonly navigationTimeout: number = Number(process.env.NAVIGATION_TIMEOUT) || 30000;
  readonly retries: number = Number(process.env.RETRIES) || 0;
  readonly workers: number = Number(process.env.WORKERS) || 4;

  readonly jiraUrl: string = process.env.JIRA_URL || '';
  readonly jiraEmail: string = process.env.JIRA_EMAIL || '';
  readonly jiraApiKey: string = process.env.JIRA_APIKEY || '';

  get isCI(): boolean {
    return Boolean(process.env.CI);
  }
}

export const envConfig = new EnvConfig();
