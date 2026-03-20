const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('saispk12@gmail.com');
  await page.locator('input[type="password"]').fill('ASPKPlanner@321');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(4000);

  console.log('URL after login:', page.url());

  // Find admin/user management nav
  const navTexts = await page.locator('nav button, nav a, [class*="sidebar"] button, [class*="sidebar"] a').allInnerTexts();
  console.log('\nNav items:', navTexts.filter(t => t.trim()).slice(0, 20));

  // Try clicking admin or user management
  const adminBtn = page.locator('button, a').filter({ hasText: /admin|user management|settings/i }).first();
  if (await adminBtn.count() > 0) {
    console.log('\nFound admin/settings nav, clicking...');
    await adminBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'pw-invite-check-1.png' });
  console.log('\nPage body snippet:', (await page.locator('body').innerText()).slice(0, 400));

  // Look for "Invite User" button
  const inviteBtn = page.locator('button').filter({ hasText: /invite user/i });
  console.log('\nInvite User buttons found:', await inviteBtn.count());

  if (await inviteBtn.count() > 0) {
    await inviteBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'pw-invite-check-2.png' });
    const modalText = await page.locator('.modal, [class*="modal"]').first().innerText().catch(() => 'no modal');
    console.log('Invite modal content:', modalText.slice(0, 300));
  }

  // Check /accept-invite route
  console.log('\nNavigating to /accept-invite...');
  await page.goto('http://localhost:3000/accept-invite', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'pw-invite-check-3.png' });
  console.log('URL at /accept-invite:', page.url());
  console.log('Page content:', (await page.locator('body').innerText()).slice(0, 300));

  await browser.close();
  console.log('\nScreenshots: pw-invite-check-1.png, pw-invite-check-2.png, pw-invite-check-3.png');
})();
