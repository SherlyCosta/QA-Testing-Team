import { test, expect } from '../../utils/fixtures';
import { generateRandomUser } from '../../utils/helpers';
import { authData } from '../../test-data/authData';

test.describe('Authentication - Login @auth', () => {
  test('should navigate to login page and display error on invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(authData.invalidUser.email, authData.invalidUser.password);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Login was unsuccessful.');
  });

  test('should log in successfully with valid credentials and log out', async ({ registerPage, loginPage, headerComponent }) => {
    const user = generateRandomUser();
    await registerPage.goto();
    await registerPage.register(user);

    // Logout after registration
    await headerComponent.logout();

    // Log in with newly registered user
    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    // Verify logged in user email in header
    const loggedInEmail = await headerComponent.getUserEmail();
    expect(loggedInEmail).toBe(user.email);

    // Log out
    await headerComponent.logout();
    const isLoggedIn = await headerComponent.isLoggedIn();
    expect(isLoggedIn).toBeFalsy();
  });
});
