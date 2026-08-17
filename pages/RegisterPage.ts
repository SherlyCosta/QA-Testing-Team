import { Page, Locator } from '@playwright/test';

export interface RegisterDetails {
  gender?: 'male' | 'female';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export class RegisterPage {
  readonly page: Page;
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly resultMessage: Locator;
  readonly fieldValidationErrors: Locator;
  readonly summaryValidationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.genderMaleRadio = page.locator('#gender-male');
    this.genderFemaleRadio = page.locator('#gender-female');
    this.firstNameInput = page.locator('#FirstName');
    this.lastNameInput = page.locator('#LastName');
    this.emailInput = page.locator('#Email');
    this.passwordInput = page.locator('#Password');
    this.confirmPasswordInput = page.locator('#ConfirmPassword');
    this.registerButton = page.locator('#register-button');
    this.resultMessage = page.locator('.result');
    this.fieldValidationErrors = page.locator('.field-validation-error span');
    this.summaryValidationErrors = page.locator('.validation-summary-errors li');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(details: RegisterDetails) {
    await this.firstNameInput.waitFor({ state: 'visible' });
    if (details.gender === 'female') {
      await this.genderFemaleRadio.check();
    } else if (details.gender === 'male') {
      await this.genderMaleRadio.check();
    }

    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.passwordInput.fill(details.password);
    await this.confirmPasswordInput.fill(details.confirmPassword ?? details.password);
    await this.registerButton.click();
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  async getResultText(): Promise<string> {
    return await this.resultMessage.innerText();
  }

  async getValidationErrors(): Promise<string[]> {
    return await this.fieldValidationErrors.allInnerTexts();
  }

  async getSummaryErrors(): Promise<string[]> {
    return await this.summaryValidationErrors.allInnerTexts();
  }
}
