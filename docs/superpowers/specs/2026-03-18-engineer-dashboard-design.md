# Engineer Dashboard — Design Spec
**Date:** 2026-03-18
**Status:** Approved
**Target component:** `src/components/EngineerDashboard.js` (replace current implementation)

---

## Overview

A personal dashboard for engineer-role users. Shows today's active case prominently with direct action buttons, this week's schedule as a horizontal timeline, and the engineer's own status controls alongside team awareness. Same Glass Premium aesthetic as the manager dashboard.

Engineers currently land on `UnifiedDashboard` (the manager view) for the `personal` tab — this spec replaces that with a role-appropriate view. In `App.js`, `activeTab === 'personal'` should render `<EngineerDashboard />` instead of `<UnifiedDashboard />`.

---

## Aesthetic

Identical to manager dashboard spec: `linear-gradient(135deg,#0f0c29,#302b63,#24243e)` background, glass panels (`rgba(255,255,255,0.07)` + `backdrop-filter:blur(10px)`), color-coded glowing borders.

---

## Layout: 2 Rows

### Row 1 — Hero Active Case (full width)

A full-width glass card with an amber top-stripe (3px gradient). The engineer's single most actionable item.

**Content:**
- Section label: "Active Case · Today" (muted, uppercase)
- Case title (large, bold, white): e.g. "Case #18 — IVF Equipment Calibration"
- Sub-line: location name + scheduled time range (e.g. "📍 Fertility Centre, Coimbatore · 9:00 AM – 1:00 PM")
- Status tag (color-coded, right-aligned)
- Action buttons (right side, stacked vertically):
  - **"✓ Mark Complete"** (green) — opens `CaseCompletionModal` with `caseId={activeCase.id}`. The `onSave` handler must: (1) call context `updateCase(caseId, { status: 'completed', completion_details: completionData, actual_end: now })`, (2) show a success toast, (3) close the modal. `onClose` simply closes the modal.
  - **"⟳ Update Status"** (amber) — inline status picker showing only valid next statuses from the current state. Since active cases are always `in_progress` or `assigned`, valid options are: from `assigned` → `in_progress` or `cancelled`; from `in_progress` → `completed`, `on_hold`, or `cancelled`. Uses context `updateCase(id, { status })` + toast.

**Empty state:** If no active case today, show a green "All clear" card — "No active cases today. Enjoy your day." with a subtle checkmark icon.

**"Active case" definition:** cases assigned to the current engineer (`assigned_engineer_id === profile.id`) with `status === 'in_progress'`. If multiple, show the one with the earliest `scheduled_start`. If none in `in_progress`, fall back to cases with `status === 'assigned'` scheduled for today.

---

### Row 2 — Two Columns (grid: 1.5fr 1fr), right column internally stacked

Two columns side by side. The right column is itself a flex column container (`display:flex; flex-direction:column; gap:8px`) holding My Status (top) and Team Status (bottom, `flex:1` to fill remaining height).

---

#### Left — This Week (My Schedule)

A horizontal day-by-day timeline showing the engineer's own cases for the current Mon–Fri week.

**Structure:**
- One row per weekday (Mon–Fri), each row: day label + bar track + status tag
- Day label: short name + date number (e.g. "Tue 18"); today highlighted in purple (`#a78bfa`) with `●`
- Bar track: horizontal bar showing the scheduled case for that day (from `schedules` filtered to `engineer_id === profile.id` and within the current week). Bar color + label matches case status:
  - Completed: green (`#34d399`) + "Done" tag
  - In Progress: amber (`#fbbf24`) + "Active" tag
  - Assigned/Scheduled: blue (`#60a5fa`) + "Upcoming" tag
- Empty day: faint track with "No cases" centered in muted text
- Bar label inside the bar: case number + location city (truncated)
- Clicking a bar opens a small popover with case title, client, time, and a "Go to Case" button that switches to the `cases` tab

**Week navigation:** `‹` / `›` controls to navigate prev/next week (updates `currentWeekStart` state).

**Data source:** `schedules` from context. Each schedule object after context mapping retains the raw `engineer_id` field (preserved via `*` spread in the Supabase select). Filter by `schedule.engineer_id === profile.id` and `schedule.start_time` within the current week Mon–Fri. Cross-reference `cases` by `schedule.case_id` for case title, status, and location.

---

#### Right Column — stacked (My Status on top, Team below)

**My Status panel (top):**
- Engineer avatar + name + current status dot + current location city
- **"📍 Log Travel / Change Location"** button (amber) — opens a modal:
  - Location dropdown populated from `locationObjects` (the raw location records array from `EngineerContext` state — these have `id` and `name` fields, not the `locations` string array). Render `option.name`, submit `option.id`.
  - On confirm: calls context `updateEngineer(id, { current_location_id: selectedLocationId, is_available: false })` + toast
- **"✓ Set Available"** button (green) — resets engineer to home location. The engineer object returned by `getEngineers()` includes `location_id` via the `select('*, location:location_id(name), ...')` query — the raw `location_id` integer is preserved on the object via the `*` spread. Call: `updateEngineer(id, { is_available: true, current_location_id: engineer.location_id })`. If `engineer.location_id` is null, omit `current_location_id` from the update. Show toast.
- Current engineer highlighted with a purple ring around their avatar

**Current engineer identity:** sourced from `engineers` in context filtered by `engineers.find(e => e.id === profile.id)`. If not found (engineer profile not yet in engineers table), fall back to `profile` from `useAuth()`.

**Team Status panel (bottom, fills remaining height):**
- Section label: "Team Today"
- List of all engineers (same as manager dashboard Team Status panel):
  - Avatar + name + location city + status dot
  - Current engineer's row highlighted with purple name text and "you" label
  - Status derivation: same rules as manager spec (On Case / Travelling / Available)
- No actions — read-only awareness

---

## Component Structure

```
EngineerDashboard.js
├── ActiveCaseHero          (Row 1 — full width hero card)
│   └── uses CaseCompletionModal (existing component)
└── EngineerWeekPanel       (Row 2 — left: schedule, right: status + team)
    ├── MyWeekTimeline      (left column)
    ├── MyStatusControls    (right top)
    └── TeamStatusPanel     (right bottom — shared with manager dashboard)
```

`TeamStatusPanel` is shared between `EngineerDashboard` and the manager's `CommandCenter`. Extract it to `src/components/dashboard/TeamStatusPanel.jsx` and import in both.

---

## Shared State (EngineerDashboard level)

```js
const [currentWeekStart, setCurrentWeekStart] = useState(startOfCurrentWeek);
const [selectedSchedule, setSelectedSchedule] = useState(null); // for bar popover
```

---

## Data Wiring

- `profile` from `useAuth()` — for `profile.id` to identify the current engineer
- `engineers` from `EngineerContext` — for the engineer's own record and team list
- `cases` from `EngineerContext` — for active case lookup and week bar labels
- `schedules` from `EngineerContext` — for week timeline bars
- `locations` from `EngineerContext` — for Log Travel dropdown
- `updateEngineer` from `EngineerContext` — for status/location updates
- `updateCase` from `EngineerContext` — for status updates (keeps context in sync)

---

## Access Control

- Only rendered for `profile.role === 'engineer'` (or `'executive'` if they share this view in future)
- Engineers cannot see other engineers' cases, only their own — enforced by RLS on the DB (cases policy: `assigned_engineer_id = auth.uid()`)
- The Team Status panel only shows status dots + locations — no case details of colleagues

---

## Responsiveness

- Same as manager spec: desktop-first, minimum 1024px
- Row 2 collapses to single column on < 768px; team panel moves below schedule

---

## Error / Loading / Empty States

- Loading: skeleton shimmer on each panel
- No active case: green "All clear" hero card (see Row 1 section)
- Empty week: all day rows show "No cases"
- Engineer record not found in engineers table: fall back to `profile` from auth context
- All toasts via existing `react-hot-toast`
