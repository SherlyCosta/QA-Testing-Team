import { test, expect } from '../../utils/fixtures';
import { productData } from '../../test-data/productData';

test.describe('Shopping Cart @cart', () => {
  test('should add product to cart and verify notification', async ({ productPage, cartPage }) => {
    await productPage.gotoProduct(productData.laptopProduct.slug);
    await productPage.addToCart(1);

    const notificationText = await productPage.getNotificationText();
    expect(notificationText).toContain('The product has been added to your shopping cart');

    await cartPage.goto();
    const items = await cartPage.getItemNames();
    expect(items.some((item) => item.includes(productData.laptopProduct.expectedTitle))).toBeTruthy();
  });

  test('should add multiple products to cart and update header cart badge count', async ({ productPage, headerComponent }) => {
    await productPage.gotoProduct(productData.laptopProduct.slug);
    await productPage.addToCart(1);

    await productPage.gotoProduct(productData.bookProduct.slug);
    await productPage.addToCart(1);

    const cartCount = await headerComponent.getCartQuantity();
    expect(cartCount).toBeGreaterThanOrEqual(2);
  });

  test('should update product quantity in shopping cart', async ({ productPage, cartPage }) => {
    await productPage.gotoProduct(productData.laptopProduct.slug);
    await productPage.addToCart(1);

    await cartPage.goto();
    await cartPage.updateItemQuantity(0, 3);

    const qtyInput = cartPage.quantityInputs.first();
    await expect(qtyInput).toHaveValue('3');
  });

  test('should remove product from cart using remove checkbox', async ({ productPage, cartPage }) => {
    await productPage.gotoProduct(productData.laptopProduct.slug);
    await productPage.addToCart(1);

    await cartPage.goto();
    const initialItemCount = (await cartPage.getItemNames()).length;

    await cartPage.removeItem(0);

    const finalItemCount = (await cartPage.getItemNames()).length;
    expect(finalItemCount).toBeLessThan(initialItemCount);
  });

  test('should display empty cart message when cart is empty', async ({ page, cartPage }) => {
    await page.goto('/');
    // Clear cookies/storage to ensure empty cart state
    await page.context().clearCookies();
    await cartPage.goto();

    const summaryText = await cartPage.getSummaryText();
    expect(summaryText).toContain('Your Shopping Cart is empty!');
  });
});

test.describe('Shopping Cart - Authenticated Session @cart', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should persist account session and allow adding items to cart as authenticated user', async ({ page, productPage, cartPage, headerComponent }) => {
    await page.goto('/');
    const isLoggedIn = await headerComponent.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    await productPage.gotoProduct(productData.laptopProduct.slug);
    await productPage.addToCart(1);

    await cartPage.goto();
    const items = await cartPage.getItemNames();
    expect(items.some((item) => item.includes(productData.laptopProduct.expectedTitle))).toBeTruthy();
  });
});
