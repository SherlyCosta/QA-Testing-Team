import { test as base } from '@playwright/test';
import { HeaderComponent } from '../pages/HeaderComponent';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';

type MyFixtures = {
  headerComponent: HeaderComponent;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  productPage: ProductPage;
  cartPage: CartPage;
};

export const test = base.extend<MyFixtures>({
  headerComponent: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from '@playwright/test';
