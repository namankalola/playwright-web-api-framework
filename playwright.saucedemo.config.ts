import { createConfig } from './playwright.base.config';
import { saucedemoConfig } from './src/apps/saucedemo/app.config';

export default createConfig({
  appName: 'saucedemo',
  testDir: './src/apps/saucedemo/tests',
  baseURL: saucedemoConfig.baseUrl,
});
