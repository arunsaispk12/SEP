const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let passed = 0;
  let failed = 0;

  function pass(msg) { console.log(`  ✅ PASS: ${msg}`); passed++; }
  function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); failed++; }

  try {
    // ── Login ──────────────────────────────────────────────────────────────
    console.log('\n[1] Login');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill('saispk12@gmail.com');
    await page.locator('input[type="password"]').fill('ASPKPlanner@321');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    const url = page.url();
    if (!url.includes('login') && !url.includes('auth')) {
      pass('Logged in successfully');
    } else {
      fail(`Login failed — still at: ${url}`);
    }

    // ── Navigate to Case Manager ───────────────────────────────────────────
    console.log('\n[2] Navigate to Case Manager');
    const caseLink = page.locator('text=/case/i').first();
    const caseLinkCount = await caseLink.count();
    if (caseLinkCount > 0) {
      await caseLink.click();
      await page.waitForTimeout(2000);
      pass('Navigated to Case Manager');
    } else {
      fail('Case Manager link not found in nav');
    }

    // ── Open Add New Case modal ────────────────────────────────────────────
    console.log('\n[3] Open Add New Case modal');
    const addBtn = page.locator('button:has-text("Add New Case")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      pass('Clicked Add New Case button');
    } else {
      fail('"Add New Case" button not found');
    }

    const modal = page.locator('.modal');
    if (await modal.count() > 0) {
      pass('Modal opened');
    } else {
      fail('Modal did not open');
    }

    // ── Verify title field is absent ───────────────────────────────────────
    console.log('\n[4] Verify Case Title field is removed');
    const titleLabel = modal.locator('label:has-text("Case Title")');
    if (await titleLabel.count() === 0) {
      pass('Case Title field correctly absent from form');
    } else {
      fail('Case Title field still present in form');
    }

    // ── Fill in the form ───────────────────────────────────────────────────
    console.log('\n[5] Fill form and submit');
    const clientInput = modal.locator('input[list="clients-list"]');
    if (await clientInput.count() > 0) {
      await clientInput.fill('Test Hospital E2E');
      pass('Filled client name');
    } else {
      fail('Client input not found');
    }

    const descArea = modal.locator('textarea');
    if (await descArea.count() > 0) {
      await descArea.fill('E2E test case description');
      pass('Filled description');
    } else {
      fail('Description textarea not found');
    }

    const locationSelect = modal.locator('select').first();
    const locationOptions = await locationSelect.locator('option').allInnerTexts();
    const validLocation = locationOptions.find(o => o.trim() && o !== 'Select Location');
    if (validLocation) {
      await locationSelect.selectOption({ label: validLocation });
      pass(`Selected location: ${validLocation}`);
    } else {
      fail('No location options available');
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Modal should close on success
    const modalAfter = page.locator('.modal');
    if (await modalAfter.count() === 0) {
      pass('Modal closed after submit — case created');
    } else {
      fail('Modal still open after submit — creation may have failed');
    }

    // Check for success toast
    const toast = page.locator('[class*="toast"], [role="status"], [aria-live]');
    if (await toast.count() > 0) {
      const toastText = await toast.first().innerText().catch(() => '');
      pass(`Toast appeared: "${toastText.trim().slice(0, 60)}"`);
    }

    // Check case appears in list
    const caseCards = page.locator('.case-card');
    const count = await caseCards.count();
    if (count > 0) {
      pass(`Case list has ${count} case(s) visible`);
    } else {
      fail('No case cards visible after creation');
    }

  } catch (err) {
    console.error('\nUnexpected error:', err.message);
    failed++;
  }

  await page.screenshot({ path: 'pw-case-creation-result.png', fullPage: false });
  await browser.close();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('Screenshot saved: pw-case-creation-result.png');
  process.exit(failed > 0 ? 1 : 0);
})();
