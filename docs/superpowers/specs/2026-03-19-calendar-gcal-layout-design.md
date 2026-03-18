# Calendar Google-Style Layout Design Spec
**Date:** 2026-03-19
**Scope:** Full layout redesign of `ScheduleCalendar.js` and `CaseCalendarView.jsx` — adopt Google Calendar-style structure: left sidebar (mini calendar + filter list) + custom top toolbar + main RBC calendar starting at 8 AM.

---

## Overview

Both the Schedule tab and the Cases calendar view currently use the react-big-calendar (RBC) default toolbar, start scrolled to 12:00 AM, and have no sidebar. The redesign adopts the Google Calendar layout pattern, adapted to the app's dark glass aesthetic (`linear-gradient(135deg,#0f0c29,#302b63,#24243e)`).

The two views share the same structural shell but differ in what the sidebar filter list shows:
- **ScheduleCalendar**: sidebar shows an Engineers list (color-coded, toggleable to show/hide that engineer's events)
- **CaseCalendarView**: sidebar shows a Status filter list (All / Open / In Progress / Completed / etc., color-coded)

---

## Layout Structure (both views)

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR (full width, 52px tall)                        │
│  Today │ ‹ › │ "March 2026" │ ···flex··· │ View switcher │ actions │
├──────────────┬──────────────────────────────────────────┤
│  LEFT SIDEBAR│  MAIN CALENDAR AREA                      │
│  220px wide  │                                          │
│              │  Column headers (SUN 15 / MON 16 …)     │
│  Mini month  │  Today column: purple circle + bg tint   │
│  calendar    │  ─────────────────────────────────────── │
│              │  All-day events row                      │
│  ─────────── │  ─────────────────────────────────────── │
│  Filter list │  Time grid (scrolled to 8 AM on mount)   │
│  (Engineers  │  RBC fills remaining height              │
│   or Status) │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## Section 1 — Top Bar

Fixed height 52px. Background `rgba(255,255,255,0.03)`, border-bottom `1px solid rgba(255,255,255,0.07)`.

Left to right:
1. **Page title** — "Schedule Calendar" or "Cases" (14px, bold, white). For Cases, omit — CaseManager provides the header above.
2. **Divider** — 1px vertical `rgba(255,255,255,0.1)`
3. **Today pill** — rounded button (`border-radius: 20px`), `rgba(255,255,255,0.07)` bg, `rgba(255,255,255,0.15)` border. Clicking navigates RBC to today.
4. **‹ and › nav buttons** — 28×28px, no background, click calls RBC `onNavigate('PREV')` / `onNavigate('NEXT')`
5. **Date label** — flex: 1, `"March 2026"` (18px, semibold, white). Updates as user navigates.
6. **View switcher** — inline button group with `rgba(255,255,255,0.06)` container and rounded border. Four buttons: Month / Week / Day / Agenda. Active view gets `linear-gradient(135deg,#3b82f6,#8b5cf6)` background, white bold text. Inactive: transparent bg, `rgba(255,255,255,0.45)`.
7. **Divider**
8. **Action buttons** — view-specific (see below).

**ScheduleCalendar action buttons:**
- "↻ Sync with Cases" (`glass-btn-secondary`)
- "+ Add Schedule" (`glass-btn-primary` with gradient)

**CaseCalendarView action buttons:**
- None (CaseManager owns the "Add Case" button above)

**Implementation:** RBC `toolbar={false}`. Render a fully custom toolbar div above the `<Calendar>` component. Use RBC's `onNavigate` and `onView` callbacks to drive state. The `date` prop on `<Calendar>` is controlled from state.

---

## Section 2 — Left Sidebar

Fixed width 220px. `border-right: 1px solid rgba(255,255,255,0.07)`. Padding 16px 12px. Vertically scrollable if content overflows.

### 2a — Mini Month Calendar

Displays the current month as a compact grid. Structure:
- Header row: month name + year (12px, semibold, `rgba(255,255,255,0.8)`) + ‹ › navigation (separate from main calendar navigation — mini cal can be browsed independently)
- Day-of-week labels: S M T W T F S (9px, `rgba(255,255,255,0.3)`)
- Date grid: 7 columns, each date is a 24px circle button
  - Today: `background: #a78bfa`, white text, bold
  - Selected week (when in week view): subtle `rgba(167,139,250,0.15)` background on the week row
  - Clicking a date navigates the main calendar to that date (calls RBC `onNavigate`)
  - Off-month dates: `rgba(255,255,255,0.2)` text
- In day view: the clicked/active date gets the same `#a78bfa` circle treatment as today (today takes precedence if they coincide)

### 2b — Filter List

**ScheduleCalendar — Engineers list:**
- Section label: "ENGINEERS" (10px uppercase, `rgba(255,255,255,0.35)`)
- One row per engineer from the `engineers` array from context
- Each row: colored square (11×11px, `border-radius: 2px`) + engineer name (11px)
- Color: assign from a fixed palette of 8 colors cycling by index (blue, violet, green, amber, red, cyan, pink, orange)
- Clicking toggles the engineer on/off. Off = square becomes `rgba(255,255,255,0.15)` with border, name dims to `rgba(255,255,255,0.35)`
- State: `hiddenEngineers: Set<string>` — events where `resource.engineer.id` is in the set are filtered from the events array passed to RBC

**CaseCalendarView — Status filter list:**
- Section label: "STATUS" (10px uppercase, `rgba(255,255,255,0.35)`)
- Rows: All Cases · Open · In Progress · Completed · On Hold · Cancelled
- Color per status: Open=`#f87171`, In Progress=`#60a5fa`, Completed=`#34d399`, On Hold=`#fbbf24`, Cancelled=`#6b7280`, All=`#a78bfa`
- Count badge on right: `rgba(255,255,255,0.3)`, 10px
- Clicking a row sets the active status filter. "All Cases" clears the filter.
- State: `activeStatus: string | null` — null means all cases shown

---

## Section 3 — Main Calendar Area

Fills remaining width and full height below the top bar. Uses RBC `<Calendar>` component.

### Props
```jsx
<Calendar
  localizer={localizer}
  events={filteredEvents}
  view={currentView}
  date={currentDate}
  onView={setCurrentView}
  onNavigate={setCurrentDate}
  onSelectSlot={handleSelectSlot}      // ScheduleCalendar only
  onSelectEvent={handleSelectEvent}
  selectable                            // ScheduleCalendar only
  eventPropGetter={eventPropGetter}
  components={{ toolbar: () => null, event: CustomEvent }}
  scrollToTime={new Date(2000, 0, 1, 8, 0, 0)}  // scroll to 8 AM on mount
  style={{ height: '100%' }}
  popup
/>
```

### Column Headers (day numbers)
RBC renders these natively. Styled via CSS:
- `.rbc-header`: day abbrev (SUN/MON…) 9px uppercase + date number 18px below
- Today column: `.rbc-today` background `rgba(167,139,250,0.08)`
- Today date number: wrap in a 30×30px circle with `background: #a78bfa`

### Event Chips
`eventPropGetter` sets chip color. `CustomEvent` renders content:

**ScheduleCalendar event chip:**
- Background: engineer's assigned color (from the sidebar palette)
- Border-left: 3px solid case status color (if linked case exists)
- Text: schedule title + engineer name (dimmed, 10px)

**CaseCalendarView event chip:**
- Background: status color (from `STATUS_COLORS[status].bar`)
- Border-left: 3px solid `STATUS_COLORS[status].border`
- Text: case number + client name

### scrollToTime
Set to `new Date(2000, 0, 1, 8, 0, 0)` — RBC uses this to scroll the time grid to 8:00 AM on initial render. Both views use this.

---

## Section 4 — CaseManager Integration

`CaseCalendarView` is rendered by `CaseManager` when `viewMode === 'calendar'`.

**When in calendar mode:**
- The stats grid (`<div className="stats-grid">`) is **hidden** (not rendered) — the Google Calendar layout needs maximum vertical space
- The view-mode toggle buttons (List / Calendar) remain visible above the sidebar layout
- `CaseCalendarView` receives `height: 'calc(100vh - 172px)'` to account for: topbar(48px) + CaseManager padding(20px) + view-toggle row(~52px) + its own top bar (52px) = ~172px total chrome

**View toggle placement:** The List/Calendar toggle stays in `CaseManager`, above where `CaseCalendarView` renders. When switching to calendar mode it collapses the stats grid.

---

## Section 5 — Controlled Date State

Both components need a `currentDate` state to drive RBC navigation from the custom toolbar and mini calendar:

```js
const [currentDate, setCurrentDate] = useState(new Date());
const [currentView, setCurrentView] = useState('week');

// Top bar date label
const dateLabel = useMemo(() => {
  if (currentView === 'week') {
    const start = moment(currentDate).startOf('week');
    const end = moment(currentDate).endOf('week');
    return `${start.format('MMM D')} – ${end.format('D, YYYY')}`;
  }
  if (currentView === 'day') {
    return moment(currentDate).format('dddd, MMMM D, YYYY');
  }
  // month and agenda
  return moment(currentDate).format('MMMM YYYY');
}, [currentDate, currentView]);
```

---

## Section 6 — Files to Create / Modify

| File | Action |
|---|---|
| `src/components/ScheduleCalendar.js` | Major rewrite — Google Calendar layout shell, custom toolbar, sidebar with mini calendar + engineer filter |
| `src/components/CaseCalendarView.jsx` | Major rewrite — same layout shell, sidebar with mini calendar + status filter, no action buttons |
| `src/components/CaseManager.js` | Hide stats grid when `viewMode === 'calendar'`; adjust outer padding/height |
| `src/index.css` | Add CSS for mini calendar date circles, today highlight, sidebar engineer rows |

---

## Verification Checks

1. Both calendars open scrolled to 8 AM (not 12 AM)
2. Today's date has a purple circle in both the top column header and the mini calendar
3. Today's column has a subtle purple background tint in week/day view
4. ‹ › buttons navigate both the main calendar and update the mini calendar month
5. Clicking a date in the mini calendar navigates the main calendar to that week/day
6. View switcher: active view highlighted with gradient, others transparent
7. ScheduleCalendar: toggling an engineer in sidebar hides/shows their events
8. CaseCalendarView: clicking a status in sidebar filters events to that status
9. RBC default toolbar is completely hidden (`toolbar: () => null`)
10. Events show title + engineer name (Schedule) or case# + client (Cases)
11. Cases: stats grid hidden when in calendar view mode
12. Both views: `today` button navigates to current date
