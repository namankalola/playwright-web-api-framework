import { createConfig } from './playwright.base.config';
import { jsonplaceholderConfig } from './src/apps/jsonplaceholder/app.config';

// API-only app: a single browserless project, so each test runs once instead
// of once per browser in the default matrix.
export default createConfig({
  appName: 'jsonplaceholder',
  testDir: './src/apps/jsonplaceholder/tests',
  baseURL: jsonplaceholderConfig.apiBaseUrl,
  projects: [{ name: 'api' }],
});
