import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('#user-name');
  private readonly passwordInput = this.page.locator('#password');
  private readonly loginButton = this.page.locator('#login-button');
  private readonly errorMessage = this.page.locator('[data-test="error"]');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/');
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
}
