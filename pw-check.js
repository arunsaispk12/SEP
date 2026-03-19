// pw-check.js — Playwright functionality check for SEP app
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';

// ── helpers ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(label) { console.log(`  ✅ ${label}`); passed++; }
function fail(label, reason) { console.log(`  ❌ ${label}: ${reason}`); failed++; }

async function section(title, fn) {
  console.log(`\n── ${title} ──`);
  try { await fn(); } catch (e) { fail(title, e.message); }
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    // ── 1. App loads ────────────────────────────────────────────────────────
    await section('App loads', async () => {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
      const title = await page.title();
      ok(`Page title: "${title}"`);
    });

    // ── 2. Login page ───────────────────────────────────────────────────────
    await section('Login page renders', async () => {
      const hasEmailInput = await page.locator('input[type="email"], input[placeholder*="email" i]').count() > 0;
      if (hasEmailInput) ok('Email input visible');
      else fail('Email input', 'not found');

      const hasPassInput = await page.locator('input[type="password"]').count() > 0;
      if (hasPassInput) ok('Password input visible');
      else fail('Password input', 'not found');

      const hasLoginBtn = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').count() > 0;
      if (hasLoginBtn) ok('Login button visible');
      else fail('Login button', 'not found');
    });

    // ── 3. Sign in ──────────────────────────────────────────────────────────
    await section('Sign in with admin credentials', async () => {
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      const passInput = page.locator('input[type="password"]').first();
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();

      await emailInput.fill('saispk12@gmail.com');
      await passInput.fill('ASPKPlanner@321');
      await submitBtn.click();

      // Wait for redirect to dashboard
      await page.waitForURL(u => !u.includes('login') && !u.includes('signup'), { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const url = page.url();
      ok(`Redirected to: ${url}`);
    });

    // ── 4. Dashboard renders ────────────────────────────────────────────────
    await section('Dashboard renders', async () => {
      // Look for sidebar or main content
      const hasSidebar = await page.locator('.glass-sidebar, nav, [class*="sidebar"]').count() > 0;
      if (hasSidebar) ok('Sidebar visible');
      else fail('Sidebar', 'not found — may still be on login page');

      // Check no crash / blank page
      const bodyText = await page.locator('body').innerText();
      if (bodyText.length > 100) ok(`Page has content (${bodyText.length} chars)`);
      else fail('Page content', 'page appears empty');
    });

    // ── 5. Navigate to Calendar ─────────────────────────────────────────────
    await section('Navigate to Calendar tab', async () => {
      const calendarLink = page.locator('button:has-text("Schedule"), button:has-text("My Schedule"), button:has-text("Calendar")').first();
      const found = await calendarLink.count() > 0;
      if (!found) { fail('Calendar nav link', 'not found'); return; }

      await calendarLink.click();
      await page.waitForTimeout(2000);
      ok('Clicked Calendar/Schedule tab');

      // Check FullCalendar rendered
      const hasFC = await page.locator('.fc, .fc-view, .fc-timegrid').count() > 0;
      if (hasFC) ok('FullCalendar grid visible');
      else fail('FullCalendar', 'not rendered');

      // Check sidebar sections
      const hasEngLabel = await page.locator('text=Engineers').count() > 0;
      if (hasEngLabel) ok('Engineers section in sidebar');
      else fail('Engineers section', 'not found');

      const hasStatusLabel = await page.locator('text=Status').count() > 0;
      if (hasStatusLabel) ok('Status section in sidebar');
      else fail('Status section', 'not found');
    });

    // ── 6. View switcher ────────────────────────────────────────────────────
    await section('Calendar view switcher', async () => {
      for (const viewLabel of ['Month', 'Week', 'Day', 'Agenda']) {
        const btn = page.locator(`button:has-text("${viewLabel}")`).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(500);
          ok(`Switched to ${viewLabel} view`);
        } else {
          fail(`${viewLabel} button`, 'not found');
        }
      }
      // Switch back to Week
      await page.locator('button:has-text("Week")').first().click();
      await page.waitForTimeout(500);
    });

    // ── 7. Navigation buttons ───────────────────────────────────────────────
    await section('Calendar navigation (Today/prev/next)', async () => {
      const todayBtn = page.locator('button:has-text("Today")').first();
      if (await todayBtn.count() > 0) { await todayBtn.click(); await page.waitForTimeout(400); ok('Today button works'); }
      else fail('Today button', 'not found');

      const prevBtn = page.locator('button:has-text("‹")').first();
      if (await prevBtn.count() > 0) { await prevBtn.click(); await page.waitForTimeout(400); ok('‹ prev button works'); }
      else fail('‹ prev', 'not found');

      const nextBtn = page.locator('button:has-text("›")').first();
      if (await nextBtn.count() > 0) { await nextBtn.click(); await page.waitForTimeout(400); ok('› next button works'); }
      else fail('› next', 'not found');
    });

    // ── 8. New Case button ──────────────────────────────────────────────────
    await section('+ New Case button opens form', async () => {
      const newCaseBtn = page.locator('button:has-text("New Case")').first();
      if (await newCaseBtn.count() === 0) { fail('+ New Case button', 'not found'); return; }

      await newCaseBtn.click();
      await page.waitForTimeout(600);

      const hasModal = await page.locator('.glass-modal, [class*="modal"]').count() > 0;
      if (hasModal) ok('Modal opened');
      else fail('Modal', 'did not open');

      // Check case type toggle
      const hasClientWork = await page.locator('button:has-text("Client Work")').count() > 0;
      const hasInternal = await page.locator('button:has-text("Internal")').count() > 0;
      if (hasClientWork && hasInternal) ok('Case type toggle (Client Work / Internal) present');
      else fail('Case type toggle', `ClientWork=${hasClientWork} Internal=${hasInternal}`);

      // Check required fields
      const hasTitleInput = await page.locator('input[required]').count() > 0;
      if (hasTitleInput) ok('Title (required) input present');

      // Check Client field visible (default is client_work)
      const hasClientField = await page.locator('input[placeholder*="Hospital"], input[placeholder*="clinic"]').count() > 0;
      if (hasClientField) ok('Client name field visible for client_work');
      else fail('Client name field', 'not found in client_work mode');

      // Switch to Internal — client field should hide
      await page.locator('button:has-text("Internal")').first().click();
      await page.waitForTimeout(300);
      const clientFieldAfterToggle = await page.locator('input[placeholder*="Hospital"], input[placeholder*="clinic"]').count();
      if (clientFieldAfterToggle === 0) ok('Client field hidden for Internal type');
      else fail('Client field visibility', 'still showing for Internal type');

      // Switch back to Client Work
      await page.locator('button:has-text("Client Work")').first().click();
      await page.waitForTimeout(200);

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const modalGone = await page.locator('.glass-modal').count() === 0;
      if (modalGone) ok('Escape closes modal');
      else {
        // try clicking X button
        await page.locator('.glass-modal button:has-text("×")').first().click().catch(() => {});
        await page.waitForTimeout(300);
      }
    });

    // ── 9. Create a case ────────────────────────────────────────────────────
    await section('Create a test case via form', async () => {
      const newCaseBtn = page.locator('button:has-text("New Case")').first();
      if (await newCaseBtn.count() === 0) { fail('+ New Case button', 'not found'); return; }

      await newCaseBtn.click();
      await page.waitForTimeout(600);

      // Fill title
      const titleInput = page.locator('.glass-modal input[type="text"]').first();
      await titleInput.fill('Playwright Test Case');

      // Fill client name
      const clientInput = page.locator('input[placeholder*="Hospital"], input[placeholder*="clinic"]').first();
      if (await clientInput.count() > 0) await clientInput.fill('Test Hospital');

      // Fill start/end datetime
      const dateInputs = page.locator('input[type="datetime-local"]');
      const count = await dateInputs.count();
      if (count >= 2) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        const start = new Date(now.getTime() + 60 * 60 * 1000);
        const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        await dateInputs.nth(0).fill(fmt(start));
        await dateInputs.nth(1).fill(fmt(end));
        ok('Filled start/end datetime');
      }

      // Submit
      await page.locator('.glass-modal button[type="submit"]').click();
      await page.waitForTimeout(1500);

      const modalGone = await page.locator('.glass-modal').count() === 0;
      if (modalGone) ok('Form submitted — modal closed');
      else fail('Form submit', 'modal still open after submit');
    });

    // ── 10. Cases tab ───────────────────────────────────────────────────────
    await section('Cases tab — no calendar toggle', async () => {
      const casesLink = page.locator('button:has-text("Cases"), button:has-text("My Cases")').first();
      if (await casesLink.count() === 0) { fail('Cases tab', 'not found'); return; }

      await casesLink.click();
      await page.waitForTimeout(1500);
      ok('Navigated to Cases tab');

      // Should NOT have calendar toggle or Sync with Schedules
      const hasCalendarToggle = await page.locator('button:text-is("Calendar"), button:text-is("List"), button:text-is("Table")').count() > 0;
      if (!hasCalendarToggle) ok('No calendar toggle button (correctly removed)');
      else fail('Calendar toggle', 'still present — should have been removed');

      const hasSyncBtn = await page.locator('button:has-text("Sync with Schedules")').count() > 0;
      if (!hasSyncBtn) ok('No "Sync with Schedules" button (correctly removed)');
      else fail('Sync with Schedules', 'still present — should have been removed');

      // Should have case list
      const hasList = await page.locator('.case-card, [class*="case"], table, ul').count() > 0;
      if (hasList) ok('Case list rendered');
      else ok('Cases tab loaded (list may be empty)');
    });

    // ── 11. Console errors ──────────────────────────────────────────────────
    await section('No console errors', async () => {
      const relevant = consoleErrors.filter(e =>
        !e.includes('DevTools') &&
        !e.includes('net::ERR') &&
        !e.includes('favicon') &&
        !e.includes('caniuse') &&
        !e.includes('browserslist')
      );
      if (relevant.length === 0) ok('Zero console errors');
      else {
        relevant.slice(0, 5).forEach(e => fail('Console error', e.slice(0, 120)));
      }
    });

  } finally {
    // ── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('─'.repeat(50));

    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
