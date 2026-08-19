import { Page, Locator } from '@playwright/test';

export class HeaderComponent {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly shoppingCartLink: Locator;
  readonly cartQuantityBadge: Locator;
  readonly registerLink: Locator;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;
  readonly accountLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('#small-searchterms');
    this.searchButton = page.locator('input.search-box-button');
    this.shoppingCartLink = page.locator('#topcartlink a.ico-cart');
    this.cartQuantityBadge = page.locator('#topcartlink .cart-qty');
    this.registerLink = page.locator('a.ico-register');
    this.loginLink = page.locator('a.ico-login');
    this.logoutLink = page.locator('a.ico-logout');
    this.accountLink = page.locator('.header-links a.account');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async goToCart() {
    await this.shoppingCartLink.click();
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async logout() {
    await this.logoutLink.click();
  }

  async getUserEmail(): Promise<string> {
    return await this.accountLink.innerText();
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.logoutLink.isVisible();
  }

  async getCartQuantity(): Promise<number> {
    const text = await this.cartQuantityBadge.innerText();
    const matches = text.match(/\d+/);
    return matches ? parseInt(matches[0], 10) : 0;
  }
}
