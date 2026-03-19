# Unified Calendar Design

## Overview

Replace the two separate calendar components (`ScheduleCalendar` and `CaseCalendarView`) with a single `UnifiedCalendar` that treats cases as the sole source of truth for scheduled work. A schedule is a case appointment — there is no separate schedule concept.

## Problem

The current architecture splits the same workflow across two components:

- `ScheduleCalendar` — reads from the `schedules` table, lives in its own app tab
- `CaseCalendarView` — reads from the `cases` table, lives as a toggle inside the Cases tab
- `scheduleCaseSyncService` — exists solely to keep these two tables in sync

This forces admins to create a case, then separately create a schedule and link it back. It produces sync bugs and duplicates the calendar infrastructure (same layout, same FullCalendar setup, same views).

## Solution

One `UnifiedCalendar` component reading from `cases` only. Cases already have `scheduled_start`, `scheduled_end`, and `assigned_engineer_id` — everything needed to show them on a calendar. The schedules table stops being written to. The sync service is removed.

---

## Data Model

### New column: `cases.case_type`

```sql
ALTER TABLE cases
ADD COLUMN case_type text NOT NULL DEFAULT 'client_work'
CHECK (case_type IN ('client_work', 'internal'));
```

- `client_work` — normal case for a client (default, all existing cases)
- `internal` — non-client block: training, travel, internal meetings. `client_name` is optional/empty for this type.

### Cases table — existing fields used

The cases table already has everything needed:

| Field | Type | Notes |
|-------|------|-------|
| `assigned_engineer_id` | uuid FK | which engineer |
| `scheduled_start` | timestamptz | event start |
| `scheduled_end` | timestamptz | event end |
| `status` | text | open / assigned / in_progress / completed / on_hold / cancelled |
| `priority` | text | low / normal / high / urgent |
| `client_name` | text | free-text client name (no FK — cases store name directly) |
| `location_id` | int FK | resolved to `location` string by EngineerContext at load time |
| `title` | text | case title |
| `description` | text | details |

> **Note:** Cases do not have a `case_number` column. Display uses `'#' + id.slice(0, 6)` as the reference label. `client_name` is a plain text field (not a FK to the clients table) — the "add new client" inline form from ScheduleCalendar does not apply here.

### Status values

Use the 6 values defined by the database constraint: `open`, `assigned`, `in_progress`, `completed`, `on_hold`, `cancelled`. The additional statuses in CaseManager UI (`travelling`, `reached_centre`, etc.) are out of scope for this spec.

### Schedules table

Stop writing new records. Keep existing data in place (historical). No migration needed.

### deleteCase in EngineerContext

`deleteCase` exists in `supabaseService` but is not currently exposed by `EngineerContext`. It must be added to the context's value as part of this implementation.

---

## Component Architecture

### New: `src/components/UnifiedCalendar.jsx`

Self-contained component. Reads from `EngineerContext` (cases, engineers, locations, leaves). Mounted in `App.js` when `activeTab === 'calendar'`.

**Layout:** gcal-layout shell (unchanged CSS) — topbar + sidebar + main FullCalendar.

### Removed

- `src/components/ScheduleCalendar.js` — deleted
- `src/components/CaseCalendarView.jsx` — deleted
- `src/services/scheduleCaseSync.js` — deleted

### Modified

- `src/App.js` — replace `import ScheduleCalendar` + `<ScheduleCalendar />` with `import UnifiedCalendar` + `<UnifiedCalendar />`
- `src/context/EngineerContext.js` — expose `deleteCase` (wraps existing `supabaseService.deleteCase`)
- `src/components/CaseManager.js`:
  - Remove `import CaseCalendarView`
  - Remove calendar toggle button (`viewMode` state, list/calendar switch)
  - Remove `Sync with Schedules` button and `handleSyncWithSchedules` function
  - Remove `import scheduleCaseSyncService`

---

## UnifiedCalendar — Detailed Design

### State

```js
const [currentDate, setCurrentDate] = useState(new Date());
const [currentView, setCurrentView] = useState('timeGridWeek');
const [hiddenEngineers, setHiddenEngineers] = useState(new Set());
const [activeStatus, setActiveStatus] = useState(null); // null = all
const [showModal, setShowModal] = useState(false);
const [editingCase, setEditingCase] = useState(null);
const [selectedEvent, setSelectedEvent] = useState(null);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [formData, setFormData] = useState({
  case_type: 'client_work',
  title: '',
  client_name: '',
  engineerId: '',
  location: '',
  start: new Date(),
  end: new Date(),
  priority: 'normal',
  description: '',
});
const calendarRef = useRef(null);
```

### Sidebar

**Engineer section (top):**
- Label: "Engineers"
- One row per engineer: colored dot + name, click to toggle visibility
- `ENGINEER_COLORS` palette (8 colors), `hiddenEngineers` Set

**Status section (below engineers):**
- Label: "Status"
- Rows: All / Open / Assigned / In Progress / Completed / On Hold / Cancelled
- Each shows a count badge. `activeStatus === null` = All.

**Unscheduled section (bottom):**
- Label: "Unscheduled (N)" where N = count of cases with no `scheduled_start`
- Collapsed by default, click the label to expand
- Expanded state shows a scrollable list of unscheduled case titles (max height 160px, overflow-y scroll)
- Each row is clickable — opens the case edit form pre-filled so the admin can add a date
- No drag-to-schedule; click-to-edit is sufficient for now

### Topbar

```
[Unified Calendar] | [Today][‹][›][date label] [Month][Week][Day][Agenda] | [+ New Case]
```

`+ New Case` button: hidden when `profile.role === 'engineer'`.

### Events

Cases with a `scheduled_start` are shown as FullCalendar events.

**fcEvents mapping:**
```js
const fcEvents = useMemo(() => {
  let filtered = scheduledCases;
  if (activeStatus) filtered = filtered.filter(c => c.status === activeStatus);
  filtered = filtered.filter(c => !hiddenEngineers.has(c.assigned_engineer_id));

  return filtered.map(c => {
    const engColor = engineerColorMap[c.assigned_engineer_id] || '#6b7280';
    const statusColor = STATUS_COLORS[c.status]?.border || '#6b7280';
    const isOwn = c.assigned_engineer_id === user?.id;
    const dim = isEngineerRole && !isOwn;
    return {
      id: String(c.id),
      title: c.case_type === 'internal'
        ? `[Internal] ${c.title}`
        : `#${c.id.slice(0, 6)} — ${c.client_name || 'No client'}`,
      start: new Date(c.scheduled_start),
      end: c.scheduled_end
        ? new Date(c.scheduled_end)
        : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
      backgroundColor: c.case_type === 'internal' ? 'rgba(100,116,139,0.4)' : engColor,
      borderColor: statusColor,
      textColor: dim ? 'rgba(255,255,255,0.4)' : '#fff',
      extendedProps: { case: c, dim },
    };
  });
}, [scheduledCases, activeStatus, hiddenEngineers, engineerColorMap, user?.id, isEngineerRole]);
```

### New / Edit Case Form

Triggered by: clicking empty slot (new), `+ New Case` button (new), edit action in popup (edit), clicking unscheduled case (edit).

Fields:

| Field | Notes |
|-------|-------|
| Case Type | Toggle: `Client Work` / `Internal`. Controls client_name visibility. |
| Title | Required text input |
| Client Name | Text input. Shown only when `case_type === 'client_work'`. Free text (no FK). |
| Engineer | Select dropdown. Default: "Unassigned". Optional. |
| Location | LocationCombobox (existing component) |
| Start / End | datetime-local inputs. Required. |
| Priority | Select: Low / Normal / High / Urgent |
| Description | textarea, optional |

On submit: calls `addCase(data)` or `updateCase(id, data)` from EngineerContext. No schedule record created.

### Case Detail Popup (click event)

Shows: title, case reference (`#` + id slice), client name, assigned engineer with status dot, location, priority badge, status badge, scheduled time range.

**Admin / Manager actions:**
- Edit button — opens form pre-filled
- Delete button — shows inline confirm ("Delete this case?") → calls `deleteCase(id)`

**Engineer — own case** (`assigned_engineer_id === user.id`):
- Status selector: can move to `in_progress` or `completed` only
- Calls `updateCase(id, { status })`

**Engineer — others' case:**
- Read-only popup, no action buttons

### Engineer Status Transition (own cases only)

Engineers can advance their own case status forward:
- `open` → can set to `in_progress`
- `assigned` → can set to `in_progress`
- `in_progress` → can set to `completed`

No backwards movement. Implemented as a select showing only the valid next statuses.

---

## Role Summary

| Capability | Admin / Manager | Engineer |
|---|---|---|
| See all cases on calendar | ✅ | ✅ (others dimmed) |
| Create new case | ✅ | ❌ (button hidden) |
| Edit case (all fields) | ✅ | ❌ |
| Update own case status | ✅ | ✅ (forward only) |
| Delete case | ✅ | ❌ |
| Filter by engineer / status | ✅ | ✅ |

---

## What Gets Removed

| Item | Action |
|------|--------|
| `src/components/ScheduleCalendar.js` | Deleted |
| `src/components/CaseCalendarView.jsx` | Deleted |
| `src/services/scheduleCaseSync.js` | Deleted |
| CaseManager calendar toggle button + viewMode state | Removed |
| CaseManager "Sync with Schedules" button + handler | Removed |
| CaseManager `import scheduleCaseSyncService` | Removed |
| CaseManager `import CaseCalendarView` | Removed |

---

## Migration Notes

- Existing cases with `scheduled_start` appear on the unified calendar immediately — no data migration
- `case_type` defaults to `'client_work'` so all existing cases remain valid
- Existing schedules remain in the DB untouched (historical records)
- `deleteCase` needs to be added to EngineerContext before implementation begins
