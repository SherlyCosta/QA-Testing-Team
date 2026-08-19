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
  console.log('--- Wishlist Page Before Add to Cart ---');
  const wishlistTableExists = await page.evaluate(() => !!document.querySelector('.cart'));
  console.log('Wishlist Table Exists:', wishlistTableExists);
  
  // Click checkbox and click Add to cart button
  await page.check('input[name="addtocart"]');
  await page.click('input[name="addtocartbutton"]');
  
  // Wait for page reload
  await page.waitForNavigation().catch(() => {});
  
  console.log('--- Wishlist Page After Add to Cart Click ---');
  console.log('URL:', page.url());
  const wishlistTableExistsAfter = await page.evaluate(() => !!document.querySelector('.cart'));
  console.log('Wishlist Table Exists After:', wishlistTableExistsAfter);
  
  const bodyText = await page.textContent('body');
  const textMatches = ['The wishlist is empty', 'empty', 'error', 'successful', 'Shopping Cart'];
  textMatches.forEach(text => {
    if (bodyText.includes(text)) {
      console.log(`Body contains text: "${text}"`);
    }
  });
  
  // Check if there are warnings
  const warning = await page.evaluate(() => {
    const el = document.querySelector('.warning, .message-error, .validation-summary-errors');
    return el ? el.textContent.trim() : 'No warnings visible';
  });
  console.log('Warning on page:', warning);

  await browser.close();
})();
