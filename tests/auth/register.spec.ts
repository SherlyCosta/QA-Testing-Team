import { test, expect } from '../../utils/fixtures';
import { generateRandomUser } from '../../utils/helpers';
import { authData } from '../../test-data/authData';

test.describe('Authentication - Registration @auth', () => {
  test('should display registration form elements correctly', async ({ registerPage }) => {
    await registerPage.goto();

    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.registerButton).toBeVisible();
  });

  test('should complete valid registration successfully', async ({ registerPage }) => {
    const newUser = generateRandomUser();
    await registerPage.goto();
    await registerPage.register(newUser);

    const resultText = await registerPage.getResultText();
    expect(resultText).toContain('Your registration completed');
  });

  test('should show error when registering with duplicate email', async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.register({
      gender: 'male',
      firstName: 'Existing',
      lastName: 'User',
      email: authData.existingUser.email,
      password: 'TestPassword123!',
    });

    await expect(registerPage.summaryValidationErrors).toContainText('The specified email already exists');
  });

  test('should show validation errors when registering with empty required fields', async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.clickRegister();

    const errors = await registerPage.getValidationErrors();
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(errors.some((err) => err.includes('First name is required'))).toBeTruthy();
    expect(errors.some((err) => err.includes('Last name is required'))).toBeTruthy();
    expect(errors.some((err) => err.includes('Email is required'))).toBeTruthy();
    expect(errors.some((err) => err.includes('Password is required'))).toBeTruthy();
  });

  test('should show error on password and confirm password mismatch', async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.register({
      firstName: 'Test',
      lastName: 'Mismatch',
      email: 'mismatch_user@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword456!',
    });

    const errors = await registerPage.getValidationErrors();
    expect(errors.some((err) => err.includes('The password and confirmation password do not match'))).toBeTruthy();
  });
});
