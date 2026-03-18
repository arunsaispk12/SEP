# ScheduleCalendar Enhancements Design Spec
**Date:** 2026-03-18
**Scope:** Three targeted enhancements to `ScheduleCalendar.js` — location combobox, client field with inline add, and Google Calendar-style calendar views with cases data and engineer status highlights. Plus address field in `ClientManagement.js`.

---

## Overview

`ScheduleCalendar.js` is the schedule management page (accessible to all roles). Three gaps are addressed:
1. **Location field** — currently a `<select>` of preset locations. Replace with a combobox that accepts freeform text and suggests from preset locations.
2. **Client field** — missing entirely from the add/edit form. Add as an optional dropdown with an inline "Add new client" expansion (which includes an address field). Requires a `client_id` column added to the `schedules` table.
3. **Calendar views** — currently uses react-big-calendar defaults with a verbose `CustomEvent` renderer in all views. Rebuild as Google Calendar-style: compact event bars in week/month/day, click-to-open glass popup with full details including linked case data and engineer current status.

---

## Approved Design

### Section 1 — Location Combobox

**Pattern:** Glass text input + floating suggestions dropdown. Not a native `<datalist>` (poor dark theme support).

**Behavior:**
- Input is always free text — user can type any location string
- As user types, a floating list below shows matching entries from `locations` context (string array derived from `locationObjects`), filtered case-insensitively
- Clicking a suggestion fills the input and closes the dropdown
- On form submit: `handleSubmit` already resolves the typed string → `locationObjects.find(l => l.name === formData.location)?.id` → `location_id` (existing logic, unchanged). If no match, `location_id` is `null` — the schedule saves without a location FK. No new column needed.
- Dropdown closes on outside click via `useRef` + `useEffect` listening to `mousedown`
- Max 8 suggestions shown, scrollable

**Component:** Inline in `ScheduleCalendar.js` — no separate file. Named `LocationCombobox`.

**State:** Controlled by existing `formData.location` (string).

---

### Section 2 — Client Field

**Database migration (required):**
```sql
alter table public.clients add column if not exists address text;
alter table public.schedules add column if not exists client_id integer references public.clients(id) on delete set null;
```
Update `src/database/schema.sql`:
- Add `address text,` to `clients` table (after `mobile text,`)
- Add `client_id integer references public.clients(id) on delete set null,` to `schedules` table (after `case_id`)

**Client select dropdown:**
- Rendered below the Location field in the add/edit form
- Options sourced from `clients` array — `useEngineerContext()` already exposes it
- Optional (no `required` attribute)
- `formData.client_id` (integer or null) added to form state and `resetForm`
- Props `prefilledClientId` / `prefilledClientName` on `ScheduleCalendar` — when set, render locked read-only display (gradient initials circle + name) instead of `<select>`. For future use from case context; default `null`.

**Inline "Add new client" expansion:**
- A `+ Add new client` text button below the client select (hidden when pre-filled/locked)
- Clicking slides down an inline form (no modal) with fields:
  - Name (required)
  - Contact person
  - Mobile
  - Address (new field)
  - Location — same `LocationCombobox` pattern; optional; resolves to `location_id` on save
- On submit: calls `addClient({ name, contact_person, mobile, address, location_id, created_by: user.id })`. `addClient` returns the created client object — auto-select it as `formData.client_id` and collapse the expansion.
- On cancel: collapse without saving.

**Address field in `ClientManagement.js`:**
- Add `address` text input to existing add/edit modal (below Mobile field)
- Add `address: ''` to `formData` initial state and `resetForm`
- Pass `address` in `addClient`/`updateClient` payload

---

### Section 3 — Google Calendar-Style Calendar Views

**Toolbar:**
- Keep the default react-big-calendar toolbar — existing `.rbc-toolbar` CSS in `index.css` already provides glass styling. No custom toolbar.

**View tracking:**
- Add `currentView` state: `const [currentView, setCurrentView] = useState('week')`
- Pass `onView={v => setCurrentView(v)}` to `<Calendar>`
- `CustomEvent` receives `currentView` via closure (component defined inside `ScheduleCalendar`)

**Event rendering:**
- `components={{ event: CustomEvent }}` applied to all views
- `CustomEvent` checks `currentView`:
  - **week/month/day:** compact — `[status-dot] Title — Engineer name` (single line, truncated)
  - **agenda:** verbose — title, location name, engineer name, priority badge

**Engineer status:**
- Use `getEngineerStatus(engineer, schedules)` from `src/components/dashboard/dashboardUtils.js` — returns `'available' | 'on_case' | 'travelling'`
- Color from `ENGINEER_STATUS_CONFIG[status].color` (same file): available `#34d399`, on_case `#f87171`, travelling `#fbbf24`
- Status dot: 6px colored circle at left edge of event bar
- If `schedule.engineer_id` is null: no status dot, engineer section in popup shows "Unassigned" in muted text

**Event colors (priority-based via `eventPropGetter`):**
```js
const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high:   '#f59e0b',
  normal: '#3b82f6',
  low:    '#22c55e',
};
```
- Schedule events: `backgroundColor: PRIORITY_COLORS[schedule.priority] || '#6b7280'`
- Leave events: `backgroundColor: 'rgba(255,255,255,0.08)'`, `border: '1px dashed rgba(255,255,255,0.25)'`, `color: rgba(255,255,255,0.45)`, opacity 0.7

**Case-linked accent bar:**
- If `schedule.case_id` is non-null, apply `borderLeft: '3px solid STATUS_COLORS[linkedCase.status].border'` on the event bar
- `linkedCase = cases?.find(c => c.id === schedule.case_id)` — `cases` from `useEngineerContext()`
- Key: `linkedCase.status` (values: `open`, `assigned`, `in_progress`, `completed`, `on_hold`, `cancelled`)
- If case not found: no accent bar

**Role-based dimming:**
- Engineer role (`profile.role === 'engineer'`): own assigned schedules (`schedule.engineer_id === user.id`) at full opacity, others at opacity `0.5`
- All other roles: full opacity

**Leave events click guard:**
In `handleSelectEvent`, guard at top:
```js
if (typeof event.id === 'string' && event.id.startsWith('leave-')) return;
```
Leave events are not editable — clicking them does nothing.

**Click → Glass event popup:**

Clicking a schedule event opens a glass popup. The existing edit form modal remains unchanged — Edit action in the popup opens it.

**Popup state:** `selectedEvent` (schedule object or null) + `showEventPopup` boolean.

**Popup positioning:** `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)` with `width: min(480px, 90vw)`. Full-viewport semi-opaque backdrop (`rgba(15,12,41,0.7)`), click closes. Escape key also closes (via `useEffect` on keydown). This is not inside the calendar scroll container so fixed positioning is reliable.

**Popup contents:**
```
[Title]                                    [× close]
Mon 18 Mar · 09:00 – 11:00

[Priority badge]  [Schedule status badge]

📍 Location name

👤 Engineer section:
   [Avatar initials]  Engineer Name
   Role  ·  [status dot] Status label     ← from getEngineerStatus
   (or "Unassigned" in muted text if null engineer)

🔗 Linked Case (only if case_id non-null):
   [Case number pill]  Case title
   [Case status badge from STATUS_COLORS]

🏢 Client (only if client_id non-null):
   Client name from clients array

📝 Description (only if non-empty):
   Muted text

[Edit]  [Delete]
```
Delete: inline confirm replaces button row ("Delete this schedule?" + Confirm / Cancel). On Confirm: call `deleteSchedule(schedule.id)`, close popup.

**Data lookups (all from EngineerContext, no new queries):**
- Engineer: `getEngineerById(schedule.engineer_id)`
- Engineer status: `getEngineerStatus(engineer, schedules)` + `ENGINEER_STATUS_CONFIG`
- Linked case: `cases.find(c => c.id === schedule.case_id)`
- Client: `clients.find(c => c.id === schedule.client_id)`
- Location name: `locationObjects.find(l => l.id === schedule.location_id)?.name || schedule.location || '—'`

---

## Pre-existing Bug Fix Required

`addClient`, `updateClient`, `deleteClient` are defined in `EngineerContext.js` but NOT included in the context `value` useMemo (line 679–706). `ClientManagement.js` already imports and calls them — this means client CRUD is currently broken. The implementer must add all three to the `value` object AND the `useMemo` dependency array as part of this task.

---

## Schedule Event Resource Shape

The current `scheduleEvents` mapping (lines 54–67 of ScheduleCalendar.js) only stores derived `engineer` object and `location` string in `resource`. For the new popup and case-accent-bar to work, the resource must also carry the raw `schedule` object (or at minimum `schedule.case_id`, `schedule.engineer_id`, `schedule.client_id`). The implementer must update the event mapping to include the full `schedule` source object in `resource.schedule`.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/context/EngineerContext.js` | Add `addClient`, `updateClient`, `deleteClient` to context value + useMemo deps |
| `src/components/ScheduleCalendar.js` | Major update — combobox, client field, event popup, view-aware CustomEvent, role dimming |
| `src/components/ClientManagement.js` | Add address field to add/edit form + formData |
| `src/index.css` | Add popup overlay/panel styles, combobox dropdown styles |
| `src/database/schema.sql` | Add `address` to clients; add `client_id` to schedules |
| Supabase migration | `clients.address` + `schedules.client_id` |

---

## Verification Checks

1. Location combobox accepts freeform text; floating dropdown shows matching preset locations; clicking suggestion fills input; outside click closes dropdown
2. `location_id` resolved correctly on submit when text matches a preset; null when freeform
3. Client dropdown lists all clients; selecting one saves `client_id` on schedule
4. "+ Add new client" expansion slides down with name/contact/mobile/address/location fields; submit creates client and auto-selects it
5. Address field present in `ClientManagement.js` add/edit modal
6. Supabase `clients` table has `address` column; `schedules` table has `client_id` column
7. Week/month/day: compact event bars with priority color background + engineer status dot
8. Case-linked schedules show 3px left accent bar in case status color
9. Leave events: muted all-day blocks; clicking them does nothing
10. Clicking a schedule event opens fixed-centered glass popup with all sections
11. Popup engineer status uses `getEngineerStatus()` → `ENGINEER_STATUS_CONFIG` labels/colors
12. Popup delete: inline confirm before deletion
13. Popup Edit: opens existing modal pre-filled
14. Engineer role: own schedules full opacity, others at 0.5
15. Null engineer: popup shows "Unassigned", no status dot, no crash
16. Escape key and backdrop click dismiss popup
17. Mobile: popup `min(480px, 90vw)` centered, not clipped
