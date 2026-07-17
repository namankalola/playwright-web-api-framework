import { test, expect } from '../../src/fixtures/e2e.fixture';
import { ExcelReader } from '../../src/utils/excel.reader';
import { envConfig } from '../../src/config/env.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(envConfig.testDataFile);
});

test.afterAll(async () => {
  await ExcelReader.clearWorkbook();
});

/**
 * Hybrid UI+API sample: completes checkout through the SauceDemo UI, then
 * uses the API service (same worker, same `test`) to persist and verify a
 * matching customer record - demonstrating `e2e.fixture.ts` giving one test
 * both page objects and API services without either side reaching into the
 * other's layer.
 */
test.describe('@e2e @regression Checkout flow with API-side customer record verification', () => {
  test('@smoke completes checkout via UI and creates the matching customer record via API', async ({
    loginPage,
    inventoryPage,
    checkoutPage,
    userApiService,
  }) => {
    const customer = await ExcelReader.getTestDataRow(envConfig.testDataFile, 'CheckoutData', 'TC_CHECKOUT_01');
    const fullName = `${customer.get('firstName') ?? ''} ${customer.get('lastName') ?? ''}`;

    await test.step('Login to Swag Labs', async () => {
      await loginPage.open();
      await loginPage.login(envConfig.defaultUsername, envConfig.defaultPassword);
    });

    await test.step('Add product to cart', async () => {
      await inventoryPage.addProductToCart(customer.get('product') ?? '');
      expect(await inventoryPage.getCartItemCount()).toBe(1);
    });

    let confirmation = '';
    await test.step('Go to cart and complete checkout with Excel-driven customer details', async () => {
      await inventoryPage.goToCart();
      confirmation = await checkoutPage.completeCheckout(
        customer.get('firstName') ?? '',
        customer.get('lastName') ?? '',
        customer.get('postalCode') ?? '',
      );
    });

    await test.step('Verify order confirmation shown in the UI', async () => {
      expect(confirmation).toContain('Thank you for your order');
    });

    await test.step('Create the matching customer record via API and verify it was persisted', async () => {
      const { result, created } = await userApiService.createUser({
        name: fullName,
        job: customer.get('apiJobTitle') ?? '',
      });

      expect(result.status).toBe(201);
      expect(created?.name).toBe(fullName);
      expect(created?.id).toBeTruthy();
    });
  });
});
