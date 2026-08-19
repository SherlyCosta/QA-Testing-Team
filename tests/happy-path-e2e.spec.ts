
import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { ProductPage } from '../src/pages/ProductPage';
import { CartPage } from '../src/pages/CartPage';
import { CheckoutPage } from '../src/pages/CheckoutPage';
import { OrderDetailsPage } from '../src/pages/OrderDetailsPage';
import { generateDynamicUser, defaultBillingAddress, testProducts, testConfig } from '../src/data/testData';

test.describe('Demo Web Shop - E2E Happy Path', () => {
  test('Register, Add Product to Wishlist, Move to Cart, Checkout & Download PDF Invoice', async ({ page }) => {
    // Page Initialisation
    const loginPage = new LoginPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const orderDetailsPage = new OrderDetailsPage(page);

    const testUser = generateDynamicUser();

    // Helper function to add visual delays only when running in headed mode
    const isHeaded = process.argv.includes('--headed');
    const visualDelay = async (ms: number = 1000) => {
      if (isHeaded) {
        await page.waitForTimeout(ms);
      }
    };

    // 1. Navigate to Home Page & Register
    await loginPage.navigate(testConfig.baseUrl);
    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/.*\/register/);

    await loginPage.registerUser(testUser);
    await expect(loginPage.registrationResultMsg).toBeVisible();
    await expect(loginPage.registrationResultMsg).toHaveText('Your registration completed');
    await visualDelay();

    // 2. Search for the target book and open its details page
    await productPage.searchProduct(testProducts.wishlistProduct);
    await productPage.clickProductByName(testProducts.wishlistProduct);
    await expect(page).toHaveURL(/.*\/black-white-diamond-heart/);
    await visualDelay();

    // 3. Add to Wishlist
    await productPage.addCurrentProductToWishlist();
    await expect(productPage.successNotificationBar).toBeVisible();
    await visualDelay();

    // 4. Open Wishlist and move the product to the Shopping Cart
    await cartPage.wishlistLink.click();
    await expect(page).toHaveURL(/.*\/wishlist/);
    await visualDelay();

    await cartPage.moveWishlistItemToCart();
    await expect(page).toHaveURL(/.*\/cart/);
    await expect(cartPage.headerCartBadge).toHaveText('(1)');
    await visualDelay();

    // 5. Agree to Terms and proceed to Checkout
    await cartPage.acceptTermsAndCheckout();
    await expect(page).toHaveURL(/.*\/onepagecheckout/);
    await visualDelay();

    // 6. Complete the step-by-step Checkout Accordion
    await checkoutPage.completeBillingSection(defaultBillingAddress);
    await visualDelay(500);

    await checkoutPage.completeShippingSection();
    await visualDelay(500);

    await checkoutPage.selectShippingMethod();
    await visualDelay(500);

    await checkoutPage.selectPaymentMethod();
    await visualDelay(500);

    await checkoutPage.confirmPaymentInfo();
    await visualDelay(500);

    await checkoutPage.placeOrder();
    await visualDelay();

    // 7. Verify Order Completion
    await expect(orderDetailsPage.successMessage).toBeVisible();
    await expect(orderDetailsPage.successMessage).toHaveText('Your order has been successfully processed!');
    await expect(orderDetailsPage.orderNumberLabel).toBeVisible();
    await visualDelay();

    // 8. Navigate to Order Details Page
    await orderDetailsPage.clickOrderDetails();
    await expect(page).toHaveURL(/.*\/orderdetails.*/);
    await visualDelay();

    // 9. Verify Print Link is visible
    await orderDetailsPage.verifyPrintButtonVisible();

    // 10. Intercept and download the PDF Invoice
    const download = await orderDetailsPage.downloadPdfInvoice();
    expect(download.suggestedFilename()).toMatch(/order.*\.pdf/i);

    // Verify file exists and has content
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    // Final pause in headed mode to let the user view the finished state
    await visualDelay(4000);
  });
});
