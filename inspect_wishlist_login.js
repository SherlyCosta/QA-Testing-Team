const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Register user
  await page.goto('https://demowebshop.tricentis.com/register');
  const timestamp = Date.now();
  const email = `erisa_wishlist_${timestamp}@example.com`;
  await page.click('#gender-male');
  await page.fill('#FirstName', 'Test');
  await page.fill('#LastName', 'User');
  await page.fill('#Email', email);
  await page.fill('#Password', 'Password123!');
  await page.fill('#ConfirmPassword', 'Password123!');
  await page.click('#register-button');
  await page.waitForSelector('.result');
  
  // Navigate and add product to wishlist
  await page.goto('https://demowebshop.tricentis.com/fiction-ex');
  await page.click('.product-essential .add-to-wishlist-button');
  await page.waitForSelector('#bar-notification');
  
  // Go to wishlist
  await page.goto('https://demowebshop.tricentis.com/wishlist');
  
  // Click checkbox and click Add to cart button
  await page.check('input[name="addtocart"]');
  
  const isChecked = await page.isChecked('input[name="addtocart"]');
  console.log('CHECKBOX IS CHECKED (LOGGED IN):', isChecked);
  
  await page.click('input[name="addtocartbutton"]');
  await page.waitForNavigation().catch(() => {});
  
  console.log('URL AFTER CLICK (LOGGED IN):', page.url());

  const bodyText = await page.textContent('body');
  if (bodyText.includes('Your Shopping Cart is empty')) {
    console.log('BODY CONTAINS empty cart message');
  }
  
  // Print HTML of the table or elements
  const tableExists = await page.evaluate(() => !!document.querySelector('.cart'));
  console.log('Cart/Wishlist Table Exists:', tableExists);

  await browser.close();
})();
