const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate and add product to wishlist
  await page.goto('https://demowebshop.tricentis.com/fiction-ex');
  await page.click('.product-essential .add-to-wishlist-button');
  await page.waitForSelector('#bar-notification');
  
  // Go to wishlist
  await page.goto('https://demowebshop.tricentis.com/wishlist');
  
  // Click checkbox and click Add to cart button
  await page.check('input[name="addtocart"]');
  
  // Verify it is checked
  const isChecked = await page.isChecked('input[name="addtocart"]');
  console.log('CHECKBOX IS CHECKED:', isChecked);
  
  await page.click('input[name="addtocartbutton"]');
  await page.waitForNavigation().catch(() => {});
  
  console.log('URL AFTER CLICK:', page.url());

  await browser.close();
})();
