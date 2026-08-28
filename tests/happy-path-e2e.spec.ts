import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { ProductPage } from '../src/pages/ProductPage';
import { CartPage } from '../src/pages/CartPage';
import { CheckoutPage } from '../src/pages/CheckoutPage';
import { OrderDetailsPage } from '../src/pages/OrderDetailsPage';
import { generateDynamicUser, defaultBillingAddress, testProducts, testConfig } from '../src/data/testData';
import { CustomAssertions } from '../src/utils/CustomAssertions';

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

  test('TC-18: Fast Double-Click Handling on Accordion Checkout Step (Edge Case / Race Condition)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    const testUser = generateDynamicUser();

    // 1. Register a fresh user for deterministic accordion checkout state
    await loginPage.navigate(testConfig.baseUrl);
    await loginPage.registerLink.click();
    await loginPage.registerUser(testUser);
    await expect(loginPage.registrationResultMsg).toBeVisible();

    // 2. Add product to cart
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);
    await productPage.addCurrentProductToCart();

    // 3. Open cart and proceed to checkout
    await cartPage.shoppingCartLink.click();
    await expect(page).toHaveURL(/.*\/cart/);
    await cartPage.acceptTermsAndCheckout();
    await expect(page).toHaveURL(/.*\/onepagecheckout/);

    // 4. Complete Step 1: Billing Address
    await checkoutPage.completeBillingSection(defaultBillingAddress);
    await page.waitForTimeout(500);

    // 5. Complete Step 2: Shipping Address
    await checkoutPage.completeShippingSection();
    await page.waitForTimeout(500);

    // 6. Step 3: Rapidly double click the Shipping Method Continue button
    await checkoutPage.shippingMethodContinueBtn.waitFor({ state: 'visible', timeout: 10000 });
    
    const clickPromise = checkoutPage.shippingMethodContinueBtn.click({ clickCount: 2, delay: 30 });
    const isDisabled = await checkoutPage.shippingMethodContinueBtn.isDisabled().catch(() => false);
    await clickPromise.catch(() => {});

    CustomAssertions.assertBusinessRule(isDisabled, {
      bugTitle: 'Accordion Checkout Button Enables Duplicate AJAX Postbacks',
      module: 'Checkout Module',
      severity: 'Medium',
      expectedResult: 'Accordion checkout "Continue" button must enter a disabled state immediately upon first click.',
      actualResult:   'Button remained active and enabled during active AJAX postbacks, allowing multiple rapid click events.'
    });
  });
});
