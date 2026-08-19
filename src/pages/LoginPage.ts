import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Registration locators
  public readonly genderMaleRadio: Locator;
  public readonly firstNameInput: Locator;
  public readonly lastNameInput: Locator;
  public readonly registerEmailInput: Locator;
  public readonly registerPasswordInput: Locator;
  public readonly confirmPasswordInput: Locator;
  public readonly registerBtn: Locator;
  public readonly registrationResultMsg: Locator;
  public readonly emailExistsErrorMsg: Locator;
  public readonly confirmPasswordErrorMsg: Locator;

  // Login locators
  public readonly loginEmailInput: Locator;
  public readonly loginPasswordInput: Locator;
  public readonly rememberMeCheckbox: Locator;
  public readonly loginBtn: Locator;
  public readonly loginErrorMsg: Locator;

  constructor(page: Page) {
    super(page);

    // Registration selectors
    this.genderMaleRadio = page.locator('#gender-male');
    this.firstNameInput = page.locator('#FirstName');
    this.lastNameInput = page.locator('#LastName');
    this.registerEmailInput = page.locator('#Email'); 
    this.registerPasswordInput = page.locator('#Password');
    this.confirmPasswordInput = page.locator('#ConfirmPassword');
    this.registerBtn = page.locator('#register-button');
    this.registrationResultMsg = page.locator('.result');
    this.emailExistsErrorMsg = page.locator('.message-error');
    this.confirmPasswordErrorMsg = page.locator('[data-valmsg-for="ConfirmPassword"]');

    // Login selectors
    this.loginEmailInput = page.locator('#Email');
    this.loginPasswordInput = page.locator('#Password');
    this.rememberMeCheckbox = page.locator('#RememberMe');
    this.loginBtn = page.locator('input.login-button');
    this.loginErrorMsg = page.locator('.validation-summary-errors');
  }

  async registerUser(details: { firstName: string; lastName: string; email: string; password: string; confirmPassword?: string }) {
    await this.genderMaleRadio.click();
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.registerEmailInput.fill(details.email);
    await this.registerPasswordInput.fill(details.password);
    await this.confirmPasswordInput.fill(details.confirmPassword ?? details.password);
    await this.registerBtn.click();
  }

  async login(email: string, pass: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(pass);
    await this.loginBtn.click();
  }
}
