import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  public readonly productTitle: Locator;
  public readonly productPrice: Locator;
  public readonly addToWishlistBtn: Locator;
  public readonly addToCartBtn: Locator;
  public readonly productListItems: Locator;
  public readonly successNotificationBar: Locator;
  public readonly categoryHeader: Locator;
  public readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.productTitle = page.locator('.product-name h1');
    // Using a wildcard class selector to support price elements for any product ID (e.g. price-value-5, price-value-13, etc.)
    this.productPrice = page.locator('.product-essential [class*="price-value-"]');
    this.addToWishlistBtn = page.locator('.product-essential .add-to-wishlist-button').first();
    this.addToCartBtn = page.locator('.product-essential .add-to-cart-button').first();
    this.productListItems = page.locator('.product-item');
    this.successNotificationBar = page.locator('#bar-notification');
    this.categoryHeader = page.locator('.page-title h1');
    this.noResultsMessage = page.locator('.search-results .result');
  }

  async selectCategory(categoryName: string) {
    // Select the category link from the top navigation bar
    const categoryLink = this.page.locator(`.top-menu a:has-text("${categoryName}")`).first();
    await categoryLink.click();
  }

  async clickProductByName(productName: string) {
    // Click the specific product title link inside the product grid
    const productLink = this.page.locator('.product-item .product-title a').filter({ hasText: new RegExp(`^${productName}$`) }).first();
    await productLink.click();
  }

  async addCurrentProductToWishlist() {
    await this.addToWishlistBtn.click();
    await this.successNotificationBar.waitFor({ state: 'visible' });
  }

  async addCurrentProductToCart() {
    await this.addToCartBtn.click();
    await this.successNotificationBar.waitFor({ state: 'visible' });
  }

  async getProductDetails() {
    const title = await this.productTitle.textContent();
    const price = await this.productPrice.textContent();
    return {
      title: title?.trim(),
      price: price?.trim(),
    };
  }
}
