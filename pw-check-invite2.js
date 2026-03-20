const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('saispk12@gmail.com');
  await page.locator('input[type="password"]').fill('ASPKPlanner@321');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(4000);

  // Go to Admin Panel
  await page.locator('button, a').filter({ hasText: /admin panel/i }).first().click();
  await page.waitForTimeout(1500);

  // Click User Management tab
  const umTab = page.locator('button, [role="tab"]').filter({ hasText: /user management/i });
  console.log('User Management tab found:', await umTab.count());
  if (await umTab.count() > 0) {
    await umTab.first().click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'pw-invite-um.png' });

  // Now look for Invite User
  const inviteBtn = page.locator('button').filter({ hasText: /invite/i });
  console.log('Invite buttons:', await inviteBtn.count());
  const btns = await page.locator('button').allInnerTexts();
  console.log('All buttons:', btns.filter(t => t.trim()).slice(0, 30));

  if (await inviteBtn.count() > 0) {
    await inviteBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'pw-invite-modal.png' });
    const modal = page.locator('.modal, [class*="modal"], [class*="overlay"]').first();
    console.log('Modal text:', (await modal.innerText().catch(() => 'no modal')).slice(0, 500));
  }

  await browser.close();
})();
