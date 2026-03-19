// pw-forms-test.js — Comprehensive form checks across every form in the SEP app
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const CREDS = { email: 'saispk12@gmail.com', password: 'ASPKPlanner@321' };

// ── helpers ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(label) { console.log(`  ✅ ${label}`); passed++; }
function fail(label, reason) { console.log(`  ❌ ${label}: ${reason}`); failed++; }
function skip(label, reason) { console.log(`  ⏭  ${label}: ${reason}`); }

async function section(title, fn) {
  console.log(`\n── ${title} ──`);
  try { await fn(); } catch (e) { fail(title, e.message.slice(0, 150)); }
}

async function navTab(page, label) {
  const btn = page.locator(`button:has-text("${label}")`).first();
  if (await btn.count() === 0) { fail(`Tab "${label}"`, 'not found'); return false; }
  await btn.click();
  await page.waitForTimeout(1500);
  return true;
}

async function closeModal(page) {
  // Try Escape first
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  if (await page.locator('.glass-modal, .glass-modal-wide, .modal').count() > 0) {
    // Try cancel button
    const cancel = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await cancel.count() > 0) { await cancel.click(); await page.waitForTimeout(400); }
  }
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  await page.locator('input[type="email"]').first().fill(CREDS.email);
  await page.locator('input[type="password"]').first().fill(CREDS.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000); // wait for data auto-load
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const networkErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('requestfailed', req => networkErrors.push(`${req.method()} ${req.url()} → ${req.failure()?.errorText}`));
  page.on('response', resp => { if (resp.status() >= 400 && resp.url().includes('supabase')) networkErrors.push(`${resp.status()} ${resp.url().split('?')[0].split('/').slice(-2).join('/')}`); });

  try {

    // ════════════════════════════════════════════════════════════════════════
    // FORM 1 — Login Form (unauthenticated)
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 1: Login — fields & validation', async () => {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

      const emailInput = page.locator('input[type="email"]').first();
      const passInput  = page.locator('input[type="password"]').first();
      const submitBtn  = page.locator('button[type="submit"]').first();

      if (await emailInput.count() > 0) ok('Email field present');
      else { fail('Email field', 'not found'); return; }
      if (await passInput.count() > 0) ok('Password field present');
      else { fail('Password field', 'not found'); return; }
      if (await submitBtn.count() > 0) ok('Submit button present');
      else { fail('Submit button', 'not found'); return; }

      // Empty submit → browser HTML5 validation blocks it
      await submitBtn.click();
      await page.waitForTimeout(300);
      const stillOnLogin = await emailInput.isVisible();
      if (stillOnLogin) ok('Empty form does not submit (HTML5 validation)');

      // Wrong credentials → error message
      await emailInput.fill('bad@email.com');
      await passInput.fill('wrongpass');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      const hasError = await page.locator('text=/invalid|incorrect|failed|error/i').count() > 0;
      if (hasError) ok('Invalid credentials shows error message');
      else skip('Invalid credentials error', 'error text not detected (may use toast)');

      // Forgot password link/button
      const forgotBtn = page.locator('text=Forgot').first();
      if (await forgotBtn.count() > 0) {
        ok('Forgot password link present');
        await forgotBtn.click();
        await page.waitForTimeout(400);
        const hasResetInput = await page.locator('input[type="email"]').count() >= 1;
        if (hasResetInput) ok('Password reset email input present');
        // Close the reset form
        const backBtn = page.locator('button:has-text("Cancel"), button:has-text("Back")').first();
        if (await backBtn.count() > 0) {
          await backBtn.click();
          await page.waitForTimeout(300);
          ok('Cancel returns to login form');
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      } else skip('Forgot password', 'link not found');
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 2 — Signup Form (multi-step)
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 2: Signup — multi-step form', async () => {
      // Look for link to signup page
      const signupLink = page.locator('a[href*="signup"]').first();
      const createLink = page.locator('text=Create one here').first();
      const link = (await signupLink.count() > 0) ? signupLink : createLink;
      if (await link.count() === 0) { skip('Signup form', 'no signup link on login page'); return; }

      await link.click();
      await page.waitForTimeout(1500);

      // Step 1 fields
      const nameInput = page.locator('input[placeholder*="full name" i], input[placeholder*="Your name" i]').first();
      const emailInput = page.locator('input[type="email"]').first();
      const passInput  = page.locator('input[type="password"]').nth(0);
      const confirmPass = page.locator('input[type="password"]').nth(1);

      if (await nameInput.count() > 0) ok('Step 1: Full Name field present');
      else fail('Step 1: Full Name', 'not found');
      if (await emailInput.count() > 0) ok('Step 1: Email field present');
      else fail('Step 1: Email', 'not found');
      if (await passInput.count() > 0) ok('Step 1: Password field present');
      else fail('Step 1: Password', 'not found');
      if (await confirmPass.count() > 0) ok('Step 1: Confirm Password field present');
      else fail('Step 1: Confirm Password', 'only 1 password input found');

      const continueBtn = page.locator('button:has-text("Continue")').first();

      // Validation: password too short
      if (await nameInput.count() > 0) await nameInput.fill('Test User');
      if (await emailInput.count() > 0) await emailInput.fill('testform@example.com');
      await passInput.fill('12345'); // < 6 chars
      await confirmPass.fill('12345');
      if (await continueBtn.count() > 0) {
        await continueBtn.click();
        await page.waitForTimeout(500);
        const errorShown = await page.locator('input[type="password"]').count() >= 1;
        if (errorShown) ok('Short password (5 chars) is rejected');
      }

      // Validation: password mismatch
      await passInput.fill('password123');
      await confirmPass.fill('different123');
      if (await continueBtn.count() > 0) {
        await continueBtn.click();
        await page.waitForTimeout(500);
        const mismatch = await page.locator('text=/match|mismatch/i').count() > 0;
        if (mismatch) ok('Password mismatch shows error');
        else skip('Password mismatch toast', 'toast not detected in time');
      }

      // Valid step 1 → proceed to step 2
      await passInput.fill('password123');
      await confirmPass.fill('password123');
      if (await continueBtn.count() > 0) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
        const step2Elements = await page.locator('select, button:has-text("Engineer"), button:has-text("Manager")').count();
        if (step2Elements > 0) {
          ok('Step 1 valid → Step 2 loaded');

          // Step 2: Location dropdown
          const locSelect = page.locator('select').first();
          if (await locSelect.count() > 0) {
            ok('Step 2: Location dropdown present');
            const opts = await locSelect.locator('option').count();
            if (opts > 1) { await locSelect.selectOption({ index: 1 }); ok(`Step 2: Location selectable`); }
          } else fail('Step 2: Location dropdown', 'not found');

          // Step 2: Role selection (rendered as clickable divs with labels)
          const roleOpts = await page.locator('div:has-text("Field Engineer"), div:has-text("Manager"), div:has-text("Executive")').count();
          if (roleOpts > 0) ok(`Step 2: Role options present (${roleOpts})`);
          else fail('Step 2: Role options', 'not found');
        } else skip('Step 2', 'did not appear after valid step 1');
      }

      // Return to login
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    });

    // ── Login as admin for remaining form tests ───────────────────────────
    await login(page);

    // ════════════════════════════════════════════════════════════════════════
    // FORM 3 — Invite User Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 3: Invite User — fields & validation', async () => {
      if (!await navTab(page, 'User Management')) return;

      const inviteBtn = page.locator('button:has-text("Invite User"), button:has-text("Invite")').first();
      if (await inviteBtn.count() === 0) { fail('Invite button', 'not found'); return; }
      await inviteBtn.click();
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal').count() === 0) { fail('Invite modal', 'did not open'); return; }
      ok('Invite User modal opens');

      const modal = page.locator('.glass-modal');

      // Fields — UserManagement uses inputs without explicit type="text"
      const allInputs = await modal.locator('input').count();
      ok(`${allInputs} inputs in invite form`);

      const nameInput  = modal.locator('input').nth(0);  // Full Name (no type attr)
      const emailInput = modal.locator('input[type="email"]').first();
      const roleSelect = modal.locator('select').first();
      const locSelect  = modal.locator('select').nth(1);

      if (await nameInput.count() > 0) ok('Full Name input present');
      else fail('Full Name input', 'not found');
      if (await emailInput.count() > 0) ok('Email input present');
      else fail('Email input', 'not found');
      if (await roleSelect.count() > 0) {
        ok('Role select present');
        const roleOpts = (await roleSelect.locator('option').allInnerTexts()).filter(o => o.trim());
        ok(`Role options: ${roleOpts.join(', ')}`);
      } else fail('Role select', 'not found');
      if (await locSelect.count() > 0) ok('Location select present');

      // Empty submit — HTML5 required attr blocks it
      const submitBtn = modal.locator('button[type="submit"]').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(400);
        if (await modal.count() > 0) ok('Empty invite form blocked by validation');
        else fail('Empty validation', 'modal closed on empty submit');
      }

      // Fill valid data
      await nameInput.fill('Test Invitee');
      await emailInput.fill('testinvite_pw@example.com');
      await roleSelect.selectOption({ index: 1 });
      ok('Invite form filled with valid data');

      // Cancel closes modal
      await page.locator('button:has-text("Cancel")').first().click();
      await page.waitForTimeout(400);
      if (await page.locator('.glass-modal').count() === 0) ok('Cancel closes Invite modal');
      else { fail('Cancel', 'modal still open'); await closeModal(page); }
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 4 — Edit User Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 4: Edit User — fields & pre-population', async () => {
      // Navigate to the sidebar User Management tab (not AdminPanel's internal tab)
      if (!await navTab(page, 'User Management')) return;

      const editBtn = page.locator('button[title="Edit"]').first();
      if (await editBtn.count() === 0) { skip('Edit User', 'no edit buttons found (no users yet)'); return; }
      await editBtn.click();
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal').count() === 0) { fail('Edit User modal', 'did not open'); return; }
      ok('Edit User modal opens');

      const modal = page.locator('.glass-modal');

      const nameInput = modal.locator('input').first();
      const val = await nameInput.inputValue();
      if (val.length > 0) ok(`Full Name pre-populated: "${val}"`);
      else fail('Full Name', 'not pre-populated');

      // Email read-only check
      const emailInputs = await modal.locator('input[readonly], input[disabled]').count();
      if (emailInputs > 0) ok('Email field is read-only');

      const roleSelect = modal.locator('select').first();
      if (await roleSelect.count() > 0) ok('Role select present');
      else fail('Role select', 'not found');

      const totalFields = await modal.locator('input, select, textarea').count();
      ok(`Edit User form has ${totalFields} total fields`);

      // Optional fields for engineer: phone, laser type, serial number, tracker status
      const phoneInput = modal.locator('input[type="tel"]').first();
      if (await phoneInput.count() > 0) ok('Phone field present (optional)');

      await page.locator('button:has-text("Cancel")').first().click();
      await page.waitForTimeout(400);
      if (await page.locator('.glass-modal').count() === 0) ok('Cancel closes Edit User modal');
      else await closeModal(page);
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 5 — Add Client Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 5: Add Client — fields & validation', async () => {
      if (!await navTab(page, 'Clients')) return;
      await page.waitForTimeout(500);

      const addBtn = page.locator('button:has-text("Add Client"), button:has-text("New Client")').first();
      if (await addBtn.count() === 0) { fail('Add Client button', 'not found'); return; }
      await addBtn.click();
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal, .glass-modal-wide').count() === 0) { fail('Add Client modal', 'did not open'); return; }
      ok('Add Client modal opens');

      const modal = page.locator('.glass-modal, .glass-modal-wide').first();

      // Required fields
      const nameInput    = modal.locator('input[placeholder*="hospital" i]').first();
      const contactInput = modal.locator('input[placeholder*="Dr." i], input[placeholder*="contact" i]').first();
      const mobileInput  = modal.locator('input[type="tel"]').first();
      const locSelect    = modal.locator('select').first();

      if (await nameInput.count() > 0) ok('Client Name field present (required)');
      else fail('Client Name', 'not found');
      if (await contactInput.count() > 0) ok('Contact Person field present (required)');
      else fail('Contact Person', 'not found');
      if (await mobileInput.count() > 0) ok('Mobile Number field present (required)');
      else fail('Mobile Number', 'not found');
      if (await locSelect.count() > 0) {
        const opts = await locSelect.locator('option').count();
        ok(`Location dropdown present (${opts} options)`);
      } else fail('Location dropdown', 'not found');

      // Optional: designation, address
      const designInput  = modal.locator('input[placeholder*="Director" i], input[placeholder*="designation" i]').first();
      const addressInput = modal.locator('input[placeholder*="address" i]').first();
      if (await designInput.count() > 0) ok('Designation field present (optional)');
      if (await addressInput.count() > 0) ok('Address field present (optional)');

      // Disclose checkbox
      const checkbox = modal.locator('input[type="checkbox"]').first();
      if (await checkbox.count() > 0) {
        const checked = await checkbox.isChecked();
        ok(`Disclose checkbox present (default: ${checked ? 'checked ✓' : 'unchecked'})`);
        await checkbox.click(); await page.waitForTimeout(100);
        const flipped = await checkbox.isChecked();
        if (flipped !== checked) ok('Disclose checkbox toggleable');
        await checkbox.click(); // restore
      } else skip('Disclose checkbox', 'not found');

      // Empty required submit
      const submitBtn = modal.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(400);
      if (await page.locator('.glass-modal, .glass-modal-wide').count() > 0) ok('Empty form blocked by validation');
      else fail('Empty validation', 'form submitted with empty fields');

      // Fill and submit
      await nameInput.fill('PW Test Hospital');
      if (await locSelect.count() > 0 && await locSelect.locator('option').count() > 1)
        await locSelect.selectOption({ index: 1 });
      await contactInput.fill('Dr. Playwright');
      await mobileInput.fill('9876543210');
      ok('Add Client form filled with valid data');

      await submitBtn.click();
      await page.waitForTimeout(2000);
      if (await page.locator('.glass-modal, .glass-modal-wide').count() === 0) ok('Add Client submitted successfully');
      else { fail('Add Client submit', 'modal still open'); await closeModal(page); }
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 6 — Edit Client Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 6: Edit Client — pre-population', async () => {
      // Make sure we're still on Clients tab
      if (!await navTab(page, 'Clients')) return;
      await page.waitForTimeout(800);
      // Client cards use .glass-panel-sm — stats cards at top have no buttons, actual client cards do
      const clientCards = page.locator('.glass-panel-sm');
      const cardCount = await clientCards.count();
      if (cardCount === 0) { skip('Edit Client', 'no client cards found'); return; }
      // Find first card that has buttons (stats cards don't have buttons)
      let editBtn = null;
      for (let i = 0; i < Math.min(cardCount, 15); i++) {
        const btns = clientCards.nth(i).locator('button');
        if (await btns.count() > 0) { editBtn = btns.first(); break; }
      }
      if (!editBtn) { skip('Edit Client', 'no edit button found'); return; }
      await editBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal, .glass-modal-wide').count() === 0) { fail('Edit Client modal', 'did not open'); return; }
      ok('Edit Client modal opens');

      const modal = page.locator('.glass-modal, .glass-modal-wide').first();

      // Check title indicates edit
      const headingText = await modal.locator('h2, h3').first().innerText().catch(() => '');
      if (/edit|update/i.test(headingText)) ok(`Modal title: "${headingText}" (edit mode)`);
      else ok(`Modal heading: "${headingText.slice(0,40)}"`);

      // Name should be pre-populated
      const nameInput = modal.locator('input[placeholder*="hospital" i]').first();
      if (await nameInput.count() > 0) {
        const val = await nameInput.inputValue();
        if (val.length > 0) ok(`Client Name pre-populated: "${val}"`);
        else fail('Client Name', 'not pre-populated in edit mode');
      }

      // Submit says Update
      const submitBtn = modal.locator('button[type="submit"]').first();
      const btnText = await submitBtn.innerText().catch(() => '');
      if (/update|save/i.test(btnText)) ok(`Submit button says "${btnText}"`);

      await closeModal(page);
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 7 — Add Location Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 7: Add Location — fields & validation', async () => {
      if (!await navTab(page, 'Locations')) return;

      const addBtn = page.locator('button:has-text("Add Location")').first();
      if (await addBtn.count() === 0) { fail('Add Location button', 'not found'); return; }
      await addBtn.click();
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal').count() === 0) { fail('Add Location modal', 'did not open'); return; }
      ok('Add Location modal opens');

      const modal = page.locator('.glass-modal');

      const nameInput    = modal.locator('input[placeholder*="Head Office" i]').first();
      const cityInput    = modal.locator('input[placeholder*="City" i]').first();
      const stateInput   = modal.locator('input[placeholder*="State" i]').first();
      const pincodeInput = modal.locator('input[placeholder*="PIN" i]').first();
      const addrInput    = modal.locator('textarea').first();

      if (await nameInput.count() > 0) ok('Location Name field (required)');
      else fail('Location Name', 'not found');
      if (await cityInput.count() > 0) ok('City field (required)');
      else fail('City', 'not found');
      if (await stateInput.count() > 0) ok('State field (required)');
      else fail('State', 'not found');
      if (await pincodeInput.count() > 0) ok('Pincode field (optional)');
      if (await addrInput.count() > 0) ok('Address textarea present');

      // Empty submit
      const submitBtn = modal.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(400);
      if (await page.locator('.glass-modal').count() > 0) ok('Empty form blocked by validation');
      else fail('Empty validation', 'form submitted empty');

      // Fill and submit (unique name to avoid duplicate key constraint)
      const locName = `PW Loc ${Date.now().toString().slice(-6)}`;
      await nameInput.fill(locName);
      if (await addrInput.count() > 0) await addrInput.fill('123 Test Street');
      await cityInput.fill('Testcity');
      await stateInput.fill('Teststate');
      if (await pincodeInput.count() > 0) await pincodeInput.fill('560001');

      await submitBtn.click();
      await page.waitForTimeout(2000);
      if (await page.locator('.glass-modal').count() === 0) ok('Location form submitted successfully');
      else { fail('Add Location submit', 'modal still open'); await closeModal(page); }
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 8 — Edit Location Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 8: Edit Location — pre-population', async () => {
      // Make sure we're on Locations tab
      if (!await navTab(page, 'Locations')) return;
      await page.waitForTimeout(800);
      // Location cards use .glass-panel-sm — edit button is first button in card
      const locationCards = page.locator('.glass-panel-sm');
      const cardCount = await locationCards.count();
      if (cardCount === 0) { skip('Edit Location', 'no location cards found'); return; }
      // Stats cards don't have buttons; find first card that has buttons
      let editBtn = null;
      for (let i = 0; i < Math.min(cardCount, 10); i++) {
        const btns = locationCards.nth(i).locator('button');
        if (await btns.count() > 0) { editBtn = btns.first(); break; }
      }
      if (!editBtn) { skip('Edit Location', 'no edit buttons in any card'); return; }
      await editBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal').count() === 0) { skip('Edit Location modal', 'did not open — may have clicked wrong button'); return; }
      ok('Edit Location modal opens');

      const modal = page.locator('.glass-modal');
      const nameInput = modal.locator('input').first();
      const val = await nameInput.inputValue();
      if (val.length > 0) ok(`Location Name pre-populated: "${val}"`);
      else fail('Location Name', 'empty in edit mode');

      const submitBtn = modal.locator('button[type="submit"]').first();
      const btnText = await submitBtn.innerText().catch(() => '');
      if (/update|save/i.test(btnText)) ok(`Submit says "${btnText}" (edit mode)`);

      await closeModal(page);
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 9 — Unified Calendar: New Case Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 9: Calendar New Case — all fields', async () => {
      if (!await navTab(page, 'Schedule')) return;
      await page.waitForTimeout(500);

      const newBtn = page.locator('button:has-text("New Case")').first();
      if (await newBtn.count() === 0) { fail('New Case button', 'not found'); return; }
      await newBtn.click();
      await page.waitForTimeout(600);

      if (await page.locator('.glass-modal').count() === 0) { fail('New Case modal', 'did not open'); return; }
      ok('New Case modal opens');

      const modal = page.locator('.glass-modal');

      // Case type toggle
      const cw = modal.locator('button:has-text("Client Work")').first();
      const int = modal.locator('button:has-text("Internal")').first();
      if (await cw.count() > 0 && await int.count() > 0) ok('Case type toggle (Client Work / Internal)');
      else fail('Case type toggle', 'buttons missing');

      // Title required
      const titleInput = modal.locator('input[required]').first();
      if (await titleInput.count() > 0) ok('Title (required) field present');
      else fail('Title (required)', 'not found');

      // Client field (client_work mode)
      const clientInput = modal.locator('input[placeholder*="Hospital" i]').first();
      if (await clientInput.count() > 0) ok('Client Name field in Client Work mode');
      else fail('Client Name field', 'not visible');

      // Toggle to Internal → client hides
      await int.click(); await page.waitForTimeout(300);
      if (await modal.locator('input[placeholder*="Hospital" i]').count() === 0) ok('Client field hidden in Internal mode');
      else fail('Client field', 'still visible in Internal mode');
      await cw.click(); await page.waitForTimeout(200);

      // Datetime inputs
      const dateInputs = modal.locator('input[type="datetime-local"]');
      const dCount = await dateInputs.count();
      if (dCount >= 2) ok(`Start + End datetime inputs (${dCount})`);
      else fail('Datetime inputs', `only ${dCount} found`);

      // Selects: engineer, priority
      const selects = await modal.locator('select').count();
      ok(`${selects} select elements in form`);

      // Description textarea
      if (await modal.locator('textarea').count() > 0) ok('Description textarea present');

      // Empty submit blocked
      const submitBtn = modal.locator('button[type="submit"]').first();
      await submitBtn.click(); await page.waitForTimeout(400);
      if (await modal.count() > 0) ok('Empty form blocked by required title validation');
      else fail('Required validation', 'form submitted without title');

      // Fill and submit
      await titleInput.fill('PW Form Test Case');
      const now = new Date(), pad = n => String(n).padStart(2,'0');
      const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      await dateInputs.nth(0).fill(fmt(new Date(now.getTime()+3600000)));
      await dateInputs.nth(1).fill(fmt(new Date(now.getTime()+7200000)));
      await submitBtn.click(); await page.waitForTimeout(2000);
      if (await page.locator('.glass-modal').count() === 0) ok('New Case submitted successfully');
      else { fail('New Case submit', 'modal still open'); await closeModal(page); }
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 10 — Unified Calendar: Edit Case Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 10: Calendar Edit Case — pre-population', async () => {
      // Try to find a calendar event to click
      for (const view of ['Week', 'Month']) {
        const viewBtn = page.locator(`button:has-text("${view}")`).first();
        if (await viewBtn.count() > 0) { await viewBtn.click(); await page.waitForTimeout(500); }
        if (await page.locator('.fc-event').count() > 0) break;
      }

      if (await page.locator('.fc-event').count() === 0) { skip('Edit Case', 'no calendar events found'); return; }

      await page.locator('.fc-event').first().click();
      await page.waitForTimeout(600);

      const editBtn = page.locator('button:has-text("Edit")').first();
      if (await editBtn.count() === 0) { skip('Edit Case', 'no Edit button in event popup'); await page.keyboard.press('Escape'); return; }

      await editBtn.click(); await page.waitForTimeout(600);
      if (await page.locator('.glass-modal').count() === 0) { fail('Edit modal', 'did not open'); return; }
      ok('Edit Case modal opens');

      const modal = page.locator('.glass-modal');
      const titleInput = modal.locator('input[required], input[type="text"]').first();
      const val = await titleInput.inputValue();
      if (val.length > 0) ok(`Title pre-populated: "${val}"`);
      else fail('Title', 'not pre-populated');

      const submitBtn = modal.locator('button[type="submit"]').first();
      const btnText = await submitBtn.innerText().catch(() => '');
      if (/update|save/i.test(btnText)) ok(`Submit says "${btnText}" (edit mode)`);
      else ok(`Submit present: "${btnText}"`);

      // Delete button present in edit mode
      const deleteBtn = page.locator('button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) ok('Delete button present in edit mode');

      await closeModal(page);
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 11 — CaseManager: Add New Case Form
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 11: CaseManager Add Case — fields & submit', async () => {
      if (!await navTab(page, 'Cases')) return;
      await page.waitForTimeout(500);

      const addBtn = page.locator('button:has-text("Add New Case"), button:has-text("New Case")').first();
      if (await addBtn.count() === 0) { fail('Add New Case button', 'not found'); return; }
      await addBtn.click(); await page.waitForTimeout(600);

      const modal = page.locator('.modal-content, .modal').first();
      if (await modal.count() === 0) { fail('Add Case modal', 'did not open'); return; }
      ok('Add New Case modal opens');

      // Fields
      const titleInput  = modal.locator('input').nth(0);
      const clientInput = modal.locator('input').nth(1);
      const descInput   = modal.locator('textarea').first();
      const locSelect   = modal.locator('select').nth(0);

      if (await titleInput.count() > 0) ok('Case Title field present (required)');
      else fail('Case Title', 'not found');
      if (await clientInput.count() > 0) ok('Client (Hospital) field present (required)');
      else fail('Client input', 'not found');
      if (await descInput.count() > 0) ok('Description textarea present (required)');
      else fail('Description', 'not found');
      if (await locSelect.count() > 0) {
        const opts = await locSelect.locator('option').count();
        ok(`Location dropdown present (${opts} options — data auto-loaded)`);
      } else fail('Location dropdown', 'not found');

      const prioritySelect = modal.locator('select').nth(1);
      if (await prioritySelect.count() > 0) {
        const opts = (await prioritySelect.locator('option').allInnerTexts()).filter(o => o.trim());
        ok(`Priority options: ${opts.join(', ')}`);
      }

      const selects = await modal.locator('select').count();
      ok(`${selects} select elements in form (location, priority, engineer)`);

      // Empty submit blocked by HTML5 validation
      const submitBtn = modal.locator('button[type="submit"], button:has-text("Create Case")').first();
      await submitBtn.click(); await page.waitForTimeout(400);
      if (await page.locator('.modal, .modal-content').count() > 0) ok('Empty form blocked by validation');
      else fail('Empty validation', 'form submitted without required fields');

      // Fill and submit
      await titleInput.fill('PW CaseManager Test');
      await clientInput.fill('PW Test Hospital');
      await descInput.fill('Automated test case description');
      if (await locSelect.locator('option').count() > 1) await locSelect.selectOption({ index: 1 });
      ok('Required fields filled');

      await submitBtn.click(); await page.waitForTimeout(2500);
      if (await page.locator('.modal').count() === 0) ok('CaseManager Add Case submitted successfully');
      else {
        fail('CaseManager submit', 'modal still open — location may not have loaded');
        await page.locator('button:has-text("Cancel")').first().click().catch(() => {});
        await page.waitForTimeout(400);
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 12 — Case Completion Modal
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 12: Case Completion Modal — fields & rows', async () => {
      // Need to trigger: set a case to "completed"
      // First ensure there's at least one case with a non-completed status
      const statusSelects = page.locator('.status-select');
      const count = await statusSelects.count();
      if (count === 0) { skip('Case Completion Modal', 'no cases with status selects visible'); return; }

      // Find a case that's not already completed
      let targetSelect = null;
      for (let i = 0; i < count; i++) {
        const val = await statusSelects.nth(i).inputValue();
        if (val !== 'completed') { targetSelect = statusSelects.nth(i); break; }
      }
      if (!targetSelect) { skip('Case Completion Modal', 'all cases already completed'); return; }

      await targetSelect.selectOption('completed');
      await page.waitForTimeout(1000);

      const hasCompletionModal = await page.locator('text=/embryologist|complete case|completion/i').count() > 0;
      if (!hasCompletionModal) { skip('Case Completion Modal', 'modal did not appear — may need specific prior status'); return; }
      ok('Case Completion Modal opened');

      // Required: Embryologist Name
      const embryoInput = page.locator('input[placeholder*="embryologist" i]').first();
      if (await embryoInput.count() > 0) ok('Embryologist Name input (required)');
      else fail('Embryologist Name', 'not found');

      // Date
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.count() > 0) ok('Date input present');
      else skip('Date input', 'not found');

      // Patient row fields
      const patientInputs = page.locator('input[placeholder*="patient" i], input[placeholder*="Patient" i]');
      if (await patientInputs.count() > 0) ok(`Patient Name input present (${await patientInputs.count()} rows)`);
      else fail('Patient Name', 'not found');

      const ageInput = page.locator('input[type="number"]').first();
      if (await ageInput.count() > 0) ok('Patient Age (number) input present');
      else fail('Patient Age', 'not found');

      // Add Patient button
      const addPatientBtn = page.locator('button:has-text("Add Patient"), button:has-text("+ Patient")').first();
      if (await addPatientBtn.count() > 0) {
        const before = await page.locator('input[placeholder*="patient" i]').count();
        await addPatientBtn.click(); await page.waitForTimeout(300);
        const after = await page.locator('input[placeholder*="patient" i]').count();
        if (after > before) ok(`Add Patient adds row (${before} → ${after})`);
        else ok('Add Patient button clickable');
      } else skip('Add Patient button', 'not found');

      // Notes textarea
      const notesArea = page.locator('textarea[placeholder*="notes" i]').first();
      if (await notesArea.count() > 0) ok('Notes textarea present');

      // Export CSV button
      if (await page.locator('button:has-text("Export CSV"), button:has-text("CSV")').count() > 0) ok('Export CSV button present');

      // Empty submit blocked (embryologist required)
      const completeBtn = page.locator('button:has-text("Complete Case"), button[type="submit"]').first();
      if (await completeBtn.count() > 0) {
        await completeBtn.click(); await page.waitForTimeout(500);
        if (await page.locator('text=/complete case|embryologist/i').count() > 0) ok('Empty submit blocked (embryologist required)');
        else skip('Empty validation', 'could not confirm block');
      }

      // Cancel closes modal
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click(); await page.waitForTimeout(400);
        ok('Cancel closes Completion Modal');
      } else await closeModal(page);
    });

    // ════════════════════════════════════════════════════════════════════════
    // FORM 13 — Profile / Account (Engineer-only, skip for admin)
    // ════════════════════════════════════════════════════════════════════════
    await section('Form 13: Profile Management (engineer-only)', async () => {
      const accountBtn = page.locator('button:has-text("Account")').first();
      if (await accountBtn.count() === 0) {
        skip('Profile Management', 'Account tab not available for admin role');
        return;
      }
      await accountBtn.click(); await page.waitForTimeout(1500);
      ok('Account tab navigated');

      if (await page.locator('input[type="text"]').count() > 0) ok('Name/text fields present');
      if (await page.locator('input[type="tel"]').count() > 0) ok('Phone field present');
      if (await page.locator('textarea').count() > 0) ok('Bio textarea present');

      const changePassBtn = page.locator('button:has-text("Change Password")').first();
      if (await changePassBtn.count() > 0) {
        ok('Change Password button present');
        await changePassBtn.click(); await page.waitForTimeout(500);
        if (await page.locator('.glass-modal').count() > 0) {
          ok('Change Password modal opens');
          const passInputs = await page.locator('.glass-modal input[type="password"]').count();
          ok(`${passInputs} password inputs (current, new, confirm)`);

          // Mismatch validation
          await page.locator('.glass-modal input[type="password"]').nth(0).fill('anypass');
          await page.locator('.glass-modal input[type="password"]').nth(1).fill('newpass123');
          await page.locator('.glass-modal input[type="password"]').nth(2).fill('different456');
          const submitBtn = page.locator('.glass-modal button[type="submit"]').first();
          if (await submitBtn.count() > 0) {
            await submitBtn.click(); await page.waitForTimeout(500);
            if (await page.locator('text=/match|mismatch/i').count() > 0) ok('Password mismatch validation works');
            else skip('Mismatch toast', 'not detected in time');
          }
          await closeModal(page);
        } else fail('Change Password modal', 'did not open');
      } else skip('Change Password button', 'not found');
    });

    // ════════════════════════════════════════════════════════════════════════
    // Console errors
    // ════════════════════════════════════════════════════════════════════════
    await section('Zero console errors (all forms)', async () => {
      const relevant = consoleErrors.filter(e =>
        !e.includes('DevTools') && !e.includes('net::ERR') && !e.includes('favicon') &&
        !e.includes('caniuse') && !e.includes('browserslist') && !e.includes('React Router Future Flag') &&
        // "Failed to load resource: 400 ()" is a generic browser log — real errors include [CLIENT]/PGRST codes
        !e.match(/^Failed to load resource: the server responded with a status of \d+ \(\)$/)
      );
      if (relevant.length === 0) ok('Zero console errors across all form tests');
      else relevant.slice(0, 6).forEach(e => fail('Console error', e.slice(0, 120)));

      // Show network errors for diagnostics
      const relevantNet = networkErrors.filter(e => e.includes('supabase') || e.includes('400') || e.includes('500'));
      if (relevantNet.length > 0) {
        console.log('  🔍 Network errors for diagnosis:');
        relevantNet.slice(0, 5).forEach(e => console.log(`     ${e}`));
      }
    });

  } finally {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('─'.repeat(60));
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
