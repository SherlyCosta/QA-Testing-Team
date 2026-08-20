import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  // Wishlist elements
  public readonly addCartCheckbox: Locator;
  public readonly addCartBtn: Locator;
  public readonly wishlistQtyInput: Locator;

  // Shopping Cart elements
  public readonly termOfServiceCheckbox: Locator;
  public readonly checkoutBtn: Locator;
  public readonly removeCheckbox: Locator;
  public readonly qtyInput: Locator;
  public readonly updateCartBtn: Locator;
  public readonly cartEmptyMsg: Locator;
  public readonly cartItems: Locator;
  public readonly cartSubtotal: Locator;
  public readonly headerCartBadge: Locator;

  constructor(page: Page) {
    super(page);

    // Wishlist mappings
    this.addCartCheckbox = page.locator('input[name="addtocart"]');
    this.addCartBtn = page.locator('input[name="addtocartbutton"]');
    this.wishlistQtyInput = page.locator('.wishlist-qty-input'); 

    // Cart mappings
    this.termOfServiceCheckbox = page.locator('#termsofservice');
    this.checkoutBtn = page.locator('#checkout');
    this.removeCheckbox = page.locator('input[name="removefromcart"]');
    this.qtyInput = page.locator('input.qty-input');
    this.updateCartBtn = page.locator('input[name="updatecart"]');
    this.cartEmptyMsg = page.locator('.order-summary-content');
    this.cartItems = page.locator('.cart-item-row');
    this.cartSubtotal = page.locator('tr:has-text("Sub-Total:") .product-price');
    this.headerCartBadge = page.locator('span.cart-qty');
  }

  async moveWishlistItemToCart() {
    await this.addCartCheckbox.first().check();
    await this.addCartBtn.click();
  }

  async acceptTermsAndCheckout() {
    await this.termOfServiceCheckbox.check();
    await this.checkoutBtn.click();
  }

  async updateQuantity(newQty: string) {
    await this.qtyInput.first().fill(newQty);
    await this.updateCartBtn.click();
  }

  async removeProduct() {
    await this.removeCheckbox.first().check();
    await this.updateCartBtn.click();
  }
}
