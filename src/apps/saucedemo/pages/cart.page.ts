import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class CartPage extends BasePage {
  private readonly cartItems = this.page.locator('.cart_item');
  private readonly cartItemNames = this.page.locator('.cart_item .inventory_item_name');
  private readonly removeButtons = this.page.locator('.cart_item button', { hasText: 'Remove' });

  constructor(page: Page) {
    super(page);
  }

  async getCartItemNames(): Promise<string[]> {
    return this.actions.getAllTexts(this.cartItemNames, 'Cart item names');
  }

  async getCartItemCount(): Promise<number> {
    return this.actions.count(this.cartItems);
  }

  async getRemoveButtonCount(): Promise<number> {
    return this.actions.count(this.removeButtons);
  }
}
