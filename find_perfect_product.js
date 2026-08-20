const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Scrape some popular category URLs
  const urls = [
    'https://demowebshop.tricentis.com/books',
    'https://demowebshop.tricentis.com/apparel-shoes',
    'https://demowebshop.tricentis.com/digital-downloads',
    'https://demowebshop.tricentis.com/jewelry'
  ];
  
  const allProductUrls = [];
  for (const url of urls) {
    await page.goto(url);
    const productHrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-item .product-title a')).map(el => el.getAttribute('href'));
    });
    allProductUrls.push(...productHrefs);
  }
  
  // Deduplicate URLs
  const uniqueUrls = [...new Set(allProductUrls)];
  console.log(`Found ${uniqueUrls.length} unique products to check.`);
  
  for (const href of uniqueUrls) {
    await page.goto('https://demowebshop.tricentis.com' + href);
    const result = await page.evaluate(() => {
      const hasWishlist = !!document.querySelector('input[value="Add to wishlist"]');
      const hasCart = !!document.querySelector('.product-essential input[value="Add to cart"]');
      const title = document.querySelector('.product-name h1')?.textContent?.trim();
      const price = document.querySelector('.product-essential [class*="price-value-"]')?.textContent?.trim();
      return { title, price, hasWishlist, hasCart };
    });
    
    if (result.hasWishlist && result.hasCart) {
      console.log(`FOUND PERFECT PRODUCT: "${result.title}", Price: "${result.price}", URL: "${href}"`);
    }
  }

  await browser.close();
})();
