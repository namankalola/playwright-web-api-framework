import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class ClaimPage extends BasePage {
  private readonly eventDropdownToggle = this.page.locator('.oxd-select-text').nth(0);
  private readonly currencyDropdownToggle = this.page.locator('.oxd-select-text').nth(1);
  private readonly remarksInput = this.page.locator('textarea');
  private readonly createButton = this.page.getByRole('button', { name: 'Create' });
  private readonly validationMessages = this.page.locator('.oxd-input-group__message');

  private readonly referenceIdField = this.page
    .locator('.oxd-input-group', { hasText: 'Reference Id' })
    .locator('input');
  private readonly statusField = this.page.locator('.oxd-input-group', { hasText: 'Status' }).locator('input');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/web/index.php/claim/submitClaim');
  }

  private dropdownOption(text: string) {
    return this.page.locator('.oxd-select-option').filter({ hasText: new RegExp(`^${text}$`) });
  }

  async selectEvent(event: string): Promise<void> {
    await this.actions.click(this.eventDropdownToggle, 'Event dropdown');
    await this.actions.click(this.dropdownOption(event), `Event option "${event}"`);
  }

  async selectCurrency(currency: string): Promise<void> {
    await this.actions.click(this.currencyDropdownToggle, 'Currency dropdown');
    await this.actions.click(this.dropdownOption(currency), `Currency option "${currency}"`);
  }

  async fillRemarks(remarks: string): Promise<void> {
    await this.actions.fill(this.remarksInput, remarks, 'Remarks');
  }

  async clickCreate(): Promise<void> {
    await this.actions.click(this.createButton, 'Create button');
  }

  /**
   * Fills only the fields it is given a non-empty value for, so the same
   * method drives both the mandatory-fields-only scenario and (via blank
   * strings) missing-field negative scenarios.
   */
  async createClaim(event: string, currency: string, remarks = ''): Promise<void> {
    if (event) {
      await this.selectEvent(event);
    }
    if (currency) {
      await this.selectCurrency(currency);
    }
    if (remarks) {
      await this.fillRemarks(remarks);
    }
    await this.clickCreate();
  }

  async getValidationMessages(): Promise<string[]> {
    return this.actions.getAllTexts(this.validationMessages, 'Create Claim validation messages');
  }

  async getReferenceId(): Promise<string> {
    return this.actions.getValue(this.referenceIdField, 'Reference Id field');
  }

  async getStatus(): Promise<string> {
    return this.actions.getValue(this.statusField, 'Claim status field');
  }

  async assertClaimCreatedSuccessfully(): Promise<void> {
    await this.actions.assertUrlContains('submitClaim/id/');
    await this.actions.assertValueNotEmpty(this.statusField, 'Claim status field');
  }
}
