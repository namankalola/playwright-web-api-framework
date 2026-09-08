import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class RegisterPage extends BasePage {
  private readonly firstNameInput = this.page.locator('#firstname');
  private readonly lastNameInput = this.page.locator('#lastname');
  private readonly usernameInput = this.page.locator('#userName');
  private readonly passwordInput = this.page.locator('#password');
  private readonly registerButton = this.page.locator('#register');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/register');
  }

  async assertLoaded(): Promise<void> {
    await this.actions.assertUrlContains('register');
    await this.actions.assertVisible(this.firstNameInput, 'First Name field');
  }

  async register(firstName: string, lastName: string, username: string, password: string): Promise<void> {
    await this.actions.fill(this.firstNameInput, firstName, 'First Name');
    await this.actions.fill(this.lastNameInput, lastName, 'Last Name');
    await this.actions.fill(this.usernameInput, username, 'UserName');
    await this.actions.fill(this.passwordInput, password, 'Password');
    await this.actions.click(this.registerButton, 'Register button');
  }
}
