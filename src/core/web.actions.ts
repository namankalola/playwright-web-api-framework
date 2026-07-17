import { Locator, Page, expect } from '@playwright/test';
import { Logger } from './logger';
import { envConfig } from './env.config';

/**
 * WebActions is the single place that talks to raw Playwright APIs.
 *
 * Design rules enforced by this framework:
 *  - Page Objects NEVER call `page.click()` / `page.fill()` etc. directly.
 *    They call `this.actions.click(locator, name)` instead.
 *  - Test files NEVER see a Locator or a Page. They only call business
 *    methods exposed by Page Objects (e.g. `loginPage.login(user, pass)`).
 *  - Every action here is logged, timed, wrapped in try/catch with a
 *    descriptive error, and given a consistent explicit wait strategy -
 *    so Page Objects and tests stay free of boilerplate and flake-prone
 *    hard-coded waits.
 */
export class WebActions {
  constructor(private readonly page: Page) {}

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------
  async goto(urlOrPath: string): Promise<void> {
    await this.safeExec(`Navigate to ${urlOrPath}`, async () => {
      await this.page.goto(urlOrPath, { waitUntil: 'domcontentloaded', timeout: envConfig.navigationTimeout });
    });
  }

  async reload(): Promise<void> {
    await this.safeExec('Reload current page', async () => {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    });
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.safeExec('Get page title', async () => this.page.title());
  }

  // ---------------------------------------------------------------------
  // Element interactions
  // ---------------------------------------------------------------------
  async click(locator: Locator, name = 'element'): Promise<void> {
    await this.safeExec(`Click on ${name}`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      await locator.click();
    });
  }

  async doubleClick(locator: Locator, name = 'element'): Promise<void> {
    await this.safeExec(`Double click on ${name}`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      await locator.dblclick();
    });
  }

  async fill(locator: Locator, value: string, name = 'field'): Promise<void> {
    await this.safeExec(`Fill "${name}" with "${this.mask(name, value)}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      await locator.fill(value);
    });
  }

  async type(locator: Locator, value: string, name = 'field', delayMs = 50): Promise<void> {
    await this.safeExec(`Type into "${name}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      await locator.pressSequentially(value, { delay: delayMs });
    });
  }

  async selectOption(locator: Locator, value: string, name = 'dropdown'): Promise<void> {
    await this.safeExec(`Select "${value}" in "${name}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      await locator.selectOption(value);
    });
  }

  async check(locator: Locator, name = 'checkbox'): Promise<void> {
    await this.safeExec(`Check "${name}"`, async () => {
      await locator.check();
    });
  }

  async uncheck(locator: Locator, name = 'checkbox'): Promise<void> {
    await this.safeExec(`Uncheck "${name}"`, async () => {
      await locator.uncheck();
    });
  }

  async hover(locator: Locator, name = 'element'): Promise<void> {
    await this.safeExec(`Hover over "${name}"`, async () => {
      await locator.hover();
    });
  }

  async uploadFile(locator: Locator, filePath: string, name = 'file input'): Promise<void> {
    await this.safeExec(`Upload file to "${name}"`, async () => {
      await locator.setInputFiles(filePath);
    });
  }

  async pressKey(key: string): Promise<void> {
    await this.safeExec(`Press key "${key}"`, async () => {
      await this.page.keyboard.press(key);
    });
  }

  // ---------------------------------------------------------------------
  // Reads / queries (no assertions here - pure retrieval)
  // ---------------------------------------------------------------------
  async getText(locator: Locator, name = 'element'): Promise<string> {
    return this.safeExec(`Get text of "${name}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      return (await locator.textContent())?.trim() ?? '';
    });
  }

  async getAllTexts(locator: Locator, name = 'element list'): Promise<string[]> {
    return this.safeExec(`Get all texts of "${name}"`, async () => {
      const items = await locator.allTextContents();
      return items.map((t) => t.trim());
    });
  }

  async getAttribute(locator: Locator, attribute: string, name = 'element'): Promise<string | null> {
    return this.safeExec(`Get attribute "${attribute}" of "${name}"`, async () => locator.getAttribute(attribute));
  }

  /** Reads an input/textarea's live DOM value - unlike getAttribute, this reflects framework-set values that never get mirrored back onto the HTML attribute (e.g. disabled fields populated via a JS framework). */
  async getValue(locator: Locator, name = 'field'): Promise<string> {
    return this.safeExec(`Get value of "${name}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: envConfig.defaultTimeout });
      return locator.inputValue();
    });
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  async count(locator: Locator): Promise<number> {
    return locator.count();
  }

  // ---------------------------------------------------------------------
  // Waits
  // ---------------------------------------------------------------------
  async waitForVisible(locator: Locator, name = 'element', timeout = envConfig.defaultTimeout): Promise<void> {
    await this.safeExec(`Wait for "${name}" to be visible`, async () => {
      await locator.waitFor({ state: 'visible', timeout });
    });
  }

  async waitForHidden(locator: Locator, name = 'element', timeout = envConfig.defaultTimeout): Promise<void> {
    await this.safeExec(`Wait for "${name}" to be hidden`, async () => {
      await locator.waitFor({ state: 'hidden', timeout });
    });
  }

  /** Waits for presence in the DOM regardless of visibility - for elements a responsive layout renders but keeps visually collapsed (e.g. a filter panel hidden behind a toggle on narrow viewports), where waiting on 'visible' would never resolve until after the toggle is clicked. */
  async waitForAttached(locator: Locator, name = 'element', timeout = envConfig.defaultTimeout): Promise<void> {
    await this.safeExec(`Wait for "${name}" to be attached`, async () => {
      await locator.waitFor({ state: 'attached', timeout });
    });
  }

  async waitForLoadState(): Promise<void> {
    await this.safeExec('Wait for network idle', async () => {
      await this.page.waitForLoadState('networkidle');
    });
  }

  // ---------------------------------------------------------------------
  // Assertions (thin wrappers over Playwright's web-first assertions)
  // ---------------------------------------------------------------------
  async assertVisible(locator: Locator, name = 'element'): Promise<void> {
    await this.safeExec(`Assert "${name}" is visible`, async () => {
      await expect(locator, `${name} should be visible`).toBeVisible();
    });
  }

  async assertText(locator: Locator, expected: string, name = 'element'): Promise<void> {
    await this.safeExec(`Assert "${name}" text equals "${expected}"`, async () => {
      await expect(locator, `${name} text mismatch`).toHaveText(expected);
    });
  }

  async assertContainsText(locator: Locator, expected: string, name = 'element'): Promise<void> {
    await this.safeExec(`Assert "${name}" contains "${expected}"`, async () => {
      await expect(locator, `${name} should contain text`).toContainText(expected);
    });
  }

  async assertUrlContains(fragment: string): Promise<void> {
    await this.safeExec(`Assert URL contains "${fragment}"`, async () => {
      await expect(this.page, `URL should contain ${fragment}`).toHaveURL(new RegExp(fragment));
    });
  }

  /** Polls until the field's live value is non-empty - needed after an SPA route change where the element renders before its data finishes loading. */
  async assertValueNotEmpty(locator: Locator, name = 'field'): Promise<void> {
    await this.safeExec(`Assert "${name}" value is not empty`, async () => {
      await expect(locator, `${name} should have a non-empty value`).not.toHaveValue('', {
        timeout: envConfig.defaultTimeout,
      });
    });
  }

  async assertCount(locator: Locator, expected: number, name = 'element list'): Promise<void> {
    await this.safeExec(`Assert "${name}" count equals ${expected}`, async () => {
      await expect(locator, `${name} count mismatch`).toHaveCount(expected);
    });
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  /** Wraps every action with consistent logging + error context. Central place to add retry/tracing later. */
  private async safeExec<T>(stepName: string, fn: () => Promise<T>): Promise<T> {
    Logger.step(stepName);
    try {
      return await fn();
    } catch (error) {
      Logger.error(`Failed: ${stepName}`, error instanceof Error ? error.message : error);
      throw new Error(`[WebActions] ${stepName} failed -> ${(error as Error).message}`);
    }
  }

  /** Avoids ever printing password/secret field values into logs or CI output. */
  private mask(fieldName: string, value: string): string {
    const sensitive = ['password', 'pwd', 'secret', 'token', 'otp', 'pin'];
    return sensitive.some((s) => fieldName.toLowerCase().includes(s)) ? '*'.repeat(value.length) : value;
  }
}
