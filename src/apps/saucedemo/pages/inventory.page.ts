import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class InventoryPage extends BasePage {
  private readonly pageTitleLabel = this.page.locator('.title');
  private readonly cartBadge = this.page.locator('.shopping_cart_badge');
  private readonly cartLink = this.page.locator('.shopping_cart_link');
  private readonly sortDropdown = this.page.locator('[data-test="product-sort-container"]');
  private readonly inventoryItemNames = this.page.locator('.inventory_item_name');
  private readonly inventoryItemPrices = this.page.locator('.inventory_item_price');
  private readonly addToCartButtons = this.page.locator('.inventory_item button', { hasText: 'Add to cart' });

  constructor(page: Page) {
    super(page);
  }

  private addToCartButton(productName: string) {
    return this.page.locator('.inventory_item', { hasText: productName }).locator('button', { hasText: 'Add to cart' });
  }

  async assertLoaded(): Promise<void> {
    await this.actions.assertVisible(this.pageTitleLabel, 'Inventory page title');
  }

  async addProductToCart(productName: string): Promise<void> {
    await this.actions.click(this.addToCartButton(productName), `Add "${productName}" to cart`);
  }

  async getCartItemCount(): Promise<number> {
    const visible = await this.actions.isVisible(this.cartBadge);
    if (!visible) return 0;
    const text = await this.actions.getText(this.cartBadge, 'Cart badge');
    return Number(text) || 0;
  }

  async goToCart(): Promise<void> {
    await this.actions.click(this.cartLink, 'Cart icon');
  }

  async sortProductsBy(option: string): Promise<void> {
    await this.actions.selectOption(this.sortDropdown, option, 'Sort dropdown');
  }

  async getProductNames(): Promise<string[]> {
    return this.actions.getAllTexts(this.inventoryItemNames, 'Product names');
  }

  async getProductPrices(): Promise<number[]> {
    const texts = await this.actions.getAllTexts(this.inventoryItemPrices, 'Product prices');
    return texts.map((text) => Number(text.replace('$', '')));
  }

  async addAllProductsToCart(): Promise<void> {
    const count = await this.actions.count(this.addToCartButtons);
    for (let i = 0; i < count; i++) {
      await this.actions.click(this.addToCartButtons.first(), 'Add to cart (all products)');
    }
  }
}
