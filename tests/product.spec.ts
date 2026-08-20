import { test, expect } from '@playwright/test';
import { ProductPage } from '../src/pages/ProductPage';
import { testProducts, searchTerms, testConfig } from '../src/data/testData';

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
});
