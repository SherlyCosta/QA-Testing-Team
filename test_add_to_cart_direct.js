const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://demowebshop.tricentis.com/fiction-ex');
  
  // Click Add to cart
  await page.click('.product-essential .add-to-cart-button');
  
  // Wait for notification bar
  try {
    await page.waitForSelector('#bar-notification', { timeout: 5000 });
    const notificationText = await page.textContent('#bar-notification');
    console.log('Notification Text:', notificationText.trim());
  } catch (err) {
    console.log('Notification not visible within 5s');
  }
  
  // Check header badge
  const badge = await page.textContent('span.cart-qty');
  console.log('Cart Badge direct:', badge);

  await browser.close();
})();
