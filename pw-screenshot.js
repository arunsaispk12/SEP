const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'pw-login.png', fullPage: false });
  console.log('Screenshot saved: pw-login.png');
  console.log('Page title:', await page.title());
  console.log('Body text (first 300):', (await page.locator('body').innerText()).slice(0, 300));
  await browser.close();
})();
