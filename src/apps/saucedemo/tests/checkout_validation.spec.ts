import { test, expect } from '../src/fixtures/pages.fixture';
// import { ExcelReader } from '../src/utils/excel.reader';
import { envConfig } from '../src/config/env.config';

test.describe('SCRUM-1 - Verify First Name is Mandatory', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.open();
      await loginPage.login(envConfig.defaultUsername, envConfig.defaultPassword);
    });

  test.skip('TC_001 - First Name is required on checkout', async ({ page }) => {
    await test.step('Login using valid credentials', async () => {
      await page.goto(envConfig.baseUrl);
      await page.getByPlaceholder('Username').fill(envConfig.defaultUsername);
      await page.getByPlaceholder('Password').fill(envConfig.defaultPassword);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/inventory.html');
    });

    await test.step('Add any product to cart', async () => {
      await page.getByRole('button', { name: 'Add to cart' }).first().click();
    });

    await test.step('Click Cart', async () => {
      await page.locator('[data-test="shopping-cart-link"]').click();
      await page.waitForURL('**/cart.html');
    });

    await test.step('Click Checkout', async () => {
      await page.getByRole('button', { name: 'Checkout' }).click();
      await page.waitForURL('**/checkout-step-one.html');
    });

    await test.step('Leave First Name empty, enter Last Name and Zip Code', async () => {
      await page.getByPlaceholder('Last Name').fill('Doe');
      await page.getByPlaceholder('Zip/Postal Code').fill('12345');
    });

    await test.step('Click Continue', async () => {
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Verify error message, page, and field validation', async () => {
      await expect(page.getByText('Error: First Name is required')).toBeVisible();
      await expect(page).toHaveURL(/checkout-step-one\.html/);
      await expect(page.getByPlaceholder('First Name')).toHaveClass(/error/);
    });
  });
});
