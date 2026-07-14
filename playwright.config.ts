import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './src/config/env.config';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 60000 },
  fullyParallel: true,
  forbidOnly: envConfig.isCI,
  retries: envConfig.isCI ? 2 : envConfig.retries,
  workers: envConfig.isCI ? 4 : envConfig.workers,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }],
  ],

  use: {
    baseURL: envConfig.baseUrl,
    headless: envConfig.headless,
    actionTimeout: envConfig.defaultTimeout,
    navigationTimeout: envConfig.navigationTimeout,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],

  outputDir: 'reports/test-results',
});
