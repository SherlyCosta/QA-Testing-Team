import { test, expect } from '@playwright/test';
import { ProductPage } from '../src/pages/ProductPage';
import { CartPage } from '../src/pages/CartPage';
import { testProducts, validationMessages, testConfig } from '../src/data/testData';

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
});
