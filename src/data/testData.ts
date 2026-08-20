export const testConfig = {
  baseUrl: 'https://demowebshop.tricentis.com',
};

export const defaultBillingAddress = {
  countryId: '1', // USA
  city: 'Boston',
  address1: '100 Main Street',
  zipCode: '02108',
  phoneNumber: '617-555-0199',
};

export const testProducts = {
  book: 'Computing and Internet',
  bookPrice: '10.00',
  categoryApparel: 'Apparel & Shoes',
  wishlistProduct: 'Black & White Diamond Heart',
  wishlistProductPrice: '130.00',
};

export const searchTerms = {
  existing: 'Computing and Internet',
  nonexistent: 'NonExistentBook999',
  emptySearchAlert: 'Please enter some search keyword',
};


export function generateDynamicUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    firstName: 'Erisa',
    lastName: 'Test',
    email: `erisa_test_${timestamp}_${random}@example.com`,
    password: 'Password123!',
  };
}

export const invalidCredentials = {
  unregisteredEmail: 'nonexistent_user_9999@example.com',
  wrongPassword: 'WrongPassword999!',
};

export const validationMessages = {
  duplicateEmailError: 'The specified email already exists',
  loginFailedError: 'Login was unsuccessful. Please correct the errors and try again.',
  passwordMismatchError: 'The password and confirmation password do not match.',
  emptyCartError: 'Your Shopping Cart is empty!',
};

