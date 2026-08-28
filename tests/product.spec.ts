import { test, expect } from '@playwright/test';
import { ProductPage } from '../src/pages/ProductPage';
import { testProducts, searchTerms, testConfig } from '../src/data/testData';
import { CustomAssertions } from '../src/utils/CustomAssertions';

test.describe('Demo Web Shop - Product Suite', () => {
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    await productPage.navigate(testConfig.baseUrl);
  });

  test('TC-06: Product Category Navigation (Positive)', async ({ page }) => {
    // Navigate to "Apparel & Shoes" category
    await productPage.selectCategory(testProducts.categoryApparel);

    // Verify correct page URL and category header content
    await expect(page).toHaveURL(/.*\/apparel-shoes/);
    await expect(productPage.categoryHeader).toBeVisible();
    await expect(productPage.categoryHeader).toHaveText(testProducts.categoryApparel);
  });

  test('TC-07: Search for Existing Product (Positive)', async ({ page }) => {
    // Search for the book
    await productPage.searchProduct(searchTerms.existing);

    // Verify we are on search page and the product grid contains the book
    await expect(page).toHaveURL(/.*\/search.*/);
    const searchResultBook = page.locator('.product-item .product-title a').filter({ hasText: new RegExp(`^${testProducts.book}$`) });
    await expect(searchResultBook).toBeVisible();
  });

  test('TC-08: Search for Nonexistent Product (Negative)', async ({ page }) => {
    // Search for invalid string
    await productPage.searchProduct(searchTerms.nonexistent);

    // Assert correct URL and no results display message
    await expect(page).toHaveURL(/.*\/search.*/);
    await expect(productPage.noResultsMessage).toBeVisible();
    await expect(productPage.noResultsMessage).toContainText('No products were found that matched your criteria.');
  });

  test('TC-09: Search Edge Case - Empty Search triggers alert (Edge Case)', async ({ page }) => {
    // Set up dialog listener to intercept and assert on the browser alert dialog
    let alertHandled = false;
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe(searchTerms.emptySearchAlert);
      alertHandled = true;
      await dialog.dismiss();
    });

    // Attempt to search with an empty query
    await productPage.searchInput.fill('');
    await productPage.searchButton.click();

    // Verify that the dialog was intercepted and dismissed successfully
    expect(alertHandled).toBe(true);
  });

  test('TC-10: Open Product Details & Validate Product Info (Positive)', async ({ page }) => {
    // 1. Search for product and select it
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);

    // Verify detail page URL contains route segments
    await expect(page).toHaveURL(/.*\/computing-and-internet/);

    // 2. Extract and assert product information
    const details = await productPage.getProductDetails();
    expect(details.title).toBe(testProducts.book);
    expect(details.price).toBe(testProducts.bookPrice);
  });

  test('TC-16: Email a Friend Validation for Invalid Friend Email Formats (Negative)', async ({ page }) => {
    // 1. Open product details page
    await productPage.searchProduct(testProducts.book);
    await productPage.clickProductByName(testProducts.book);

    // 2. Attempt emailing a friend with invalid email formats
    await productPage.emailAFriend('user@domain..com', 'myemail@example.com', 'Check this out!');

    // Assert validation error is shown
    await expect(productPage.emailFriendErrorMsg).toBeVisible();
    await expect(productPage.emailFriendErrorMsg).toContainText('Wrong email');
  });

  test('TC-17: Search Field Security & Handling for Special Characters and XSS Strings (Security / Edge Case)', async ({ page }) => {
    // 1. Search special characters / quotes
    await productPage.searchProduct(`%'"`);
    await expect(page).toHaveURL(/.*\/search.*/);
    await expect(productPage.noResultsMessage).toContainText('No products were found that matched your criteria.');

    // 2. Search script tag payload - REQUIREMENT: Application must handle input safely on search page (200 OK) without crashing/redirecting to /errorpage.htm
    await productPage.searchInput.fill('<script>alert(1)</script>');
    await productPage.searchButton.click();

    const currentUrl = page.url();
    const isErrorPage = currentUrl.includes('errorpage.htm');

    CustomAssertions.assertBusinessRule(!isErrorPage, {
      bugTitle: 'Unhandled Exception Crash Screen on Search XSS Payload',
      module: 'Search / Catalog Module',
      severity: 'High',
      expectedResult: 'Submitting script tags (<script>alert(1)</script>) in search input must be handled gracefully, returning HTTP 200 with "No products found" page.',
      actualResult:   `Application threw an unhandled server exception and navigated to: ${currentUrl}`
    });
  });
});
