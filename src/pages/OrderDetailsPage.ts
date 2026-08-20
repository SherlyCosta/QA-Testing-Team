import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrderDetailsPage extends BasePage {
  public readonly successMessage: Locator;
  public readonly orderNumberLabel: Locator;
  public readonly orderDetailsLink: Locator;
  public readonly printLink: Locator;
  public readonly pdfInvoiceLink: Locator;

  constructor(page: Page) {
    super(page);

    this.successMessage = page.locator('.section.order-completed .title strong');
    this.orderNumberLabel = page.locator('.section.order-completed .details li').first();
    this.orderDetailsLink = page.locator('text=Click here for order details.');
    this.printLink = page.locator('a.print-order-button');
    this.pdfInvoiceLink = page.locator('a.pdf-order-button');
  }

  async clickOrderDetails() {
    await this.orderDetailsLink.click();
  }

  async verifyPrintButtonVisible() {
    await expect(this.printLink).toBeVisible();
  }

  async downloadPdfInvoice() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.pdfInvoiceLink.click();
    return await downloadPromise;
  }
}
