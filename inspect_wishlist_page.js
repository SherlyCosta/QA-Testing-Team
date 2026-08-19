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
  
  const outerHtml = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('form input')).map(el => ({
      name: el.getAttribute('name'),
      type: el.getAttribute('type'),
      value: el.getAttribute('value'),
      className: el.className,
      outerHTML: el.outerHTML
    }));
    return JSON.stringify(inputs, null, 2);
  });
  console.log('WISHLIST FORM INPUTS:', outerHtml);

  await browser.close();
})();
