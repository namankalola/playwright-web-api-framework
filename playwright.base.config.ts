import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import { envConfig } from './src/core/env.config';

interface AppConfigOptions {
  appName: string;
  testDir: string;
  baseURL: string;
  /**
   * Optional override of the default browser matrix. API-only apps pass a
   * single browserless project so each test runs once instead of once per browser.
   */
  projects?: PlaywrightTestConfig['projects'];
}

/**
 * Shared Playwright config, factored out so every app gets identical
 * run/report/browser behavior without copy-pasting it into each
 * `playwright.<app>.config.ts`. Only `testDir`/`baseURL`/report output paths
 * vary per app - everything else here is app-agnostic infra.
 */
export function createConfig({ appName, testDir, baseURL, projects }: AppConfigOptions): PlaywrightTestConfig {
  return defineConfig({
    testDir,
    timeout: 60000,
    expect: { timeout: 60000 },
    fullyParallel: true,
    forbidOnly: envConfig.isCI,
    retries: envConfig.isCI ? 2 : envConfig.retries,
    workers: envConfig.isCI ? 4 : envConfig.workers,

    reporter: [
      ['list'],
      ['html', { outputFolder: `reports/${appName}/html-report`, open: 'never' }],
      ['junit', { outputFile: `reports/${appName}/junit-results.xml` }],
      ['allure-playwright', {
        detail: true, suiteTitle: false, outputFolder: `reports/${appName}/allure-results`, environmentInfo: {
          'Release': 'Test Execution Report - Release2026'
        },
      }],
    ],

    use: {
      baseURL,
      headless: envConfig.headless,
      actionTimeout: envConfig.defaultTimeout,
      navigationTimeout: envConfig.navigationTimeout,
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },

    projects: projects ?? [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    ],

    outputDir: `reports/${appName}/test-results`,
  });
}
