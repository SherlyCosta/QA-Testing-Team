const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://demowebshop.tricentis.com/health-book');
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="button"]')).map(el => ({
      value: el.value,
      id: el.id,
      className: el.className
    }));
  });
  console.log('HEALTH BOOK BUTTONS:', buttons);

  await browser.close();
})();
