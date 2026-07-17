import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('input[name="username"]');
  private readonly passwordInput = this.page.locator('input[name="password"]');
  private readonly loginButton = this.page.locator('button[type="submit"]');
  private readonly errorMessage = this.page.locator('.oxd-alert-content-text');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/web/index.php/auth/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.actions.fill(this.usernameInput, username, 'username');
    await this.actions.fill(this.passwordInput, password, 'password');
    await this.actions.click(this.loginButton, 'Login button');
  }

  async getErrorMessage(): Promise<string> {
    return this.actions.getText(this.errorMessage, 'Login error message');
  }

  async assertErrorVisible(): Promise<void> {
    await this.actions.assertVisible(this.errorMessage, 'Login error message');
  }

  /**
   * Login is a client-side (SPA) route change, not a full navigation, so
   * `getCurrentUrl()` right after `login()` can race the URL update. Use
   * `assertUrlContains`, which polls/retries, instead of a one-shot read.
   */
  async assertLoginSuccessful(): Promise<void> {
    await this.actions.assertUrlContains('dashboard');
  }
}
