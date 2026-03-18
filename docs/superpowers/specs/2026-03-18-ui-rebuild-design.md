# SEP UI Rebuild Design Spec
**Date:** 2026-03-18
**Scope:** Full Glass Premium UI rebuild across the entire app — shell, navigation, all pages, cases calendar view, and app-wide audit cleanup

---

## Overview

The auth pages (LoginPage, SignupPage) already use the Glass Premium dark aesthetic. This spec extends that aesthetic consistently across the entire authenticated app: the app shell, sidebar, top bar, and all content panels. A broken theme toggle is removed. The user avatar and logout button move from the navbar into the sidebar. The Cases tab gains a list/calendar toggle with day/week/month calendar views. Dead code is removed and functional gaps are addressed.

---

## Approach

**Option chosen:** Full Glass Rebuild — rewrite the app shell from scratch using the Glass Premium aesthetic, remove light mode entirely, rebuild all content panels as glass cards.

---

## Visual Design Language

All components use a single, consistent design token set:

| Token | Value |
|---|---|
| Background gradient | `linear-gradient(135deg,#0f0c29,#302b63,#24243e)` fixed on `<html>` |
| Glass panel bg | `rgba(255,255,255,0.06)` |
| Glass panel border | `1px solid rgba(255,255,255,0.1)` |
| Glass panel blur | `backdrop-filter: blur(12px)` |
| Glass panel radius | `16px` |
| Input bg (default) | `rgba(255,255,255,0.05)` |
| Input bg (focused) | `rgba(167,139,250,0.04)` |
| Input border (focused) | `1px solid rgba(167,139,250,0.6)` |
| Focus ring | `0 0 0 3px rgba(167,139,250,0.12)` |
| Primary gradient | `linear-gradient(135deg,#3b82f6,#8b5cf6)` |
| Accent purple | `#a78bfa` |
| Accent blue | `#60a5fa` |
| Text primary | `#ffffff` |
| Text secondary | `rgba(255,255,255,0.55)` |
| Text muted | `rgba(255,255,255,0.3)` |
| Sidebar width | `240px` |
| Top bar height | `48px` |
| Font | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` |

---

## Shell Architecture

### Remove
- `isDark` state from `App.js`
- `toggleTheme()` function from `App.js`
- Theme toggle button from `Navbar.jsx`
- All Tailwind `dark:` class variants from components
- `darkMode: 'class'` in `tailwind.config.js` → change to `darkMode: 'media'` (unused, just cleanup)

### Add to `<html>`
The gradient background is set once on `document.documentElement` via a global CSS rule:
```css
html, body, #root { min-height: 100vh; background: linear-gradient(135deg,#0f0c29,#302b63,#24243e); background-attachment: fixed; }
```

### `GlassSidebar` (replaces `SidebarTabs.jsx`)
- Fixed left, `width: 240px`, full viewport height
- Background: `rgba(255,255,255,0.05)`, `backdrop-filter: blur(20px)`
- Right border: `1px solid rgba(255,255,255,0.08)`
- Three zones (top → middle → bottom):
  1. **Brand zone** — LogoMark + "Service Engineer Planner" wordmark (same SVG logo from LoginPage)
  2. **Nav zone** — role-based tab list, flex-1, scrollable. Active tab: left accent bar (3px, purple-gradient) + `rgba(167,139,250,0.12)` bg. Inactive: `rgba(255,255,255,0.4)` icon + label, hover lightens. Framer Motion layout animations on tab change.
  3. **User zone** — pinned to bottom. Avatar circle (gradient initials), name, role badge, logout button (icon-only with label, red on hover).

### `GlassTopBar` (replaces `Navbar.jsx`)
- Fixed top, `height: 48px`, `left: 240px`, `right: 0`
- Background: `rgba(255,255,255,0.03)`, `backdrop-filter: blur(12px)`
- Bottom border: `1px solid rgba(255,255,255,0.06)`
- Left: current page title (derived from active tab)
- Right: notification bell icon (placeholder for future notifications)
- No avatar, no logout, no theme toggle

### `ContentArea`
- `margin-left: 240px`, `padding-top: 48px`
- Padding: `24px` all sides on desktop
- All page content panels use the glass card design token set

### Mobile (≤768px)
- `isSidebarOpen` boolean state lives in `App.js`, passed as props to both `GlassSidebar` and `GlassTopBar`
- `GlassTopBar` receives `onMenuClick` prop — renders hamburger button on its left at `≤768px`
- `GlassSidebar` receives `isOpen` prop — hidden by default (`transform: translateX(-100%)`), slides in on open (`transform: translateX(0)`)
- A semi-opaque backdrop div (also in `App.js`) renders behind the open sidebar; clicking it closes the sidebar
- ContentArea uses full width (`margin-left: 0`) at `≤768px`

---

## Cases Tab Redesign

### View Toggle
A segmented control at the top of the Cases tab switches between two modes:

```
[ List ]  [ Calendar ]
```

Within Calendar mode, a secondary segmented control appears:

```
[ Day ]  [ Week ]  [ Month ]
```

Default: List mode. Persisted in component state (not localStorage).

### List Mode
Existing `CaseManager.js` content — search, filters, table/cards, CRUD, status pipeline — retained and restyled with glass card panels and dark inputs.

### Calendar Mode
Built on `react-big-calendar` (already installed and used in `ScheduleCalendar.js`). Use the same `momentLocalizer(moment)` already imported there.

**react-big-calendar CSS:** The import `'react-big-calendar/lib/css/react-big-calendar.css'` is intentionally suppressed in `ScheduleCalendar.js` (clashes with dark theme). `CaseCalendarView` must also skip the default CSS import. Instead, apply custom dark overrides in `src/index.css` targeting the `.rbc-*` class namespace:
```css
.rbc-calendar { background: transparent; color: #fff; }
.rbc-header { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
.rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: rgba(255,255,255,0.1); }
.rbc-day-bg { border-color: rgba(255,255,255,0.06); }
.rbc-today { background: rgba(167,139,250,0.08); }
.rbc-off-range-bg { background: rgba(0,0,0,0.2); }
.rbc-toolbar button { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); border-radius: 8px; }
.rbc-toolbar button.rbc-active { background: rgba(167,139,250,0.2); border-color: rgba(167,139,250,0.4); color: #a78bfa; }
.rbc-event { border-radius: 6px; border: none; font-size: 11px; }
.rbc-time-slot { border-color: rgba(255,255,255,0.04); }
.rbc-timeslot-group { border-color: rgba(255,255,255,0.08); }
.rbc-time-content { border-color: rgba(255,255,255,0.1); }
```
These overrides live in the shared `index.css` and apply to both `ScheduleCalendar` and `CaseCalendarView`.

**Event data mapping:**
Cases are mapped to react-big-calendar events using `scheduled_start` and `scheduled_end` fields (timestamps stored in the `cases` table). Cases where `scheduled_start` is null are **excluded from the calendar view** — they appear only in List mode. The `CaseCalendarView` component should show a banner: "X cases have no scheduled date and are not shown in calendar view. Switch to List view to see them."

```js
const events = cases
  .filter(c => c.scheduled_start)
  .map(c => ({
    id: c.id,
    title: `${c.case_number || c.id.slice(0,8)} — ${c.title || c.description?.slice(0,30) || 'Case'}`,
    start: new Date(c.scheduled_start),
    end: c.scheduled_end ? new Date(c.scheduled_end) : new Date(new Date(c.scheduled_start).getTime() + 60*60*1000),
    resource: c,
  }));
```

**Event color:** Mapped from `STATUS_COLORS` in `src/components/dashboard/dashboardUtils.js`. Apply via `eventPropGetter`:
```js
eventPropGetter={(event) => ({
  style: {
    backgroundColor: STATUS_COLORS[event.resource.status] || '#6b7280',
    opacity: isEngineer && event.resource.assigned_engineer_id !== currentUserId ? 0.45 : 1,
    border: isEngineer && event.resource.assigned_engineer_id !== currentUserId ? '1px dashed rgba(255,255,255,0.3)' : 'none',
  }
})}
```

**Click handler:** Clicking an event sets `selectedCase` state and opens `CaseDetailPanel`. `CaseCalendarView` receives the following props from `CaseManager.js`:
- `cases` — already-fetched cases array (same data source, no new query)
- `engineers` — already-fetched engineers array from `CaseManager`'s existing state
- `currentUserId` — from auth context (`user.id`)
- `isEngineer` — boolean (`profile.role === 'engineer'`)
- `isAdmin` — boolean (`profile.role === 'admin' || profile.is_admin`)
- `onUpdateStatus(caseId, newStatus)` — same handler already defined in `CaseManager.js`

`CaseDetailPanel` is rendered inside `CaseManager.js` (not inside `CaseCalendarView`), fed by `selectedCase` state. `CaseCalendarView` calls `onSelectCase(caseObj)` prop when an event is clicked; `CaseManager` sets `selectedCase` from that.

**Role-based visibility:**
- All roles see all cases on the calendar
- Engineer role (`isEngineer = true`): own assigned cases at full opacity, others at `opacity: 0.45` + dashed border
- Admin / Manager / Executive: all cases at full opacity

**Day view:** Time grid for selected day (react-big-calendar default day view)
**Week view:** Mon–Sun grid (default, opens on first load of calendar mode)
**Month view:** Month grid with case event chips; click a date cell expands to day view

---

## App-wide Audit

### Dead Code — Remove
| File | Reason |
|---|---|
| `src/components/EnhancedDashboard.js` | Unused 1,647-line experimental dashboard |
| `src/components/EngineerPersonalDashboard.js` | Unused 1,577-line superseded component |
| `src/components/WeeklyCalendar.js` | Superseded by ScheduleCalendar |
| `src/components/LoginTest.js` | Debug/test harness |
| `src/components/AuthDebug.js` | Debug output component |
| `src/components/DashboardCard.jsx` | Unused generic card |

### Visual Consistency Sweep
Applied across all remaining components during the glass rebuild:
- All `bg-gray-*`, `bg-navy-*`, `bg-white` panel backgrounds → glass card tokens
- All modal dialogs → glass overlay modal (dark backdrop + glass panel)
- All form inputs → dark input style (matching LoginPage `DarkInput`)
- All buttons → glass button (outlined) or primary gradient button
- All section headers → consistent `fontSize:11, fontWeight:600, letterSpacing:'.7px', textTransform:'uppercase', color:'rgba(255,255,255,0.4)'`

### Functional Gaps — Address

**`ProfileManagement` avatar preview:**
The current avatar field is a plain text input for a URL. Add a 48×48 circle preview next to the input: if the URL is non-empty and loads successfully, show the image; otherwise show the gradient-initials fallback (same pattern as the sidebar user zone). No file upload needed.

**`GoogleCalendarSync` empty state:**
Check whether `src/services/googleCalendarService.js` (or equivalent) exists. If the service file is missing or OAuth client ID env var (`REACT_APP_GOOGLE_CLIENT_ID`) is not set, render a clear "Google Calendar integration is not configured" panel with instructions rather than a broken UI. If the service exists and is wired correctly, confirm the Connect/Disconnect flow renders without errors.

**`AdminPanel` tab audit — concrete expected state:**
Read `AdminPanel.js` and verify each of the 5 internal tabs renders real Supabase-fetched data:
- **Overview:** System stats (user count, case count, schedule count) must come from live queries, not hardcoded zeros
- **Users:** Engineer list with search/filter and edit/delete actions — must fetch from `profiles` table
- **Cases:** Case list (top 20) — must fetch from `cases` table
- **Schedules:** Schedule list — must fetch from `schedules` table
- **System:** Health indicators — acceptable if some are static/placeholder

For any tab that has hardcoded data or unimplemented queries, add the Supabase fetch and wire it to the UI. Glass restyle applies to all tabs regardless.

**`EngineerDashboard.js` — context:**
This is the component rendered for the `engineer` role in `App.js` under the tab key `'personal'`. It is distinct from the deleted `EngineerPersonalDashboard.js`. Apply the glass card restyle to `EngineerDashboard.js` in place — do not restructure its internal logic.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/index.css` or `src/App.css` | Add global gradient + reset |
| `src/App.js` | Remove isDark/toggleTheme, update layout shell refs |
| `src/components/GlassSidebar.jsx` | New — replaces SidebarTabs |
| `src/components/GlassTopBar.jsx` | New — replaces Navbar |
| `src/components/CaseManager.js` | Add list/calendar toggle + calendar view |
| `src/components/CaseCalendarView.jsx` | New — react-big-calendar cases renderer |
| `src/components/UnifiedDashboard.js` | Glass card restyle |
| `src/components/EngineerDashboard.js` | Glass card restyle |
| `src/components/ClientManagement.js` | Glass card restyle |
| `src/components/UserManagement.js` | Glass card restyle |
| `src/components/LocationManagement.js` | Glass card restyle |
| `src/components/ProfileManagement.js` | Glass card restyle + avatar preview |
| `src/components/AdminPanel.js` | Glass card restyle + tab audit |
| `src/components/GoogleCalendarSync.js` | Glass card restyle + empty state |
| `src/components/ScheduleCalendar.js` | Glass card restyle |
| `src/components/dashboard/*.jsx` | Glass card restyle across all sub-components |
| `tailwind.config.js` | Minor cleanup |
| Dead files (6) | Delete |

---

## Verification Checks

After implementation:
1. App loads with gradient background on all pages (no white flash, no navy backgrounds)
2. Sidebar shows correct tabs per role, avatar+logout pinned at bottom
3. Theme toggle is gone — no reference to isDark or toggleTheme anywhere
4. Cases tab: List mode shows existing table; Calendar mode shows all cases as events
5. Engineer in Calendar mode: own cases full opacity, others dimmed
6. Dead files confirmed deleted — no import errors
7. All modals use glass overlay styling
8. `ProfileManagement` avatar field shows URL preview
9. Mobile: sidebar slides in as overlay, doesn't break layout
10. All 4 roles (admin/manager/executive/engineer) navigate correctly with no broken tabs
