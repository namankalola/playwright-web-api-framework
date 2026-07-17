import { createConfig } from './playwright.base.config';
import { orangehrmsConfig } from './src/apps/orangehrms/app.config';

export default createConfig({
  appName: 'orangehrms',
  testDir: './src/apps/orangehrms/tests',
  baseURL: orangehrmsConfig.baseUrl,
});
