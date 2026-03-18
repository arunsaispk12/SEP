# Dashboard Redesign — Design Spec
**Date:** 2026-03-18
**Status:** Approved
**Component:** `src/components/UnifiedDashboard.js` (primary target)

---

## Overview

Redesign the Service Engineer Planner dashboard with a Glass Premium aesthetic — a dark, deep-space gradient background with frosted glass panels, color-coded glowing borders, and an actionable command-center layout. The goal is operational clarity: managers and admins should immediately see what needs attention (upcoming cases, unassigned cases, pending approvals) and who is available.

---

## Aesthetic

**Background:** `linear-gradient(135deg, #0f0c29, #302b63, #24243e)` applied to the full viewport.

**Glass panels:** `background: rgba(255,255,255,0.07)`, `border: 1px solid rgba(255,255,255,0.12)`, `border-radius: 8–12px`, `backdrop-filter: blur(10px)`.

**Glow accents (border + box-shadow):**
- Purple `#a78bfa` — primary/total metrics
- Green `#34d399` — completed/available/positive
- Amber `#fbbf24` — in-progress/warning
- Red `#f87171` — urgent/unassigned/danger

**Typography:** White for values, `rgba(255,255,255,0.35)` for labels, uppercase + letter-spacing for section headings.

---

## Layout: 3 Rows

### Row 1 — KPI Filter Cards (4 cards, equal-width grid)

Four compact stat cards, each acting as a clickable filter that highlights the relevant cases in Row 2/3.

| Card | Value | Color | Filter effect |
|------|-------|-------|--------------|
| Total Cases | count | Purple | Show all |
| Upcoming | count | Amber | Filter to upcoming |
| Unassigned | count | Red | Filter to unassigned |
| Available Engineers | count | Green | Dim engineers with non-Available status in TeamStatus panel; grey out assigned case bars in Gantt |

**Active state:** Amber top-stripe (3px) + slightly brighter background on the active card. Only one card active at a time. Default: "Total Cases" active.

Each card: value (large, bold, color-matched) + label (tiny, uppercase, muted).

---

### Row 2 — Command Center (3-column grid: 1fr 1.5fr 1fr)

**Left — Team Status**

List of all engineers with:
- Avatar (gradient circle, initials)
- Name
- Status dot + text: Available (green), On Case (red), Travelling (amber)
- Current city

Data source: `engineers` table, cross-referenced with active `cases` schedule.

**Center — Upcoming Cases + Unassigned Cases**

Two stacked sub-sections within the center glass panel:

*Upcoming Cases (top half):*
- List of cases scheduled within the next 7 days
- Each row: case number + client name + date + assigned engineer avatar + status tag
- If KPI filter "Upcoming" is active, this section is highlighted

*Unassigned Cases (bottom half, red-tinted header with ⚠ icon):*
- Cases with no assigned engineer
- Each row: case number + client + location + `+` quick-assign button (opens assignment modal)
- If KPI filter "Unassigned" is active, this section is highlighted

**Right — Pending Approvals**

Two stacked sub-sections:

*Leave Requests:*
- Engineer name + leave dates + type (vacation/sick/personal)
- ✓ Approve / ✕ Reject action buttons inline

*Unconfirmed Assignments:*
- Case + engineer assigned + date
- ✓ Confirm / ✕ Reassign action buttons inline

Empty states: "No pending leave requests" / "All assignments confirmed" with muted text.

---

### Row 3 — Hybrid Gantt Timeline + Case Detail Panel (side by side: ~2.5fr 1fr)

**Left — Weekly Gantt Timeline**

Header row: Mon–Fri dates, today highlighted in purple with `●`.

Engineer rows (one per engineer):
- Small avatar on the left
- Horizontal bar track for the week
- Color bars representing scheduled cases, positioned proportionally by day
- Case name label inside the bar (truncated if needed)
- Hatched pattern bars for approved leave periods (semi-transparent amber, diagonal lines)
- Clicking a case bar opens the Case Detail Panel on the right

Default view: current week. Week navigation: `‹ prev week` / `next week ›` controls.

**Right — Case Detail Panel**

Initially shows a placeholder: "Click a case bar to view details."

When a case bar is clicked:
- Case number + client name (header)
- Status tag (color-coded)
- Assigned engineer (avatar + name)
- Date range
- Location / site
- Description (truncated, expandable)
- Action buttons: "Edit Case" (opens edit modal) and "Update Status" (inline status picker)

Panel slides in smoothly (CSS transition or framer-motion). Closing: `✕` button or clicking outside.

---

## Data Wiring

**EngineerContext** provides: `engineers`, `cases`, `schedules`. These are used for all read operations except pending leaves.

**Direct Supabase calls** (in `UnifiedDashboard` via `useEffect` + `supabaseService`):
- `supabaseService.getLeavesByStatus('pending')` — pending leave requests for the Approvals panel. **Not** from context because `getLeavesOverlappingRange` hard-filters to `status = 'approved'`.

**Field mapping:**
- `cases.scheduled_start` / `cases.scheduled_end` — case date fields for Upcoming filter and Gantt bars
- `cases.assigned_engineer_id` — `null` means unassigned
- `cases.status` — enum: `open` | `assigned` | `in_progress` | `completed` | `cancelled` | `on_hold`
- `engineers.is_available` — used for Available Engineers KPI and status display
- `engineers.location_id` / `engineers.current_location_id` — home vs current location; joined via `location:location_id(name)` and `current_location:current_location_id(name)` (already in `getEngineers()` select)
- `leaves.leave_type` — enum: `annual` | `sick` | `personal` | `emergency` (use this for the Approvals panel display)
- `schedules.start_time` / `schedules.end_time` — schedule blocks for Gantt bars

**KPI formulas:**
- Total Cases: `cases.length`
- Upcoming: `cases.filter(c => c.scheduled_start >= today && c.scheduled_start <= today + 7 days)`
- Unassigned: `cases.filter(c => !c.assigned_engineer_id && c.status !== 'completed' && c.status !== 'cancelled')`
- Available Engineers: `engineers.filter(e => e.is_available).length`

**Engineer status derivation** (in TeamStatus panel):
- "On Case" (red): engineer has a schedule entry with `start_time <= now <= end_time`
- "Travelling" (amber): `current_location_id` is not null AND `current_location_id !== location_id`
- "Available" (green): `is_available = true` AND neither of the above conditions

**"Upcoming Cases"** filter: `cases` where `scheduled_start` is within the next 7 days (inclusive of today), not completed/cancelled.

**"Pending Approvals" — Unconfirmed Assignments:**
Cases with `status === 'assigned'` (assigned but not yet in progress). These represent cases an engineer hasn't started yet. Actions: "Confirm" sets `status = 'in_progress'`; "Reassign" opens the quick-assign modal.

Approval actions (all use context methods to keep in-memory state in sync, not direct service calls):
- Leave approve/reject: call context's `updateLeave(id, { status: 'approved' | 'rejected', approved_by: currentUserId, approved_at: now })`. After the action, remove the leave from the local `pendingLeaves` state (it's no longer pending). The context's `leaves` array (for Gantt bars) will reflect the change since `updateLeave` dispatches `UPDATE_LEAVE`.
- Case confirm: call context's `updateCase(id, { status: 'in_progress' })` — removes it from the Unconfirmed list immediately via optimistic local state
- Case reassign: open quick-assign modal for that case

**Quick-assign modal** (triggered from Unassigned `+` or Reassign button):
- Fields: engineer dropdown (shows `is_available = true` engineers with name + location), scheduled date picker
- On save: `supabaseService.updateCase(id, { assigned_engineer_id, status: 'assigned', scheduled_start })` — then remove the case from the Unassigned list optimistically
- Validates: does not check conflicts in the modal (keep it fast; full conflict check exists in the scheduler tab)
- After save: call context's `updateCase(id, updates)` (dispatches `UPDATE_CASE` to keep in-memory state in sync — do NOT call `supabaseService.updateCase` directly)

**Update Status picker** (Case Detail Panel):
- Valid transitions from current status: `open → assigned → in_progress → completed | on_hold | cancelled`
- UI: button group showing only valid next statuses (e.g. if `in_progress`, show `completed`, `on_hold`, `cancelled`)
- On select: call context's `updateCase(id, { status: newStatus })` (keeps in-memory state in sync) + toast confirmation + close detail panel

**Gantt bar positioning** (day-level, Mon–Fri week view):
- Data source: `schedules` joined with case title — each schedule block = one bar
- Week = Mon 00:00 to Sun 23:59; bars only rendered if `start_time` falls within the current week Mon–Fri
- Each column = 1 day (20% of track width). Bars span from start day column to end day column (day-of-week derived from `start_time` and `end_time`)
- Multi-day cases that started before the current week: bar starts at Monday edge (left = 0%)
- Leave bars: from `leaves` where `status = 'approved'` and overlaps the current week; use `getLeavesOverlappingRange(weekStart, weekEnd)` which already filters to approved; rendered as hatched amber overlay on that engineer's row
- Weekend overflow: cases with `scheduled_end` on Saturday/Sunday are clamped to Friday edge; no Saturday/Sunday columns shown
- Bar click → set `selectedCase` state → Case Detail Panel opens

---

## Component Structure

```
UnifiedDashboard.js
├── DashboardKPIBar           (Row 1 — 4 filter cards)
├── CommandCenter             (Row 2 wrapper — 3-col grid)
│   ├── TeamStatusPanel       (left)
│   ├── CasesPanel            (center — upcoming + unassigned)
│   └── PendingApprovalsPanel (right)
└── TimelineSection           (Row 3 wrapper)
    ├── WeeklyGantt           (left — Gantt chart)
    └── CaseDetailPanel       (right — slide-in detail)
```

All components live in `src/components/dashboard/` as separate files. `UnifiedDashboard.js` becomes a thin orchestrator that imports them and passes shared state (active KPI filter, selected case for detail panel).

---

## Shared State (UnifiedDashboard level)

```js
const [activeFilter, setActiveFilter] = useState('total'); // 'total' | 'upcoming' | 'unassigned' | 'available'
const [selectedCase, setSelectedCase] = useState(null);    // case object or null
const [currentWeekStart, setCurrentWeekStart] = useState(startOfCurrentWeek);
```

---

## Responsiveness

- Minimum supported width: 1024px (desktop-first, this is an internal ops tool)
- Row 2 collapses to 1-column stack on screens < 768px (mobile fallback, not primary concern)
- Row 3 Gantt hides detail panel on narrow screens; detail opens as modal instead

---

## Accessibility & Error States

- Color is never the only indicator — status dots include text labels
- Loading state: skeleton shimmer on each glass panel while data loads
- Empty states: descriptive text, not blank panels
- Error state: toast notification via existing `react-hot-toast` setup

---

## Out of Scope

- Notification bell / real-time push notifications (future iteration)
- Map view of engineer locations
- Dark/light theme toggle
- Mobile-native layout optimization
