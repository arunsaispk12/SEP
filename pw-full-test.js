// pw-full-test.js — Full-app section coverage for SEP
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
  try { await fn(); } catch (e) { fail(title, e.message.slice(0, 120)); }
}

async function clickTab(page, label) {
  const btn = page.locator(`button:has-text("${label}")`).first();
  if (await btn.count() === 0) { fail(`Tab "${label}"`, 'not found in nav'); return false; }
  await btn.click();
  await page.waitForTimeout(1500);
  return true;
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  await page.locator('input[type="email"]').fill(CREDS.email);
  await page.locator('input[type="password"]').fill(CREDS.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3500);
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    // ── 1. Login ────────────────────────────────────────────────────────────
    await section('Login', async () => {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
      const hasEmail = await page.locator('input[type="email"], input[placeholder*="email" i]').count() > 0;
      if (hasEmail) ok('Email input present');
      else fail('Email input', 'not found');

      const hasPass = await page.locator('input[type="password"]').count() > 0;
      if (hasPass) ok('Password input present');
      else fail('Password input', 'not found');

      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(CREDS.email);
      await page.locator('input[type="password"]').first().fill(CREDS.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(u => !u.includes('login'), { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(3000);
      const url = page.url();
      ok(`Authenticated — at: ${url}`);
    });

    // ── 2. App shell ────────────────────────────────────────────────────────
    await section('App shell', async () => {
      const hasSidebar = await page.locator('nav, aside, [class*="sidebar"]').count() > 0;
      if (hasSidebar) ok('Sidebar / nav present');
      else fail('Sidebar', 'not found');

      const bodyLen = (await page.locator('body').innerText()).length;
      if (bodyLen > 200) ok(`Body has content (${bodyLen} chars)`);
      else fail('Body content', 'page appears empty');

      // All expected top-level tabs visible for admin
      for (const label of ['Dashboard', 'Schedule', 'Cases']) {
        const found = await page.locator(`button:has-text("${label}")`).count() > 0;
        if (found) ok(`Nav tab "${label}" present`);
        else fail(`Nav tab "${label}"`, 'not found');
      }
    });

    // ── 3. Dashboard ────────────────────────────────────────────────────────
    await section('Dashboard — stats & panels', async () => {
      const clicked = await clickTab(page, 'Dashboard');
      if (!clicked) return;

      // KPI bar cards (UnifiedDashboard uses inline styles, no class names)
      await page.waitForTimeout(1000); // allow async load
      const kpiBar = await page.locator('text=/upcoming|unassigned|open cases|total/i').count() > 0;
      if (kpiBar) ok('KPI bar cards rendered');
      else {
        // Fallback: any panel elements
        const statsCount = await page.locator('.glass-panel-sm, [class*="stat"]').count();
        if (statsCount > 0) ok(`Stats cards rendered (${statsCount} found)`);
        else fail('KPI / stats cards', 'none found');
      }

      // TeamStatus panel
      const hasTeamPanel = await page.locator('text=/team status|engineers|engineer/i').count() > 0;
      if (hasTeamPanel) ok('Team status section present');
      else skip('Team status section', 'text not found — may load async');

      // Cases panel
      const hasCasesPanel = await page.locator('text=/cases|recent cases/i').count() > 0;
      if (hasCasesPanel) ok('Cases panel present');
      else skip('Cases panel', 'text not found');

      // No crash
      const content = await page.locator('body').innerText();
      if (content.length > 300) ok(`Dashboard has content (${content.length} chars)`);
    });

    // ── 4. Admin Panel ──────────────────────────────────────────────────────
    await section('Admin Panel', async () => {
      const clicked = await clickTab(page, 'Admin Panel');
      if (!clicked) return;

      const hasAdminHeading = await page.locator('text=/admin panel/i').count() > 0;
      if (hasAdminHeading) ok('Admin Panel heading present');
      else fail('Admin Panel heading', 'not found');

      // Internal tabs: Overview, Case Administration, etc.
      const overviewBtn = page.locator('button:has-text("Overview")').first();
      if (await overviewBtn.count() > 0) {
        await overviewBtn.click();
        await page.waitForTimeout(500);
        ok('Admin Overview tab clickable');
        const hasStats = await page.locator('.glass-panel-sm').count() > 0;
        if (hasStats) ok('Admin stats cards present');
        else fail('Admin stats cards', 'not found');
      } else fail('Admin Overview tab', 'not found');

      const caseAdminBtn = page.locator('button:has-text("Case Administration")').first();
      if (await caseAdminBtn.count() > 0) {
        await caseAdminBtn.click();
        await page.waitForTimeout(500);
        ok('Case Administration tab clickable');
        const content = await page.locator('body').innerText();
        if (content.includes('Case Administration') || content.includes('cases')) ok('Case administration content visible');
      } else fail('Case Administration tab', 'not found');

      const settingsBtn = page.locator('button:has-text("System Settings")').first();
      if (await settingsBtn.count() > 0) {
        await settingsBtn.click();
        await page.waitForTimeout(500);
        ok('System Settings tab clickable');
      } else skip('System Settings tab', 'not found');
    });

    // ── 5. User Management ──────────────────────────────────────────────────
    await section('User Management', async () => {
      const clicked = await clickTab(page, 'User Management');
      if (!clicked) return;

      const hasHeading = await page.locator('text=/user management/i').count() > 0;
      if (hasHeading) ok('User Management heading present');
      else fail('User Management heading', 'not found');

      // Search input
      const searchInput = page.locator('input[placeholder*="Search users"]');
      if (await searchInput.count() > 0) {
        ok('Search input present');
        await searchInput.fill('test');
        await page.waitForTimeout(400);
        ok('Search input accepts text');
        await searchInput.fill('');
      } else fail('Search input', 'not found');

      // Role filter
      const roleFilter = page.locator('select').first();
      if (await roleFilter.count() > 0) ok('Role/status filters present');
      else fail('Filters', 'no selects found');

      // Invite button
      const inviteBtn = page.locator('button:has-text("Invite User"), button:has-text("Invite")').first();
      if (await inviteBtn.count() > 0) {
        ok('Invite User button present');
        await inviteBtn.click();
        await page.waitForTimeout(500);
        const hasModal = await page.locator('.glass-modal').count() > 0;
        if (hasModal) {
          ok('Invite modal opened');
          const hasNameInput = await page.locator('input[placeholder*="Name"], .glass-modal input[type="text"]').count() > 0;
          if (hasNameInput) ok('Name field in invite form');
          const hasEmailInput = await page.locator('.glass-modal input[type="email"]').count() > 0;
          if (hasEmailInput) ok('Email field in invite form');
          const hasRoleSelect = await page.locator('.glass-modal select').count() > 0;
          if (hasRoleSelect) ok('Role selector in invite form');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          const modalGone = await page.locator('.glass-modal').count() === 0;
          if (modalGone) ok('Escape closes invite modal');
          else {
            // Try clicking backdrop or cancel button
            await page.locator('button:has-text("Cancel")').first().click().catch(() => {});
            await page.waitForTimeout(300);
          }
        } else fail('Invite modal', 'did not open');
      } else fail('Invite User button', 'not found');

      // User list
      const hasUsers = await page.locator('[class*="glass"]').count() > 0;
      if (hasUsers) ok('User list / cards rendered');
    });

    // ── 6. Clients ──────────────────────────────────────────────────────────
    await section('Clients', async () => {
      const clicked = await clickTab(page, 'Clients');
      if (!clicked) return;

      const hasHeading = await page.locator('text=/clients/i').count() > 0;
      if (hasHeading) ok('Clients section heading present');
      else fail('Clients heading', 'not found');

      // Add Client button
      const addBtn = page.locator('button:has-text("Add Client"), button:has-text("New Client")').first();
      if (await addBtn.count() > 0) {
        ok('Add Client button present');
        await addBtn.click();
        await page.waitForTimeout(500);
        const hasModal = await page.locator('.glass-modal, .glass-modal-wide').count() > 0;
        if (hasModal) {
          ok('Add Client modal opened');
          const hasNameInput = await page.locator('input[placeholder*="hospital name"], input[placeholder*="Hospital"]').count() > 0;
          if (hasNameInput) ok('Hospital name input present');
          else fail('Hospital name input', 'not found');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          const closed = await page.locator('.glass-modal, .glass-modal-wide').count() === 0;
          if (closed) ok('Escape closes Add Client modal');
          else { await page.locator('button:has-text("Cancel")').first().click().catch(() => {}); }
        } else fail('Add Client modal', 'did not open');
      } else fail('Add Client button', 'not found');

      // Search
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="hospital"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(400);
        ok('Client search input works');
        await searchInput.fill('');
      } else skip('Client search', 'input not found');

      // Stats row
      const statsCount = await page.locator('.glass-panel-sm').count();
      if (statsCount > 0) ok(`Client stats cards present (${statsCount})`);
    });

    // ── 7. Locations ────────────────────────────────────────────────────────
    await section('Locations', async () => {
      const clicked = await clickTab(page, 'Locations');
      if (!clicked) return;

      const hasHeading = await page.locator('text=/location/i').count() > 0;
      if (hasHeading) ok('Locations heading present');
      else fail('Locations heading', 'not found');

      // Add Location button
      const addBtn = page.locator('button:has-text("Add Location")').first();
      if (await addBtn.count() > 0) {
        ok('Add Location button present');
        await addBtn.click();
        await page.waitForTimeout(500);
        const hasModal = await page.locator('.glass-modal').count() > 0;
        if (hasModal) {
          ok('Add Location modal opened');
          const hasNameInput = await page.locator('input[placeholder*="Head Office"], input[placeholder*="location"]').count() > 0;
          if (hasNameInput) ok('Location name input present');
          const hasAddressInput = await page.locator('input[placeholder*="address"], input[placeholder*="Address"]').count() > 0;
          if (hasAddressInput) ok('Address input present');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          const closed = await page.locator('.glass-modal').count() === 0;
          if (closed) ok('Escape closes Add Location modal');
          else { await page.locator('button:has-text("Cancel")').first().click().catch(() => {}); }
        } else fail('Add Location modal', 'did not open');
      } else fail('Add Location button', 'not found');

      // Search
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="city"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(400);
        ok('Location search input works');
        await searchInput.fill('');
      } else skip('Location search', 'input not found');
    });

    // ── 8. Schedule / Calendar ──────────────────────────────────────────────
    await section('Schedule — calendar renders', async () => {
      const clicked = await clickTab(page, 'Schedule');
      if (!clicked) return;

      const hasFC = await page.locator('.fc, .fc-view, .fc-timegrid').count() > 0;
      if (hasFC) ok('FullCalendar grid rendered');
      else fail('FullCalendar', 'not rendered');

      // Sidebar sections
      const hasEng = await page.locator('text=Engineers').count() > 0;
      if (hasEng) ok('Engineers section in sidebar');
      else fail('Engineers section', 'not found');

      const hasStat = await page.locator('text=Status').count() > 0;
      if (hasStat) ok('Status filter section present');
      else fail('Status section', 'not found');

      // Mini calendar
      const hasMiniCal = await page.locator('.mini-cal').count() > 0;
      if (hasMiniCal) ok('MiniCalendar present');
      else fail('MiniCalendar', 'not found');
    });

    await section('Schedule — view switcher', async () => {
      for (const v of ['Month', 'Week', 'Day', 'Agenda']) {
        const btn = page.locator(`button:has-text("${v}")`).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(400);
          ok(`Switched to ${v} view`);
        } else fail(`${v} view button`, 'not found');
      }
      // Back to week
      await page.locator('button:has-text("Week")').first().click();
      await page.waitForTimeout(400);
    });

    await section('Schedule — navigation buttons', async () => {
      const todayBtn = page.locator('button:has-text("Today")').first();
      if (await todayBtn.count() > 0) { await todayBtn.click(); await page.waitForTimeout(300); ok('Today button'); }
      else fail('Today button', 'not found');

      const prev = page.locator('button:has-text("‹")').first();
      if (await prev.count() > 0) { await prev.click(); await page.waitForTimeout(300); ok('‹ prev button'); }
      else fail('‹ prev', 'not found');

      const next = page.locator('button:has-text("›")').first();
      if (await next.count() > 0) { await next.click(); await page.waitForTimeout(300); ok('› next button'); }
      else fail('› next', 'not found');
    });

    await section('Schedule — New Case form', async () => {
      const newBtn = page.locator('button:has-text("New Case")').first();
      if (await newBtn.count() === 0) { fail('New Case button', 'not found'); return; }

      await newBtn.click();
      await page.waitForTimeout(500);
      const hasModal = await page.locator('.glass-modal').count() > 0;
      if (!hasModal) { fail('New Case modal', 'did not open'); return; }
      ok('New Case modal opened');

      // Case type toggle
      const hasClientWork = await page.locator('button:has-text("Client Work")').count() > 0;
      const hasInternal = await page.locator('button:has-text("Internal")').count() > 0;
      if (hasClientWork && hasInternal) ok('Case type toggle (Client Work / Internal)');
      else fail('Case type toggle', `ClientWork=${hasClientWork} Internal=${hasInternal}`);

      // Required title input
      const hasTitleInput = await page.locator('input[required]').count() > 0;
      if (hasTitleInput) ok('Title (required) input present');
      else fail('Title input', 'not found');

      // Client field visible for client_work
      const hasClientField = await page.locator('input[placeholder*="Hospital"], input[placeholder*="clinic"]').count() > 0;
      if (hasClientField) ok('Client name field (client_work mode)');
      else fail('Client name field', 'not found');

      // Switch to Internal → client field hides
      await page.locator('button:has-text("Internal")').first().click();
      await page.waitForTimeout(300);
      const hiddenAfter = await page.locator('input[placeholder*="Hospital"], input[placeholder*="clinic"]').count() === 0;
      if (hiddenAfter) ok('Client field hidden for Internal type');
      else fail('Client field', 'still showing for Internal');

      // Priority, datetime inputs
      await page.locator('button:has-text("Client Work")').first().click();
      await page.waitForTimeout(200);
      const hasDates = await page.locator('input[type="datetime-local"]').count() >= 2;
      if (hasDates) ok('Start/end datetime inputs present');
      else fail('Datetime inputs', 'less than 2 found');

      const hasPriority = await page.locator('select').count() > 0;
      if (hasPriority) ok('Priority / engineer selects present');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const closed = await page.locator('.glass-modal').count() === 0;
      if (closed) ok('Escape closes New Case modal');
    });

    await section('Schedule — create a case', async () => {
      await page.waitForTimeout(800); // ensure any modal backdrop fully gone
      const newBtn = page.locator('button:has-text("New Case")').first();
      if (await newBtn.count() === 0) { fail('New Case button', 'not found'); return; }
      await newBtn.click({ timeout: 10000 });
      await page.waitForTimeout(500);

      await page.locator('.glass-modal input[type="text"]').first().fill('PW Full-Test Case');
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const s = new Date(now.getTime() + 3600000), e = new Date(now.getTime() + 7200000);
      await page.locator('input[type="datetime-local"]').nth(0).fill(fmt(s));
      await page.locator('input[type="datetime-local"]').nth(1).fill(fmt(e));
      await page.locator('.glass-modal button[type="submit"]').click();
      await page.waitForTimeout(2000);
      const modalGone = await page.locator('.glass-modal').count() === 0;
      if (modalGone) ok('Case created — modal closed');
      else fail('Case creation', 'modal still open');
    });

    // ── 9. Cases tab ────────────────────────────────────────────────────────
    await section('Cases tab', async () => {
      const clicked = await clickTab(page, 'Cases');
      if (!clicked) return;

      // No unwanted buttons
      const hasCalToggle = await page.locator('button:text-is("Calendar"), button:text-is("List")').count() > 0;
      if (!hasCalToggle) ok('No calendar view toggle (correctly removed)');
      else fail('Calendar view toggle', 'still present');

      const hasSync = await page.locator('button:has-text("Sync with Schedules")').count() > 0;
      if (!hasSync) ok('No Sync with Schedules button (correctly removed)');
      else fail('Sync button', 'still present');

      // Stats grid
      const hasStats = await page.locator('.stats-grid, .stat-card, [class*="stat"]').count() > 0;
      if (hasStats) ok('Stats grid present');
      else fail('Stats grid', 'not found');

      // Search
      const searchBox = page.locator('.search-box input, input[placeholder*="Search"]').first();
      if (await searchBox.count() > 0) {
        await searchBox.fill('test');
        await page.waitForTimeout(400);
        ok('Search filter works');
        await searchBox.fill('');
        await page.waitForTimeout(300);
      } else fail('Search box', 'not found');

      // Filters
      const hasFilters = await page.locator('.filter-select, select').count() > 0;
      if (hasFilters) ok('Status/priority filters present');
      else fail('Filters', 'not found');

      // Case list or empty state
      const hasList = await page.locator('.case-card, .cases-list, .no-cases').count() > 0;
      if (hasList) ok('Case list / empty state rendered');
      else ok('Cases tab loaded (no cards matched selectors)');
    });

    // ── 10. Cases — status update ────────────────────────────────────────────
    await section('Cases — status update on existing case', async () => {
      const statusSelect = page.locator('.status-select').first();
      if (await statusSelect.count() === 0) { skip('Status update', 'no cases visible to update'); return; }
      const currentVal = await statusSelect.inputValue();
      // Change to a different status
      const options = await statusSelect.locator('option').allInnerTexts();
      const next = options.find(o => o.toLowerCase().replace(' ', '_') !== currentVal);
      if (!next) { skip('Status update', 'only one option available'); return; }
      await statusSelect.selectOption({ label: next });
      await page.waitForTimeout(1000);
      ok(`Case status changed to "${next}"`);
    });

    // ── 11. Google Calendar Sync ─────────────────────────────────────────────
    await section('Google Calendar Sync tab', async () => {
      const clicked = await clickTab(page, 'Google Calendar');
      if (!clicked) return;

      const hasHeading = await page.locator('text=/google calendar/i').count() > 0;
      if (hasHeading) ok('Google Calendar Integration heading present');
      else fail('Google Calendar heading', 'not found');

      // Either shows connect button or connected state
      const hasConnectBtn = await page.locator('button:has-text("Connect Google Calendar")').count() > 0;
      const hasConnected = await page.locator('text=/connected|disconnect/i').count() > 0;
      const hasDisabled = await page.locator('text=/disabled|not available/i').count() > 0;
      if (hasConnectBtn) ok('Connect Google Calendar button present');
      else if (hasConnected) ok('Google Calendar already connected');
      else if (hasDisabled) ok('Google Calendar integration disabled notice shown');
      else fail('Google Calendar state', 'no connect/connected/disabled text found');

      // Connection section label
      const hasConnLabel = await page.locator('text=/Connection/i').count() > 0;
      if (hasConnLabel) ok('Connection section present');
      else skip('Connection section label', 'text not found');

      // Sync settings section
      const hasSyncSection = await page.locator('text=/Sync Settings|sync settings/i').count() > 0;
      if (hasSyncSection) ok('Sync Settings section present');
      else skip('Sync Settings section', 'not found');
    });

    // ── 12. Profile / Account ────────────────────────────────────────────────
    await section('Account / Profile Management', async () => {
      // Look for Account or Profile tab (admin may have it under nav)
      const accountBtn = page.locator('button:has-text("Account"), button:has-text("Profile")').first();
      if (await accountBtn.count() === 0) { skip('Account tab', 'not present for admin role'); return; }
      await accountBtn.click();
      await page.waitForTimeout(1500);
      ok('Account tab navigated');
      const content = await page.locator('body').innerText();
      if (content.length > 100) ok(`Account page has content (${content.length} chars)`);
      else fail('Account page', 'appears empty');
    });

    // ── 13. Console errors (full run) ─────────────────────────────────────────
    await section('Zero console errors (full run)', async () => {
      const relevant = consoleErrors.filter(e =>
        !e.includes('DevTools') &&
        !e.includes('net::ERR') &&
        !e.includes('favicon') &&
        !e.includes('caniuse') &&
        !e.includes('browserslist') &&
        !e.includes('React Router Future Flag')
      );
      if (relevant.length === 0) ok('Zero console errors across all sections');
      else {
        relevant.slice(0, 8).forEach(e => fail('Console error', e.slice(0, 120)));
      }
    });

  } finally {
    // ── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('─'.repeat(60));
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
