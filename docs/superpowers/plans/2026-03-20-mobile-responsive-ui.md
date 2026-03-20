# Mobile-Responsive UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the entire SEP UI fully responsive and mobile-friendly at 375–430px, preserving the dark glass aesthetic.

**Architecture:** CSS media queries (primary) + minimal JSX edits where inline styles block CSS. Shell changes at ≤768px breakpoint, content component changes at ≤480px breakpoint. No component restructuring or logic changes.

**Tech Stack:** React, CSS (no CSS modules), Tailwind (loaded but not used heavily), Framer Motion, Lucide React

---

## File Map

| File | What Changes |
|------|-------------|
| `src/components/GlassSidebar.jsx` | Width inline style → `min(280px, 85vw)` |
| `src/components/GlassTopBar.jsx` | Remove inline `left: 240` |
| `src/components/LoginPage.js` | Hide left branding panel on mobile, stack layout |
| `src/components/SignupPage.js` | Same as LoginPage |
| `src/components/UnifiedDashboard.js` | Add classNames to inline-styled grids |
| `src/components/dashboard/DashboardKPIBar.jsx` | Add className to 4-col grid |
| `src/components/AdminPanel.js` | Add `admin-layout-grid` className; wrap users table |
| `src/components/UserManagement.js` | Wrap tables in scroll container |
| `src/components/ClientManagement.js` | Wrap tables in scroll container |
| `src/components/LocationManagement.js` | Wrap tables in scroll container |
| `src/index.css` | All `@media (max-width: 480px)` and 768px patches |
| `src/App.css` | Patch existing mobile blocks |

---

## Task 1: GlassSidebar & GlassTopBar — Shell JSX Fixes

**Files:**
- Modify: `src/components/GlassSidebar.jsx:75-92` (sidebar root div width)
- Modify: `src/components/GlassTopBar.jsx:24-44` (topbar left offset)

### Background
`GlassSidebar` has `width: SIDEBAR_W` (= 240) as an inline style. CSS cannot override inline `width` without `!important`, which conflicts with the `transform: translateX` slide animation. Fix: change the inline style value directly.

`GlassTopBar` has `left: 240` inline. CSS already overrides it with `left: 0 !important` at ≤768px, but removing the inline value is cleaner.

- [ ] **Step 1: Fix GlassSidebar width**

In `GlassSidebar.jsx`, find the root `<div>` (line ~81) that has `width: SIDEBAR_W`. Change:
```jsx
// Before (line 81)
width: SIDEBAR_W,

// After
width: 'min(280px, 85vw)',
```
Do NOT remove any other style properties. Only this one property changes.

- [ ] **Step 2: Fix GlassTopBar left offset**

In `GlassTopBar.jsx`, find the root `<div>` inline style object (line ~30). Remove the `left: 240` property entirely:
```jsx
// Before
style={{
  position: 'fixed',
  top: 0,
  left: 240,
  right: 0,
  height: 48,
  // ...
}}

// After
style={{
  position: 'fixed',
  top: 0,
  right: 0,
  height: 48,
  // ...
}}
```
The CSS rule `.glass-topbar { left: 0 !important }` in `index.css` already handles mobile positioning. On desktop, the topbar's effective `left` is controlled by the sidebar width. Without an inline `left`, we need to also add a desktop CSS rule. Add to `src/index.css` (outside any media query):
```css
.glass-topbar {
  left: 240px;
}
@media (max-width: 768px) {
  .glass-topbar { left: 0 !important; }
}
```
*(The `@media (max-width: 768px)` block for topbar already exists in index.css — just ensure the base rule `left: 240px` is added.)*

- [ ] **Step 3: Verify sidebar opens/closes on mobile**

Start the dev server (`npm start`), open browser DevTools, set viewport to 375px wide. Check:
- On load: sidebar is hidden (slides off-screen to the left)
- Click hamburger (☰) in topbar: sidebar slides in from left, width ≈ 280px
- Click a nav item: sidebar closes, content updates
- Click backdrop: sidebar closes

- [ ] **Step 4: Commit**
```bash
git add src/components/GlassSidebar.jsx src/components/GlassTopBar.jsx src/index.css
git commit -m "fix: sidebar width and topbar left offset for mobile"
```

---

## Task 2: Auth Pages — Login & Signup Mobile Layout

**Files:**
- Modify: `src/components/LoginPage.js:104-120` (left branding panel)
- Modify: `src/components/SignupPage.js` (same pattern)
- Modify: `src/index.css` (add auth mobile CSS)

### Background
`LoginPage` has a two-panel layout: left branding panel (`width: 300px, flexShrink: 0`) + right form panel (`flex: 1`). At 375px this renders a 300px panel + a 75px form — completely broken. Fix: hide the left panel on mobile; the right form panel becomes full-width.

- [ ] **Step 1: Add className to LoginPage left panel**

In `LoginPage.js` line ~108, add `className="login-brand-panel"` to the left panel div:
```jsx
// Before
<div style={{ width: 300, flexShrink: 0, padding: '40px 28px', ... }}>

// After
<div className="login-brand-panel" style={{ width: 300, flexShrink: 0, padding: '40px 28px', ... }}>
```

- [ ] **Step 2: Add className to LoginPage outer wrapper**

In `LoginPage.js` line ~105, add `className="login-layout"` to the outer `motion.div`:
```jsx
// Before
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: FONT }}>

// After
<motion.div className="login-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: FONT }}>
```

- [ ] **Step 3: Add mobile CSS for auth pages to index.css**

Append to `src/index.css`:
```css
/* ===== Auth pages mobile ===== */
@media (max-width: 600px) {
  .login-brand-panel {
    display: none !important;
  }
  .login-layout {
    align-items: flex-start;
    padding-top: 40px;
  }
  /* Right panel (flex: 1) becomes full-width naturally */
}
```

- [ ] **Step 4: Apply same pattern to SignupPage**

Read `src/components/SignupPage.js`. Identify the equivalent outer wrapper and left branding panel (if it follows the same two-panel layout). Add:
- `className="login-layout"` to the outer wrapper
- `className="login-brand-panel"` to the left panel

If SignupPage has a different layout (single column), only add padding/width fixes as needed.

- [ ] **Step 5: Verify at 375px**

At 375px viewport:
- Login page shows only the form, centered, full-width
- Inputs are reachable, submit button spans full width
- Signup page is similarly clean

- [ ] **Step 6: Commit**
```bash
git add src/components/LoginPage.js src/components/SignupPage.js src/index.css
git commit -m "fix: hide branding panel on mobile for auth pages"
```

---

## Task 3: UnifiedDashboard — Inline Grid Fixes

**Files:**
- Modify: `src/components/UnifiedDashboard.js:91-100` (loading skeleton grids)
- Modify: `src/components/UnifiedDashboard.js:114` (3-col command center grid)
- Modify: `src/components/UnifiedDashboard.js:135` (2-col gantt + detail grid)
- Modify: `src/components/dashboard/DashboardKPIBar.jsx:14` (4-col KPI grid)
- Modify: `src/index.css` (responsive rules for these classNames)

### Background
`UnifiedDashboard` has three inline grids that cannot be overridden by CSS:
- Loading state: `repeat(4,1fr)` and `1fr 1.5fr 1fr`
- Row 2 (command center): `1fr 1.5fr 1fr`
- Row 3 (gantt + detail): `2.5fr 1fr`

`DashboardKPIBar` has `repeat(4,1fr)` inline.

Fix: add `className` to each grid container, then add responsive CSS.

- [ ] **Step 1: Add classNames to UnifiedDashboard grids**

In `UnifiedDashboard.js`:

Line ~91 (loading state, 4-col skeleton):
```jsx
// Before
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
// After
<div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
```

Line ~94 (loading state, 3-col skeleton):
```jsx
// Before
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 8 }}>
// After
<div className="dashboard-command-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 8 }}>
```

Line ~114 (command center):
```jsx
// Before
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 14 }}>
// After
<div className="dashboard-command-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 14 }}>
```

Line ~135 (gantt + detail):
```jsx
// Before
<div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 14 }}>
// After
<div className="dashboard-gantt-grid" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 14 }}>
```

- [ ] **Step 2: Add className to DashboardKPIBar grid**

In `DashboardKPIBar.jsx` line ~14:
```jsx
// Before
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
// After
<div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
```

- [ ] **Step 3: Add responsive CSS to index.css**

```css
/* ===== Dashboard mobile ===== */
@media (max-width: 768px) {
  .dashboard-kpi-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .dashboard-command-grid {
    grid-template-columns: 1fr !important;
  }
  .dashboard-gantt-grid {
    grid-template-columns: 1fr !important;
  }
}
@media (max-width: 480px) {
  .dashboard-kpi-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px !important;
  }
}
@media (max-width: 360px) {
  .dashboard-kpi-grid {
    grid-template-columns: 1fr !important;
  }
}
```

- [ ] **Step 4: Verify at 375px**

At 375px:
- KPI bar shows 2 cards per row
- Command center panels stack vertically
- Gantt chart stacks above Case Detail

- [ ] **Step 5: Commit**
```bash
git add src/components/UnifiedDashboard.js src/components/dashboard/DashboardKPIBar.jsx src/index.css
git commit -m "fix: dashboard grids responsive at 768px and 480px"
```

---

## Task 4: AdminPanel — Layout & Table Fixes

**Files:**
- Modify: `src/components/AdminPanel.js:238` (main 280px+1fr grid)
- Modify: `src/components/AdminPanel.js:145-170` (users table container)
- Modify: `src/index.css` (admin responsive CSS)

### Background
`AdminPanel` has a `gridTemplateColumns: '280px 1fr'` inline style on the main layout (line 238). At 375px, the nav panel alone is 280px, leaving 95px for content — broken.

The users table uses `gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr'` for header and rows. On mobile, enable horizontal scroll.

- [ ] **Step 1: Add className to AdminPanel main grid**

In `AdminPanel.js` line ~238:
```jsx
// Before
<div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
// After
<div className="admin-layout-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
```

- [ ] **Step 2: Wrap users table in scroll container**

In `AdminPanel.js` line ~145, wrap the users table container div with a scroll wrapper:
```jsx
// Before
<div style={{ background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>

// After
<div style={{ overflowX: 'auto', borderRadius: 12 }}>
<div style={{ background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', minWidth: 560 }}>
```
Close the extra wrapper div after the existing closing `</div>` of the table container.

- [ ] **Step 3: Add admin responsive CSS**

```css
/* ===== AdminPanel mobile ===== */
@media (max-width: 768px) {
  .admin-layout-grid {
    grid-template-columns: 1fr !important;
  }
}
```

- [ ] **Step 4: Verify at 375px**

At 375px:
- Admin nav panel stacks above content
- Users table scrolls horizontally, columns are readable
- Overview stat cards render as 2-col (already fluid with `minmax(180px,1fr)`)

- [ ] **Step 5: Commit**
```bash
git add src/components/AdminPanel.js src/index.css
git commit -m "fix: AdminPanel layout and users table responsive"
```

---

## Task 5: Management Pages — Table Scroll Wrappers

**Files:**
- Modify: `src/components/UserManagement.js`
- Modify: `src/components/ClientManagement.js`
- Modify: `src/components/LocationManagement.js`
- Modify: `src/index.css`

### Background
These pages contain data tables (grids or HTML tables) that overflow at 375px. The fix is to wrap each table in an `overflow-x: auto` container with a `min-width` on the table itself, enabling horizontal scroll.

- [ ] **Step 1: Read UserManagement.js to identify table structure**

Run: open `src/components/UserManagement.js` and find the main data table/grid.

- [ ] **Step 2: Wrap UserManagement table**

Wrap the data table container with:
```jsx
<div style={{ overflowX: 'auto' }}>
  {/* existing table/grid with minWidth: 500 added */}
</div>
```
Add `minWidth: 500` (or appropriate value based on column count) to the table container's inline style.

- [ ] **Step 3: Repeat for ClientManagement and LocationManagement**

Same pattern: wrap in `overflowX: 'auto'` div, add `minWidth` to inner container.

- [ ] **Step 4: Add management page CSS to index.css**

```css
/* ===== Management pages mobile ===== */
@media (max-width: 480px) {
  /* Form grids: already handled per-component, add fallbacks */
  .form-row {
    grid-template-columns: 1fr !important;
  }
}
```

- [ ] **Step 5: Verify at 375px**

At 375px, check each management page:
- Tables scroll horizontally, do not clip content
- Action buttons in rows are reachable (min 44px height already set globally)

- [ ] **Step 6: Commit**
```bash
git add src/components/UserManagement.js src/components/ClientManagement.js src/components/LocationManagement.js src/index.css
git commit -m "fix: management pages table horizontal scroll on mobile"
```

---

## Task 6: UnifiedCalendar — Hide Sidebar on Mobile

**Files:**
- Modify: `src/index.css` (hide `.gcal-sidebar` at ≤768px)

### Background
`.gcal-sidebar` has `width: 220px` and is a flex child of `.gcal-body`. On mobile it consumes 220px leaving little room for the calendar. Since `.gcal-sidebar` uses a CSS class (not inline style), this is a pure CSS fix.

- [ ] **Step 1: Add calendar mobile CSS to index.css**

```css
/* ===== Calendar mobile ===== */
@media (max-width: 768px) {
  .gcal-sidebar {
    display: none !important;
  }
  .gcal-body {
    flex-direction: column;
  }
  .gcal-main {
    width: 100%;
    min-height: 0;
  }
  .gcal-view-switcher {
    flex-shrink: 1;
  }
  .gcal-topbar {
    flex-wrap: wrap;
    height: auto;
    min-height: 52px;
    padding: 8px 16px;
    gap: 6px;
  }
  .gcal-date-label {
    font-size: 14px;
  }
}
```

- [ ] **Step 2: Verify calendar at 375px**

At 375px:
- Mini calendar sidebar is hidden
- Main calendar grid fills full width
- Top navigation bar (prev/next/Today/view switcher) is accessible and not overflowing

- [ ] **Step 3: Commit**
```bash
git add src/index.css
git commit -m "fix: hide calendar sidebar on mobile, full-width calendar grid"
```

---

## Task 7: Modals, Panels, Global Padding

**Files:**
- Modify: `src/index.css` (modal padding, panel padding, global patches)

### Background
Modals already use `width: 90%` so they don't overflow. But their `padding: 32px` is too generous on a 375px screen (leaves only ~270px for content). Also various panels with hardcoded `padding: 24px` should compress on mobile.

- [ ] **Step 1: Add modal and panel mobile CSS**

```css
/* ===== Modals mobile ===== */
@media (max-width: 480px) {
  .glass-modal,
  .glass-modal-wide {
    padding: 20px !important;
    border-radius: 14px !important;
  }
  .completion-modal-content {
    border-radius: 12px !important;
  }
  .modal-body {
    padding: 16px !important;
  }
  .modal-header {
    padding: 16px !important;
  }
}

/* ===== General panel padding mobile ===== */
@media (max-width: 480px) {
  .glass-panel,
  .glass-panel-sm {
    padding: 16px !important;
  }
  .card {
    padding: 16px !important;
  }
}
```

- [ ] **Step 2: Add root overflow guard to index.css**

To prevent horizontal scroll from any missed component, add to the `@layer base` block or at the top of `index.css`:
```css
body {
  overflow-x: hidden;
}
```
> Note: this masks problems rather than fixing them. Only add if horizontal scroll is still present after all other tasks are done. Check devtools first.

- [ ] **Step 3: Reduce container padding on mobile**

The `.container` class has `padding: 24px`. On mobile this wastes horizontal space:
```css
@media (max-width: 480px) {
  .container {
    padding: 12px !important;
  }
}
```

- [ ] **Step 4: Verify modals at 375px**

Open the Case Manager, trigger a modal. Verify:
- Modal fits within the 375px viewport with comfortable padding
- Scrollable content areas work (can scroll modal body)
- Close button is reachable

- [ ] **Step 5: Commit**
```bash
git add src/index.css
git commit -m "fix: modal and panel padding on mobile"
```

---

## Task 8: EngineerDashboard & Dashboard Sub-Panels

**Files:**
- Modify: `src/components/EngineerDashboard.js`
- Modify: `src/components/dashboard/TeamStatusPanel.jsx`
- Modify: `src/components/dashboard/CasesPanel.jsx`
- Modify: `src/components/dashboard/PendingApprovalsPanel.jsx`
- Modify: `src/components/dashboard/WeeklyGantt.jsx`
- Modify: `src/index.css`

### Background
Each sub-panel component may have its own inline grids or fixed-width layouts. Read each file and add CSS class overrides or `overflowX: 'auto'` wrappers where needed. The `WeeklyGantt` is particularly likely to overflow as it renders a week-wide timeline.

- [ ] **Step 1: Read each sub-panel file**

Open each file and identify:
- Any `display: grid` or `display: flex` with fixed widths
- Any absolute positioning that could overflow
- Any `minWidth` values larger than 375px

Files to read:
- `src/components/EngineerDashboard.js`
- `src/components/dashboard/TeamStatusPanel.jsx`
- `src/components/dashboard/CasesPanel.jsx`
- `src/components/dashboard/PendingApprovalsPanel.jsx`
- `src/components/dashboard/WeeklyGantt.jsx`

- [ ] **Step 2: Fix WeeklyGantt overflow**

`WeeklyGantt` renders a 7-day timeline which will overflow at 375px. Wrap its outermost rendered div in a scroll container if it doesn't already have one:
```jsx
// Wrap the gantt's root div:
<div style={{ overflowX: 'auto' }}>
  {/* existing gantt content */}
</div>
```
The gantt internal layout keeps its natural width; users scroll horizontally.

- [ ] **Step 3: Fix EngineerDashboard**

Read `EngineerDashboard.js` and add `className` attributes to any inline grid containers. Add corresponding CSS to `index.css`:
```css
@media (max-width: 480px) {
  .engineer-dashboard-grid {
    grid-template-columns: 1fr !important;
  }
}
```
(Use whatever className you assign.)

- [ ] **Step 4: Fix remaining sub-panels**

For TeamStatusPanel, CasesPanel, PendingApprovalsPanel — read each file and identify horizontal layouts. Add classNames + CSS overrides to stack vertically at 480px.

- [ ] **Step 5: Verify engineer dashboard at 375px**

Log in as an engineer role user and verify:
- Personal dashboard panels stack vertically
- Gantt scrolls horizontally (doesn't clip)
- All cards are readable

- [ ] **Step 6: Commit**
```bash
git add src/components/EngineerDashboard.js src/components/dashboard/TeamStatusPanel.jsx src/components/dashboard/CasesPanel.jsx src/components/dashboard/PendingApprovalsPanel.jsx src/components/dashboard/WeeklyGantt.jsx src/index.css
git commit -m "fix: engineer dashboard and sub-panels responsive layout"
```

---

## Task 9: ProfileManagement & GoogleCalendarSync

**Files:**
- Modify: `src/components/ProfileManagement.js`
- Modify: `src/components/GoogleCalendarSync.js`
- Modify: `src/index.css`

- [ ] **Step 1: Read both files**

Open `ProfileManagement.js` and `GoogleCalendarSync.js`. Identify:
- Side-by-side layouts to stack
- Fixed padding/width values that need mobile overrides
- Buttons that should be full-width on mobile

- [ ] **Step 2: Add classNames for overrideable containers**

Add className attributes to any layout containers that have inline styles. Use descriptive names: `profile-layout`, `gcal-sync-layout`.

- [ ] **Step 3: Add CSS to index.css**

```css
/* ===== ProfileManagement mobile ===== */
@media (max-width: 480px) {
  .profile-layout {
    flex-direction: column !important;
    gap: 16px !important;
    padding: 16px !important;
  }
}

/* ===== GoogleCalendarSync mobile ===== */
@media (max-width: 480px) {
  .gcal-sync-layout {
    padding: 16px !important;
  }
}
```

- [ ] **Step 4: Verify at 375px**

Check both pages at 375px — no overflow, content is readable, actions are reachable.

- [ ] **Step 5: Commit**
```bash
git add src/components/ProfileManagement.js src/components/GoogleCalendarSync.js src/index.css
git commit -m "fix: profile and google calendar sync mobile layout"
```

---

## Task 10: Final Sweep & Verification

- [ ] **Step 1: Full mobile walkthrough at 375px**

Using browser DevTools at 375px viewport, visit every page/tab:
1. Login page ✓
2. Signup page ✓
3. Dashboard (admin) ✓
4. Admin Panel ✓
5. User Management ✓
6. Clients ✓
7. Locations ✓
8. Schedule (calendar) ✓
9. Cases ✓
10. Google Calendar Sync ✓
11. Engineer Dashboard (login as engineer role) ✓
12. Profile/Account ✓

For each page check:
- No horizontal overflow
- Text is readable (not clipped)
- Buttons/inputs are tappable (min 44px height)
- Modals open and close correctly
- Forms are usable (labels visible, inputs accessible)

- [ ] **Step 2: Check App.css for stale or missing mobile blocks**

Open `src/App.css`. Verify the existing `@media (max-width: 768px)` blocks still match the current layout. In particular confirm:
- `.tab-navigation` stack (column) — may not be used in current sidebar layout, safe to leave
- `.header` flex-direction column — valid
- `.summary-stats`, `.dashboard-header` overrides — valid

If any blocks reference class names that no longer exist, remove them to avoid confusion.

- [ ] **Step 3: Fix any remaining issues found in sweep**

Address anything found in Step 1 that wasn't covered by Tasks 1–9. Add targeted CSS or minimal JSX fixes.

- [ ] **Step 3: Check 768px (tablet) — no regressions**

At 768px viewport, verify:
- Sidebar shows permanently (not as a drawer)
- Topbar left offset is correct (starts at 240px from left)
- Dashboard panels are 2–3 column (not fully stacked)

- [ ] **Step 4: Final commit**
```bash
git add -A
git commit -m "fix: final mobile sweep — all pages responsive at 375px"
```
