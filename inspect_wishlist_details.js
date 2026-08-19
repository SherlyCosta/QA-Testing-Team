const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://demowebshop.tricentis.com/fiction-ex');
  
  const matches = await page.evaluate(() => {
    return {
      cssSelectorValue: !!document.querySelector('.product-essential input[value="Add to wishlist"]'),
      classAddButton: !!document.querySelector('.add-to-wishlist-button'),
      outerHtml: document.querySelector('input[value="Add to wishlist"]')?.outerHTML || 'None'
    };
  });
  console.log('SELECTOR MATCHES:', matches);

  await browser.close();
})();
