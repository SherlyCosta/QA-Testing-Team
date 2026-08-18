import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItemRows: Locator;
  readonly itemTitleLinks: Locator;
  readonly removeCheckboxes: Locator;
  readonly quantityInputs: Locator;
  readonly updateCartButton: Locator;
  readonly orderTotal: Locator;
  readonly summaryContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItemRows = page.locator('table.cart tbody tr.cart-item-row');
    this.itemTitleLinks = page.locator('table.cart a.product-name');
    this.removeCheckboxes = page.locator('input[name="removefromcart"]');
    this.quantityInputs = page.locator('table.cart input.qty-input');
    this.updateCartButton = page.locator('input[name="updatecart"]');
    this.orderTotal = page.locator('.order-total strong');
    this.summaryContent = page.locator('.order-summary-content');
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async getItemNames(): Promise<string[]> {
    return await this.itemTitleLinks.allInnerTexts();
  }

  async getSummaryText(): Promise<string> {
    return await this.summaryContent.innerText();
  }

  async updateItemQuantity(itemIndex: number, newQuantity: number) {
    const qtyInput = this.quantityInputs.nth(itemIndex);
    await qtyInput.fill(newQuantity.toString());
    await this.updateCartButton.click();
  }

  async removeItem(itemIndex: number) {
    const checkbox = this.removeCheckboxes.nth(itemIndex);
    await checkbox.check();
    await this.updateCartButton.click();
  }
}
