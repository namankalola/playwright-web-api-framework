import { createConfig } from './playwright.base.config';
import { bookstoreConfig } from './src/apps/bookstore/app.config';

export default createConfig({
  appName: 'bookstore',
  testDir: './src/apps/bookstore/tests',
  baseURL: bookstoreConfig.baseUrl,
});
