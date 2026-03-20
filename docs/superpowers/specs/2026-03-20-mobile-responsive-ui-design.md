# Mobile-Responsive UI Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Make the entire SEP (Service Engineer Planner) UI fully responsive and mobile-friendly at 375–430px viewport widths, preserving the existing dark glass aesthetic.

## Approach

**Option A: CSS media queries + minimal JSX edits.**

- Shell breakpoint: `768px` (sidebar hide, topbar shift, content margin reset)
- Content breakpoint: `480px` (component-level layout changes)
- Bulk of changes in `src/index.css` and `src/App.css`
- Minimal JSX edits only where inline `style` props block CSS override

No Tailwind migration. No component restructuring. No logic or state changes.

## Navigation Shell (breakpoint: 768px)

### GlassSidebar (`GlassSidebar.jsx`)
**JSX edit required:** The sidebar root `div` has `style={{ width: SIDEBAR_W }}` where `SIDEBAR_W = 240` is a JS constant. CSS cannot override inline `width` without `!important`, and `!important` on `width` conflicts with the transform slide animation. Instead, change the inline style directly:
```
// Before
width: SIDEBAR_W   (= 240)
// After
width: 'min(280px, 85vw)'
```
- CSS already handles `transform: translateX(-100%)` / `translateX(0)` for open/close at ≤768px ✓
- Nav item touch targets: add `minHeight: 44` to each nav button style (already close — verify)
- Close button: `style={{ display: 'none' }}` on the X button is intentionally overridden by CSS rule `.glass-sidebar-close { display: flex !important }` at ≤768px. Do not remove the inline `display: 'none'` — it is the desktop default. The `!important` is intentional.
- No `motion.div` wraps the sidebar root div — framer-motion only applies to individual nav buttons inside (safe to change width)

### GlassTopBar (`GlassTopBar.jsx`)
**JSX edit required:** The topbar has `style={{ left: 240, ... }}`. While CSS has `.glass-topbar { left: 0 !important }` at ≤768px, it's cleaner and safer to remove the hardcoded `left: 240` from the inline style and rely solely on CSS.
- Change inline style: remove `left: 240` → let CSS control it
- Already has hamburger `Menu` button shown at ≤768px ✓

### App.js content area
- `style={{ marginLeft: 240, paddingTop: 48 }}` — CSS already overrides this with `.content-area { margin-left: 0 !important }` at ≤768px ✓
- No JSX edit required; `!important` handles the inline style override
- Mobile backdrop overlay already implemented ✓

## Auth Pages (breakpoint: 480px)

### LoginPage / SignupPage
- Card container: `width: 90%`, `max-width: 420px`, `padding: 24px 20px` on mobile
- Input fields: full width, `min-height: 44px`
- Submit buttons: full width on mobile
- Logo/title: reduce font size if overflowing

## Dashboard Pages (breakpoint: 480px)

### UnifiedDashboard + EngineerDashboard
- KPI bar: 4-col stat grid → 2-col at 480px → 1-col at 360px
- Team status panel, Cases panel, Pending approvals: stacked single column
- WeeklyGantt: `overflow-x: auto` wrapper, preserve internal min-width
- CaseDetailPanel: full-width on mobile

### DashboardKPIBar
- Stat cards: `repeat(4, 1fr)` → `repeat(2, 1fr)` at 480px

### TeamStatusPanel / CasesPanel / PendingApprovalsPanel
- Horizontal card layouts → vertical stack at 480px
- Reduce padding from 24px → 16px

## CaseManager (breakpoint: 480px)

Already has most mobile CSS. Patch remaining:
- Verify no horizontal overflow on case cards at 375px
- `form-row` already goes to 1-col at 768px ✓
- `filters-section` already columns at 768px ✓

## AdminPanel (breakpoint: 768px)

**JSX edits required** for inline grid styles:

1. **Main layout** (`line 238`): `gridTemplateColumns: '280px 1fr'`
   - Add className `admin-layout-grid` to this div
   - CSS override at ≤768px: `grid-template-columns: 1fr !important`
   - Side nav becomes stacked above main content

2. **Users table header + rows** (`lines 146, 154`): `gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr'`
   - Wrap the entire table div in an `overflow-x: auto` container
   - Add `minWidth: 560px` to the table container so columns don't collapse
   - This enables horizontal scroll on mobile rather than reformatting as cards

3. **Overview stats** (`line 78`): `repeat(auto-fit, minmax(180px, 1fr))`
   - Already fluid — at 375px renders as 2-col (2×180=360 < 375). No change needed. ✓

4. **Cases grid** (`line 179`): `repeat(auto-fill, minmax(280px, 1fr))`
   - At 375px: 280px min → 1-col. Already correct. ✓

5. **System settings grid** (`line 204`): `repeat(auto-fit, minmax(240px, 1fr))`
   - At 375px: 240px min → 1-col. Already correct. ✓

6. **Admin tab nav** (left panel): stacks vertically when `admin-layout-grid` goes to 1-col. No extra change needed.

## Management Pages (breakpoint: 480px)

### UserManagement / ClientManagement / LocationManagement
- Data tables: wrap in `overflow-x: auto` div; add `min-width` to table/grid container
- Form grids: 2-col → 1-col at 480px
- Header rows (title + action button): `flex-wrap: wrap`; action button full-width if needed
- Action buttons in table rows: ensure min-height 44px

## UnifiedCalendar (breakpoint: 768px)

- `.gcal-sidebar` (220px fixed): `display: none` at ≤768px
  - Mini calendar intentionally inaccessible on mobile (acceptable for v1; toggle is future scope)
- `.gcal-body`: full width when sidebar hidden
- `.gcal-topbar` view switcher: abbreviate labels if needed (Day/Wk/Mo already short)
- Calendar itself: `overflow-x: auto` if day/week view overflows at narrow widths

## Modals (breakpoint: 480px)

- `.glass-modal`, `.glass-modal-wide`: already `width: 90%` ✓
- Reduce `padding: 32px` → `padding: 20px` at 480px
- `.completion-modal-content`: already responsive ✓

## ProfileManagement / GoogleCalendarSync (breakpoint: 480px)

- Padding: `24px` → `16px` at 480px
- Side-by-side sections → stacked
- Buttons: full width on mobile

## Global / Utilities

- `min-height: 44px` on all interactive elements already in `index.css` at 768px ✓
- Font sizes: use `clamp()` or reduce via media query where headings overflow
- Prevent root horizontal scroll: `overflow-x: hidden` on `body` if needed

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/index.css` | CSS | Add `@media (max-width: 480px)` blocks for all content components |
| `src/App.css` | CSS | Patch/extend existing 768px mobile blocks |
| `src/components/GlassSidebar.jsx` | JSX | Width: `'min(280px, 85vw)'` (JS string in inline style) |
| `src/components/GlassTopBar.jsx` | JSX | Remove inline `left: 240` |
| `src/components/AdminPanel.js` | JSX + CSS | Add `admin-layout-grid` className; wrap users table in scroll container |
| `src/components/LoginPage.js` | CSS | Mobile padding, full-width buttons |
| `src/components/SignupPage.js` | CSS | Mobile padding, full-width buttons |
| `src/components/UnifiedDashboard.js` | CSS | Stack panels, KPI grid |
| `src/components/UnifiedCalendar.jsx` | CSS | Hide gcal-sidebar |
| `src/components/UserManagement.js` | JSX + CSS | Table scroll wrapper |
| `src/components/ClientManagement.js` | JSX + CSS | Table scroll wrapper |
| `src/components/LocationManagement.js` | JSX + CSS | Table scroll wrapper |
| `src/components/ProfileManagement.js` | CSS | Stack layout, mobile padding |
| `src/components/GoogleCalendarSync.js` | CSS | Stack layout, mobile padding |
| `src/components/EngineerDashboard.js` | CSS | Stack panels |

## Testing Targets

- 375px — iPhone SE (minimum target)
- 390px — iPhone 14
- 430px — iPhone 14 Plus
- 768px — iPad (shell layout check)

## Out of Scope

- Bottom tab bar navigation (user confirmed: hamburger drawer only)
- Mini calendar toggle on mobile (future scope)
- Tailwind migration
- Component restructuring
- Logic or state changes
- Dark mode toggle
- PWA/native app features
