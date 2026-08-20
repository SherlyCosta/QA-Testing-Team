import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  // Billing Address selectors
  public readonly billingSelect: Locator;
  public readonly billingCountrySelect: Locator;
  public readonly billingCityInput: Locator;
  public readonly billingAddress1Input: Locator;
  public readonly billingZipInput: Locator;
  public readonly billingPhoneInput: Locator;
  public readonly billingContinueBtn: Locator;

  // Shipping Address selectors
  public readonly shippingSelect: Locator;
  public readonly shippingContinueBtn: Locator;

  // Shipping Method selectors
  public readonly shippingMethodRadio: Locator;
  public readonly shippingMethodContinueBtn: Locator;

  // Payment Method selectors
  public readonly paymentMethodRadio: Locator;
  public readonly paymentMethodContinueBtn: Locator;

  // Payment Info selectors
  public readonly paymentInfoContinueBtn: Locator;

  // Confirm Order selectors
  public readonly confirmOrderBtn: Locator;

  constructor(page: Page) {
    super(page);

    // Billing
    this.billingSelect = page.locator('#billing-address-select');
    this.billingCountrySelect = page.locator('#BillingNewAddress_CountryId');
    this.billingCityInput = page.locator('#BillingNewAddress_City');
    this.billingAddress1Input = page.locator('#BillingNewAddress_Address1');
    this.billingZipInput = page.locator('#BillingNewAddress_ZipPostalCode');
    this.billingPhoneInput = page.locator('#BillingNewAddress_PhoneNumber');
    this.billingContinueBtn = page.locator('#billing-buttons-container input[value="Continue"]');

    // Shipping
    this.shippingSelect = page.locator('#shipping-address-select');
    this.shippingContinueBtn = page.locator('#shipping-buttons-container input[value="Continue"]');

    // Shipping Method
    this.shippingMethodRadio = page.locator('#shippingoption_0'); // Ground default
    this.shippingMethodContinueBtn = page.locator('#shipping-method-buttons-container input[value="Continue"]');

    // Payment Method
    this.paymentMethodRadio = page.locator('#paymentmethod_0'); // Cash On Delivery default
    this.paymentMethodContinueBtn = page.locator('#payment-method-buttons-container input[value="Continue"]');

    // Payment Info
    this.paymentInfoContinueBtn = page.locator('#payment-info-buttons-container input[value="Continue"]');

    // Confirm
    this.confirmOrderBtn = page.locator('#confirm-order-buttons-container input[value="Confirm"]');
  }

  async completeBillingSection(addressInfo: { countryId: string; city: string; address1: string; zipCode: string; phoneNumber: string }) {
    if (await this.billingSelect.isVisible()) {
      await this.billingSelect.selectOption({ value: '' }); // Selects "New Address" option which has empty value
    }
    await this.billingCountrySelect.selectOption(addressInfo.countryId);
    await this.billingCityInput.fill(addressInfo.city);
    await this.billingAddress1Input.fill(addressInfo.address1);
    await this.billingZipInput.fill(addressInfo.zipCode);
    await this.billingPhoneInput.fill(addressInfo.phoneNumber);
    await this.billingContinueBtn.click();
  }

  async completeShippingSection() {
    // If the shipping address dropdown is visible, check if we need to select something.
    // Otherwise, click Continue.
    if (await this.shippingSelect.isVisible()) {
      // By default it picks the billing address
    }
    await this.shippingContinueBtn.click();
  }

  async selectShippingMethod() {
    await this.shippingMethodRadio.check();
    await this.shippingMethodContinueBtn.click();
  }

  async selectPaymentMethod() {
    await this.paymentMethodRadio.check();
    await this.paymentMethodContinueBtn.click();
  }

  async confirmPaymentInfo() {
    await this.paymentInfoContinueBtn.click();
  }

  async placeOrder() {
    await this.confirmOrderBtn.click();
  }
}
