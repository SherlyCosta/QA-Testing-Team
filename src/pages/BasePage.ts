import { Page, Locator } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;
  public readonly registerLink: Locator;
  public readonly loginLink: Locator;
  public readonly logoutLink: Locator;
  public readonly shoppingCartLink: Locator;
  public readonly wishlistLink: Locator;
  public readonly searchInput: Locator;
  public readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registerLink = page.locator('.header-links a.ico-register');
    this.loginLink = page.locator('.header-links a.ico-login');
    this.logoutLink = page.locator('.header-links a.ico-logout');
    this.shoppingCartLink = page.locator('#topcartlink a.ico-cart');
    this.wishlistLink = page.locator('.header-links a.ico-wishlist');
    this.searchInput = page.locator('#small-searchterms');
    this.searchButton = page.locator('input[value="Search"]');
  }

  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  async searchProduct(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }
}
