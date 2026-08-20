
import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { generateDynamicUser, invalidCredentials, validationMessages, testConfig } from '../src/data/testData';

test.describe('Demo Web Shop - Authentication Suite', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate(testConfig.baseUrl);
  });

  test('TC-01: Register New User successfully (Positive)', async ({ page }) => {
    const userDetails = generateDynamicUser();

    // Click register link and perform registration
    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/.*\/register/);

    await loginPage.registerUser(userDetails);

    // Assert successful registration message
    await expect(loginPage.registrationResultMsg).toBeVisible();
    await expect(loginPage.registrationResultMsg).toHaveText('Your registration completed');
  });

  test('TC-02: Register with Existing Email fails (Negative)', async ({ page }) => {
    const firstUser = generateDynamicUser();

    // First, register a user to ensure the email exists
    await loginPage.registerLink.click();
    await loginPage.registerUser(firstUser);
    await expect(loginPage.registrationResultMsg).toBeVisible();

    // Log out to return to guest state
    await loginPage.logoutLink.click();

    // Attempt to register again with the same email
    await loginPage.registerLink.click();
    await loginPage.registerUser({
      ...generateDynamicUser(),
      email: firstUser.email, // reuse email
    });

    // Assert duplicate email error message
    await expect(loginPage.emailExistsErrorMsg).toBeVisible();
    await expect(loginPage.emailExistsErrorMsg).toContainText(validationMessages.duplicateEmailError);
  });

  test('TC-03: Register with Mismatched Passwords fails (Negative)', async ({ page }) => {
    const userDetails = generateDynamicUser();

    await loginPage.registerLink.click();
    await loginPage.registerUser({
      ...userDetails,
      confirmPassword: 'DifferentPassword123!', // mismatched password
    });

    // Assert inline validation error for confirmation password
    await expect(loginPage.confirmPasswordErrorMsg).toBeVisible();
    await expect(loginPage.confirmPasswordErrorMsg).toHaveText(validationMessages.passwordMismatchError);
  });

  test('TC-04: Login and Logout successfully (Positive)', async ({ page }) => {
    const userDetails = generateDynamicUser();

    // 1. Create the user dynamically so this test is fully self-contained & independent
    await loginPage.registerLink.click();
    await loginPage.registerUser(userDetails);
    await expect(loginPage.registrationResultMsg).toBeVisible();
    await loginPage.logoutLink.click();

    // 2. Perform Login
    await loginPage.loginLink.click();
    await expect(page).toHaveURL(/.*\/login/);

    await loginPage.login(userDetails.email, userDetails.password);

    // Verify email shows in the header (user is logged in)
    const headerEmailLink = page.locator(`a.account:has-text("${userDetails.email}")`);
    await expect(headerEmailLink).toBeVisible();
    await expect(loginPage.logoutLink).toBeVisible();


    // 3. Perform Logout
    await loginPage.logoutLink.click();
    await expect(loginPage.loginLink).toBeVisible();
    await expect(headerEmailLink).not.toBeVisible();
  });

  test('TC-05: Login with Invalid Credentials fails (Negative)', async ({ page }) => {
    await loginPage.loginLink.click();
    await loginPage.login(invalidCredentials.unregisteredEmail, invalidCredentials.wrongPassword);

    // Assert error message summary
    await expect(loginPage.loginErrorMsg).toBeVisible();
    await expect(loginPage.loginErrorMsg).toContainText(validationMessages.loginFailedError);
  });
});
