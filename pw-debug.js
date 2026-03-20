const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('saispk12@gmail.com');
  await page.locator('input[type="password"]').fill('ASPKPlanner@321');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  // Screenshot after login
  await page.screenshot({ path: 'pw-dashboard.png', fullPage: false });
  console.log('\n=== AFTER LOGIN ===');
  console.log('URL:', page.url());
  console.log('Body (600):', (await page.locator('body').innerText()).slice(0, 600));

  // Dump all visible nav/button text
  console.log('\n=== ALL BUTTONS ===');
  const buttons = await page.locator('button, a, [role="button"]').allInnerTexts();
  buttons.slice(0, 30).forEach((t, i) => { if (t.trim()) console.log(`  [${i}] "${t.trim().slice(0, 60)}"`); });

  // Dump sidebar links
  console.log('\n=== SIDEBAR TEXT ===');
  const sidebarEls = await page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]').allInnerTexts();
  sidebarEls.forEach((t, i) => console.log(`  [${i}] "${t.slice(0, 200)}"`));

  // Try clicking calendar/schedule tab
  console.log('\n=== TRYING TO CLICK CALENDAR TAB ===');
  const calBtn = page.locator('text=/schedule|calendar/i').first();
  const calCount = await calBtn.count();
  console.log('Calendar/Schedule elements found:', calCount);
  if (calCount > 0) {
    const txt = await calBtn.innerText();
    console.log('Text:', txt);
    await calBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'pw-calendar.png', fullPage: false });
    console.log('\nAfter calendar click:');
    console.log('URL:', page.url());
    console.log('Has .fc:', await page.locator('.fc').count());
    console.log('Has gcal-layout:', await page.locator('.gcal-layout').count());
    const btns = await page.locator('button').allInnerTexts();
    console.log('Buttons after nav:', btns.slice(0, 20).filter(t => t.trim()));
  }

  await browser.close();
})();
