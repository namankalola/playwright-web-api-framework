import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class CheckoutPage extends BasePage {
  private readonly checkoutButton = this.page.locator('#checkout');
  private readonly firstNameInput = this.page.locator('#first-name');
  private readonly lastNameInput = this.page.locator('#last-name');
  private readonly postalCodeInput = this.page.locator('#postal-code');
  private readonly continueButton = this.page.locator('#continue');
  private readonly finishButton = this.page.locator('#finish');
  private readonly completeHeader = this.page.locator('.complete-header');
  private readonly backToHomeButton = this.page.locator('#back-to-products');
  private readonly errorMessage = this.page.locator('[data-test="error"]');

  constructor(page: Page) {
    super(page);
  }

  async startCheckout(): Promise<void> {
    await this.actions.click(this.checkoutButton, 'Checkout button');
  }

  async fillFirstName(firstName: string): Promise<void> {
    await this.actions.fill(this.firstNameInput, firstName, 'First name');
  }

  async fillLastName(lastName: string): Promise<void> {
    await this.actions.fill(this.lastNameInput, lastName, 'Last name');
  }

  async fillPostalCode(postalCode: string): Promise<void> {
    await this.actions.fill(this.postalCodeInput, postalCode, 'Postal code');
  }

  async clickContinue(): Promise<void> {
    await this.actions.click(this.continueButton, 'Continue button');
  }

  async fillShippingInfo(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.fillPostalCode(postalCode);
    await this.clickContinue();
  }

  async finishOrder(): Promise<void> {
    await this.actions.click(this.finishButton, 'Finish button');
  }

  async getConfirmationMessage(): Promise<string> {
    return this.actions.getText(this.completeHeader, 'Order confirmation header');
  }
  async goBackToHome(): Promise<void> {
    await this.actions.click(this.backToHomeButton, 'Back to Home button');
  }

  async getShippingErrorMessage(): Promise<string> {
    return this.actions.getText(this.errorMessage, 'Checkout shipping error message');
  }

  async assertShippingErrorVisible(): Promise<void> {
    await this.actions.assertVisible(this.errorMessage, 'Checkout shipping error message');
  }

  async isFirstNameFieldInvalid(): Promise<boolean> {
    return this.isFieldInvalid(this.firstNameInput, 'First name field');
  }

  async isLastNameFieldInvalid(): Promise<boolean> {
    return this.isFieldInvalid(this.lastNameInput, 'Last name field');
  }

  async isPostalCodeFieldInvalid(): Promise<boolean> {
    return this.isFieldInvalid(this.postalCodeInput, 'Postal code field');
  }

  private async isFieldInvalid(field: Locator, name: string): Promise<boolean> {
    const classAttr = await this.actions.getAttribute(field, 'class', name);
    return (classAttr ?? '').includes('error');
  }

  async assertOnCheckoutStepOnePage(): Promise<void> {
    await this.actions.assertUrlContains('checkout-step-one');
  }

  async completeCheckout(firstName: string, lastName: string, postalCode: string): Promise<string> {
    await this.startCheckout();
    await this.fillShippingInfo(firstName, lastName, postalCode);
    await this.finishOrder();
    return this.getConfirmationMessage();
  }
}
