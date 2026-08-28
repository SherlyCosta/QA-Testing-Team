import { test, expect } from '@playwright/test';
import { ProductPage } from '../src/pages/ProductPage';
import { CartPage } from '../src/pages/CartPage';
import { testProducts, validationMessages, testConfig } from '../src/data/testData';
import { CustomAssertions } from '../src/utils/CustomAssertions';

test.describe('Demo Web Shop - Cart Suite', () => {
  let productPage: ProductPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
    await productPage.navigate(testConfig.baseUrl);
  });

  test('TC-11: Add Product to Cart successfully (Positive)', async ({ page }) => {
    // 1. Search for book and navigate to details
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);

    // 2. Add to cart and wait for dynamic notification bar
    await productPage.addCurrentProductToCart();

    // 3. Navigate to Shopping Cart
    await cartPage.shoppingCartLink.click();
    await expect(page).toHaveURL(/.*\/cart/);

    // Assert product is in the cart and badge count is (1)
    const cartProductLink = page.locator('.cart-item-row .product-name').filter({ hasText: new RegExp(`^${testProducts.book}$`) });
    await expect(cartProductLink).toBeVisible();
    await expect(cartPage.headerCartBadge).toHaveText('(1)');
  });

  test('TC-12: Update Product Quantity inside Shopping Cart (Positive)', async ({ page }) => {
    // 1. Add item to cart
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);
    await productPage.addCurrentProductToCart();

    // 2. Open Cart page
    await cartPage.shoppingCartLink.click();

    // 3. Update quantity to 3
    await cartPage.updateQuantity('3');

    // Assert that the quantity input retains the value "3"
    await expect(cartPage.qtyInput.first()).toHaveValue('3');

    // Assert that the subtotal is updated (10.00 * 3 = 30.00)
    await expect(cartPage.cartSubtotal).toHaveText('30.00');
  });

  test('TC-13: Remove Product from Shopping Cart (Positive)', async ({ page }) => {
    // 1. Add item to cart
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);
    await productPage.addCurrentProductToCart();

    // 2. Open Cart page
    await cartPage.shoppingCartLink.click();

    // 3. Remove product
    await cartPage.removeProduct();

    // Assert cart is empty and badge count decreases back to (0)
    await expect(cartPage.cartEmptyMsg).toBeVisible();
    await expect(cartPage.cartEmptyMsg).toContainText(validationMessages.emptyCartError);
    await expect(cartPage.headerCartBadge).toHaveText('(0)');
  });

  test('TC-14: Negative and Non-Numeric Quantities in Shopping Cart (Negative / Edge Case)', async ({ page }) => {
    // 1. Add item to cart
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);
    await productPage.addCurrentProductToCart();

    // 2. Open Cart page
    await cartPage.shoppingCartLink.click();

    // 3. Test negative quantity "-5"
    await cartPage.updateQuantity('-5');
    
    const isErrorVisible = await page.locator('.message-error, .field-validation-error').isVisible().catch(() => false);
    const isCartEmpty = await cartPage.cartEmptyMsg.isVisible().catch(() => false);
    const isRequirementMet = isErrorVisible && !isCartEmpty;

    CustomAssertions.assertBusinessRule(isRequirementMet, {
      bugTitle: 'Negative Cart Quantity Clears Cart Without Inline Validation',
      module: 'Shopping Cart Module',
      severity: 'High',
      expectedResult: 'Entering a negative quantity (-5) must display an inline validation error ("Quantity must be positive") and retain the item in the cart.',
      actualResult:   `Application silently emptied the cart without displaying validation error. Cart empty message visible: ${isCartEmpty}`
    });
  });

  test('TC-15: Cart Update via Quantity 0 Removes Product (Positive / Edge Case)', async ({ page }) => {
    // 1. Add item to cart
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);
    await productPage.addCurrentProductToCart();

    // 2. Open Cart page
    await cartPage.shoppingCartLink.click();

    // 3. Update quantity from 1 to 0 without checking remove checkbox
    await cartPage.updateQuantity('0');

    const isErrorVisible = await page.locator('.message-error, .field-validation-error').isVisible().catch(() => false);

    CustomAssertions.assertBusinessRule(isErrorVisible, {
      bugTitle: 'Implicit Cart Item Deletion via Zero Quantity Entry',
      module: 'Shopping Cart Module',
      severity: 'Medium',
      expectedResult: 'Updating quantity to 0 without checking the "Remove" checkbox must require explicit checkbox selection or display a validation error.',
      actualResult:   'Application implicitly deleted the item from cart without requiring remove checkbox confirmation.'
    });
  });
});
