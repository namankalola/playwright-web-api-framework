import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('#userName');
  private readonly passwordInput = this.page.locator('#password');
  private readonly loginButton = this.page.locator('#login');
  private readonly newUserButton = this.page.locator('#newUser');
  private readonly errorMessage = this.page.locator('#name');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/login');
  }

  async assertLoaded(): Promise<void> {
    await this.actions.assertUrlContains('login');
    await this.actions.assertVisible(this.usernameInput, 'Username field');
  }

  async login(username: string, password: string): Promise<void> {
    await this.actions.fill(this.usernameInput, username, 'username');
    await this.actions.fill(this.passwordInput, password, 'password');
    await this.actions.click(this.loginButton, 'Login button');
  }

  async goToRegister(): Promise<void> {
    await this.actions.click(this.newUserButton, 'New User button');
  }

  async getErrorMessage(): Promise<string> {
    return this.actions.getText(this.errorMessage, 'Login error message');
  }

  async assertErrorVisible(): Promise<void> {
    await this.actions.assertVisible(this.errorMessage, 'Login error message');
  }

  async assertLoginSuccessful(): Promise<void> {
    await this.actions.assertUrlContains('profile');
  }

  /**
   * demoqa.com's post-login redirect to /profile is unreliable under Playwright
   * automation - verified live, it fails consistently (5/5 across repeated runs,
   * even with full-page-reload retries) once trace/video recording is active,
   * apparently due to a client-side reCAPTCHA script error racing the app's own
   * redirect logic. The underlying `POST /Account/v1/Login` call itself is
   * reliable every time (200, valid token, matching userId), so this captures
   * that response directly instead of depending on the broken client-side
   * redirect - still driven by a real UI login, just verified at the network
   * layer rather than by UI state.
   */
  async loginAndCaptureResponse(username: string, password: string): Promise<{ status: number; body: unknown }> {
    await this.actions.fill(this.usernameInput, username, 'username');
    await this.actions.fill(this.passwordInput, password, 'password');
    return this.actions.clickAndCaptureResponse(this.loginButton, /\/Account\/v1\/Login/, 'Login button');
  }
}
