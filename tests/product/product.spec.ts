import { test, expect } from '../../utils/fixtures';
import { productData } from '../../test-data/productData';

test.describe('Product Catalog @product', () => {
  test('should search for a product and navigate to details page', async ({ page, headerComponent, productPage }) => {
    await page.goto('/');
    await headerComponent.search(productData.partialSearchQuery);

    await expect(page).toHaveURL(/.*search/);

    await productPage.gotoProduct(productData.laptopProduct.slug);
    await expect(productPage.productTitle).toContainText(productData.laptopProduct.expectedTitle);
  });

  test('should display no-results message when searching for non-existent product', async ({ page, headerComponent, productPage }) => {
    await page.goto('/');
    await headerComponent.search(productData.nonExistentSearchQuery);

    const noResultsText = await productPage.getNoResultsText();
    expect(noResultsText).toContain('No products were found that matched your criteria.');
  });

  test('should list multiple matching items for partial search query', async ({ page, headerComponent, productPage }) => {
    await page.goto('/');
    await headerComponent.search(productData.validSearchQuery);

    const count = await productPage.getSearchResultsCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate categories and verify product grid', async ({ productPage }) => {
    await productPage.gotoCategory(productData.category.slug);

    await expect(productPage.categoryTitle).toContainText(productData.category.expectedTitle);
  });

  test('should verify product details page (title and price)', async ({ productPage }) => {
    await productPage.gotoProduct(productData.laptopProduct.slug);

    await expect(productPage.productTitle).toHaveText(productData.laptopProduct.expectedTitle);
    await expect(productPage.productPrice).toHaveText(productData.laptopProduct.expectedPrice);
  });
});
