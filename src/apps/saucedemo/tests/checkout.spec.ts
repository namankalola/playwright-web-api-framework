import { test, expect } from '../fixtures/pages.fixture';
import { ExcelReader } from '../../../core/excel.reader';
import { saucedemoConfig } from '../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(saucedemoConfig.testDataFile);

});

test.afterAll(async () => {
  await ExcelReader.clearWorkbook();
});

test.describe('SCRUM-1 / SCRUM-2 / SCRUM-5 / SCRUM-6 - Checkout mandatory field validation', () => {
  const scenarios: Array<{ jira: string; testCaseId: string; title: string }> = [
    { jira: 'SCRUM-1', testCaseId: 'TC_CHECKOUT_03', title: 'First Name is required on checkout' },
    { jira: 'SCRUM-2', testCaseId: 'TC_CHECKOUT_04', title: 'Last Name is required on checkout' },
    { jira: 'SCRUM-5', testCaseId: 'TC_CHECKOUT_05', title: 'Postal Code is required on checkout' },
  ];

  for (const scenario of scenarios) {
    test(`${scenario.jira} / ${scenario.testCaseId} - ${scenario.title}`, async ({
      loginPage,
      inventoryPage,
      checkoutPage,
    }) => {
      const row = await ExcelReader.getTestDataRow(saucedemoConfig.testDataFile, 'CheckoutData', scenario.testCaseId);

      await test.step('Login using valid credentials', async () => {
        await loginPage.open();
        await loginPage.login(saucedemoConfig.defaultUsername, saucedemoConfig.defaultPassword);
      });

      await test.step('Add any product to cart', async () => {
        await inventoryPage.addProductToCart(row.get('product') ?? '');
      });

      await test.step('Click Cart', async () => {
        await inventoryPage.goToCart();
      });

      await test.step('Click Checkout', async () => {
        await checkoutPage.startCheckout();
      });

      await test.step('Enter shipping fields per scenario, then Continue', async () => {
        await checkoutPage.fillShippingInfo(row.get('firstName') ?? '', row.get('lastName') ?? '', row.get('postalCode') ?? '');
      });

      await test.step('Verify error message displayed, page unchanged, and the empty field flagged invalid', async () => {
        await checkoutPage.assertShippingErrorVisible();
        expect(await checkoutPage.getShippingErrorMessage()).toContain(row.get('expectedMessage') ?? '');
        await checkoutPage.assertOnCheckoutStepOnePage();

        switch (row.get('expectedResult')) {
          case 'missingFirstName':
            expect(await checkoutPage.isFirstNameFieldInvalid()).toBe(true);
            break;
          case 'missingLastName':
            expect(await checkoutPage.isLastNameFieldInvalid()).toBe(true);
            break;
          case 'missingPostalCode':
            expect(await checkoutPage.isPostalCodeFieldInvalid()).toBe(true);
            break;
        }
      });
    });
  }

  test('SCRUM-6 / TC_CHECKOUT_06 - Sequential validation across all mandatory fields', async ({
    loginPage,
    inventoryPage,
    checkoutPage,
  }) => {
    const row = await ExcelReader.getTestDataRow(saucedemoConfig.testDataFile, 'CheckoutData', 'TC_CHECKOUT_06');

    await test.step('Login using valid credentials', async () => {
      await loginPage.open();
      await loginPage.login(saucedemoConfig.defaultUsername, saucedemoConfig.defaultPassword);
    });

    await test.step('Add any product to cart', async () => {
      await inventoryPage.addProductToCart(row.get('product') ?? '');
    });

    await test.step('Click Cart', async () => {
      await inventoryPage.goToCart();
    });

    await test.step('Click Checkout', async () => {
      await checkoutPage.startCheckout();
    });

    await test.step('Leave everything blank, click Continue, expect First Name required', async () => {
      await checkoutPage.clickContinue();
      expect(await checkoutPage.getShippingErrorMessage()).toContain(row.get('stepOneMessage') ?? '');
    });

    await test.step('Enter First Name, click Continue, expect Last Name required', async () => {
      await checkoutPage.fillFirstName(row.get('firstName') ?? '');
      await checkoutPage.clickContinue();
      expect(await checkoutPage.getShippingErrorMessage()).toContain(row.get('stepTwoMessage') ?? '');
    });

    await test.step('Enter Last Name, click Continue, expect Postal Code required', async () => {
      await checkoutPage.fillLastName(row.get('lastName') ?? '');
      await checkoutPage.clickContinue();
      expect(await checkoutPage.getShippingErrorMessage()).toContain(row.get('stepThreeMessage') ?? '');
    });
  });
});

test.describe('@regression SCRUM-8 Add all products to cart and checkout', () => {
  test.beforeEach(async ({ loginPage }) => {
    await test.step('Login to Swag Labs', async () => {
      await loginPage.open();
      await loginPage.login(saucedemoConfig.defaultUsername, saucedemoConfig.defaultPassword);
    });
  });

  test('@smoke adds all products to cart and completes checkout', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    const customer = await ExcelReader.getTestDataRow(saucedemoConfig.testDataFile, 'CheckoutData', 'TC_CHECKOUT_01');

    let productNames: string[] = [];
    await test.step('Click on Add to cart for all products', async () => {
      productNames = await inventoryPage.getProductNames();
      await inventoryPage.addAllProductsToCart();
      expect(await inventoryPage.getCartItemCount()).toBe(productNames.length);
    });

    await test.step('Go to Cart and validate all products displayed with Remove button', async () => {
      await inventoryPage.goToCart();
      const cartItemNames = await cartPage.getCartItemNames();
      expect(cartItemNames.sort()).toEqual([...productNames].sort());
      expect(await cartPage.getCartItemCount()).toBe(productNames.length);
      expect(await cartPage.getRemoveButtonCount()).toBe(productNames.length);
    });

    let confirmation = '';
    await test.step('Complete the checkout process', async () => {
      confirmation = await checkoutPage.completeCheckout(
        customer.get('firstName') ?? '',
        customer.get('lastName') ?? '',
        customer.get('postalCode') ?? '',
      );
    });

    await test.step('Verify confirmation message displayed upon submission', async () => {
      expect(confirmation).toContain('Thank you for your order');
    });
  });
});

test.describe('@regression Checkout flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(saucedemoConfig.defaultUsername, saucedemoConfig.defaultPassword);
  });

  test('@smoke completes checkout for a single product', async ({ inventoryPage, checkoutPage }) => {

    await test.step('Add product to cart' + 'Sauce Labs Backpack', async () => {
      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      expect(await inventoryPage.getCartItemCount()).toBe(1);
    });

    let confirmation: string;
    await test.step('Go to Card and complete the checkout process', async () => {
      await inventoryPage.goToCart();
      confirmation = await checkoutPage.completeCheckout('Jane', 'Doe', '380001');
    });

    await test.step('Verify confimation message displayed upon submission', async () => {
      expect(confirmation).toContain('Thank you for your order');
    });

  });

  test('completes checkout for all Excel-driven customer records', async ({ inventoryPage, checkoutPage }) => {
    const scenarios: Array<{ jira: string; testCaseId: string; title: string }> = [
      { jira: 'SCRUM-1', testCaseId: 'TC_CHECKOUT_01', title: 'First Name is required on checkout' },
      { jira: 'SCRUM-2', testCaseId: 'TC_CHECKOUT_02', title: 'Last Name is required on checkout' },
    ];


    for (const scenario of scenarios) {
      const row = await ExcelReader.getTestDataRow(saucedemoConfig.testDataFile, 'CheckoutData', scenario.testCaseId);
      await test.step(`${row.get('testCaseId')}: checkout for ${row.get('firstName')} ${row.get('lastName')}`, async () => {
        await test.step('Add product to cart' + 'Sauce Labs Backpack', async () => {
          await inventoryPage.addProductToCart('Sauce Labs Backpack');
          expect(await inventoryPage.getCartItemCount()).toBe(1);
        });

        let confirmation: string;
        await test.step('Go to Card and complete the checkout process', async () => {
          await inventoryPage.goToCart();
          confirmation = await checkoutPage.completeCheckout(row.get('firstName') ?? '', row.get('lastName') ?? '', row.get('postalCode') ?? '');
        });

        await test.step('Verify confimation message displayed upon submission', async () => {
          expect(confirmation).toContain('Thank you for your order');
          await checkoutPage.goBackToHome();
        });
      });
    }
  });
});

test.describe('@regression SCRUM-7 Apply sorting on Products page', () => {
  let sortingRows = new Array<Map<string, string>>();

  test.beforeAll(async () => {
    sortingRows = await ExcelReader.getAllRowsFromSheet(saucedemoConfig.testDataFile, 'SortingData');
  });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(saucedemoConfig.defaultUsername, saucedemoConfig.defaultPassword);
  });

  test('@smoke sorts products by name and price in all directions', async ({ inventoryPage }) => {
    for (const row of sortingRows) {
      const sortOption = row.get('sortOption') || '';
      const sortLabel = row.get('sortLabel') || '';

      await test.step(`${row.get('testCaseId')}: apply sorting - ${sortLabel}`, async () => {
        await inventoryPage.sortProductsBy(sortOption);

        switch (sortOption) {
          case 'az': {
            const names = await inventoryPage.getProductNames();
            const expected = [...names].sort((a, b) => a.localeCompare(b));
            expect(names).toEqual(expected);
            break;
          }
          case 'za': {
            const names = await inventoryPage.getProductNames();
            const expected = [...names].sort((a, b) => b.localeCompare(a));
            expect(names).toEqual(expected);
            break;
          }
          case 'lohi': {
            const prices = await inventoryPage.getProductPrices();
            const expected = [...prices].sort((a, b) => a - b);
            expect(prices).toEqual(expected);
            break;
          }
          case 'hilo': {
            const prices = await inventoryPage.getProductPrices();
            const expected = [...prices].sort((a, b) => b - a);
            expect(prices).toEqual(expected);
            break;
          }
        }
      });
    }
  });
});