const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://demowebshop.tricentis.com/fiction-ex');
  
  const nesting = await page.evaluate(() => {
    const btn = document.querySelector('#add-to-wishlist-button-78');
    if (!btn) return 'Button not found';
    
    let el = btn;
    const path = [];
    while (el) {
      path.push(el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''));
      el = el.parentElement;
    }
    return path.reverse().join(' > ');
  });
  console.log('NESTING PATH:', nesting);

  await browser.close();
})();
