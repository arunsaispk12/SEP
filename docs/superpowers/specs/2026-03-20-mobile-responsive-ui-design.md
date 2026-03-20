# Mobile-Responsive UI Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Make the entire SEP (Service Engineer Planner) UI fully responsive and mobile-friendly at 375–430px viewport widths, preserving the existing dark glass aesthetic.

## Approach

**Option A: CSS media queries + minimal JSX edits.**

- Primary breakpoint: `480px` (phones)
- Secondary breakpoint: `768px` (tablets, already partially used)
- Bulk of changes in `src/index.css` and `src/App.css`
- Minimal JSX edits only where inline `style` props block CSS override

No Tailwind migration. No component restructuring. No logic or state changes.

## Navigation Shell

### GlassSidebar (`GlassSidebar.jsx`)
- Change hardcoded `width: 240` → `width: Math.min(280, window.innerWidth * 0.85)` or CSS `min(280px, 85vw)` via inline style
- CSS already handles `transform: translateX(-100%)` / `translateX(0)` for open/close
- Nav item touch targets: add `minHeight: 44px` to each button
- Close button (`glass-sidebar-close`) already toggled via CSS; verify it works

### GlassTopBar (`GlassTopBar.jsx`)
- Remove hardcoded inline `left: 240` — let CSS `.glass-topbar { left: 0 !important }` handle it
- Already has hamburger menu button shown at ≤768px

### App.js content area
- `margin-left: 240` on `.content-area` already overridden to `0` at ≤768px via CSS
- Mobile backdrop overlay already implemented

## Auth Pages

### LoginPage / SignupPage
- Card: `width: 90%`, `max-width: 420px`, `padding: 24px` on mobile
- Fields: full width, `min-height: 44px`
- Buttons: full width on mobile
- Logo/title: reduced font size

## Dashboard Pages

### UnifiedDashboard + EngineerDashboard
- KPI bar: `grid-template-columns: repeat(2, 1fr)` → `1fr` at 480px
- Team status panel, Cases panel, Pending approvals: stacked single column
- WeeklyGantt: `overflow-x: auto` horizontal scroll, min-width preserved
- CaseDetailPanel: full-width drawer/panel

### DashboardKPIBar
- 4-col stat grid → 2-col at 480px

### TeamStatusPanel / CasesPanel / PendingApprovalsPanel
- Horizontal card layouts → vertical stack
- Reduced padding (16px → 12px)

## CaseManager

- Already has most mobile CSS; patch remaining:
  - `filters-section`: already column at 768px
  - `case-header`: already column at 768px
  - Ensure no horizontal overflow on case cards

## AdminPanel

- Inline `gridTemplateColumns` overridden with `!important` in CSS or moved to className
- Admin tab nav: `overflow-x: auto; white-space: nowrap` for horizontal scroll
- Stat cards grid: `repeat(auto-fit, minmax(180px,1fr))` already fluid — verify at 375px
- User/case tables: wrapped in `overflow-x: auto`

## Management Pages (UserManagement, ClientManagement, LocationManagement)

- Data tables: `overflow-x: auto` wrapper, `min-width` on table so columns don't collapse
- Form grids: 2-col → 1-col at 480px
- Header rows (title + action button): `flex-wrap: wrap`, button full-width if needed
- Action buttons in table rows: icon-only or abbreviated labels on mobile

## UnifiedCalendar

- `gcal-sidebar` (220px fixed): hidden at ≤768px via `display: none`
- `gcal-topbar`: view switcher wraps or abbreviates labels (Day/Wk/Mo)
- `gcal-body`: full width when sidebar hidden
- Mini calendar accessible via a toggle button on mobile (future enhancement — not in scope)

## Modals

- `.glass-modal`, `.glass-modal-wide`: already `width: 90%` ✓
- Reduce `padding: 32px` → `padding: 20px` at 480px
- `.completion-modal-content`: already responsive ✓

## ProfileManagement / GoogleCalendarSync

- Padding: `24px` → `16px` at 480px
- Any side-by-side sections → stacked
- Buttons: full width on mobile

## Global / Utilities

- `min-height: 44px` on all interactive elements already in `index.css` at 768px ✓
- Font sizes: use `clamp()` or reduce via media query where headings overflow
- Horizontal overflow prevention: `overflow-x: hidden` on root if needed (with care)

## Files Changed

| File | Change Type |
|------|-------------|
| `src/index.css` | Add `@media (max-width: 480px)` blocks for all components |
| `src/App.css` | Patch/extend existing mobile blocks |
| `src/components/GlassSidebar.jsx` | Width: `min(280px, 85vw)` |
| `src/components/GlassTopBar.jsx` | Remove inline `left: 240` |
| `src/components/AdminPanel.js` | Replace inline grid with className or CSS override |
| Other components | Minimal targeted JSX where inline styles block CSS |

## Testing Targets

- 375px — iPhone SE
- 390px — iPhone 14
- 430px — iPhone 14 Plus
- 768px — iPad (tablet check, existing coverage)

## Out of Scope

- Bottom tab bar navigation
- Tailwind migration
- Component restructuring
- Logic or state changes
- Dark mode toggle
- PWA/native app features
