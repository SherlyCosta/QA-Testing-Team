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
  await page.click('input[name="addtocartbutton"]');
  
  // Wait for navigation or postback
  await page.waitForTimeout(2000);
  
  console.log('URL after clicking Add to cart on Wishlist:', page.url());
  
  // Check header badge
  const headerBadgeText = await page.textContent('span.cart-qty');
  console.log('Header Cart Badge:', headerBadgeText);
  
  // Navigate to cart
  await page.goto('https://demowebshop.tricentis.com/cart');
  console.log('Cart Page URL:', page.url());
  
  const cartTableExists = await page.evaluate(() => !!document.querySelector('.cart'));
  console.log('Cart Table Exists on /cart:', cartTableExists);
  
  if (cartTableExists) {
    const productName = await page.textContent('.cart-item-row .product-name');
    console.log('Product in Cart:', productName.trim());
  }

  await browser.close();
})();
