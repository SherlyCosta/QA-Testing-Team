import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HeaderComponent } from '../pages/HeaderComponent';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate user', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing required environment variables: TEST_USER_EMAIL and TEST_USER_PASSWORD must be defined in your environment or .env file.'
    );
  }

  const loginPage = new LoginPage(page);
  const headerComponent = new HeaderComponent(page);
  const registerPage = new RegisterPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);

  // If credentials are not yet registered on Demo Web Shop, auto-register the account
  const isErrorVisible = await loginPage.validationErrorMessage.isVisible();
  if (isErrorVisible) {
    await registerPage.goto();
    await registerPage.register({
      gender: 'male',
      firstName: 'QA',
      lastName: 'Automation',
      email,
      password,
    });
    await headerComponent.logout();
    await loginPage.goto();
    await loginPage.login(email, password);
  }

  // Verify successful authentication
  await expect(headerComponent.accountLink).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
