import { Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly notificationBar: Locator;
  readonly searchResultsItems: Locator;
  readonly noResultsMessage: Locator;
  readonly categoryTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('.product-name h1');
    this.productPrice = page.locator('.product-price span');
    this.quantityInput = page.locator('.qty-input');
    this.addToCartButton = page.locator('input[id^="add-to-cart-button"]');
    this.notificationBar = page.locator('#bar-notification .content');
    this.searchResultsItems = page.locator('.search-results .product-item');
    this.noResultsMessage = page.locator('.search-results .result');
    this.categoryTitle = page.locator('.page-title h1');
  }

  async gotoProduct(productSlug: string) {
    await this.page.goto(`/${productSlug}`);
  }

  async gotoCategory(categorySlug: string) {
    await this.page.goto(`/${categorySlug}`);
  }

  async addToCart(quantity?: number) {
    if (quantity && (await this.quantityInput.isVisible())) {
      await this.quantityInput.fill(quantity.toString());
    }
    await this.addToCartButton.click();
    await this.notificationBar.waitFor({ state: 'visible' });
  }

  async getNotificationText(): Promise<string> {
    await this.notificationBar.waitFor({ state: 'visible' });
    return await this.notificationBar.innerText();
  }

  async getSearchResultsCount(): Promise<number> {
    await this.searchResultsItems.first().waitFor({ state: 'visible' });
    return await this.searchResultsItems.count();
  }

  async getNoResultsText(): Promise<string> {
    return await this.noResultsMessage.innerText();
  }
}
