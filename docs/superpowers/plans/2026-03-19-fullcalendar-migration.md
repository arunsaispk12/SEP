# FullCalendar Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `react-big-calendar` with FullCalendar in `ScheduleCalendar.js` and `CaseCalendarView.jsx` so both calendars render a proper Google Calendar-style week grid (horizontal day columns) and month grid (date cells), scrolled to 8 AM, inside the existing gcal-layout shell.

**Architecture:** Install FullCalendar packages, swap the `<Calendar>` (RBC) component for `<FullCalendar>` in both files, remap event data to FullCalendar's format, and replace all `.rbc-*` CSS overrides with ~15 FullCalendar CSS variable overrides for the dark glass theme. The gcal-layout shell (topbar, sidebar, MiniCalendar, filter list) is unchanged.

**Tech Stack:** `@fullcalendar/react ^6`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction` — React 18, existing dark glass CSS design system.

---

## File Map

| File | Change |
|------|--------|
| `package.json` | Add 4 FullCalendar packages |
| `src/components/ScheduleCalendar.js` | Remove RBC import/localizer, add FullCalendar import, replace `<Calendar>` with `<FullCalendar>`, remap events to FC format, map callbacks |
| `src/components/CaseCalendarView.jsx` | Same swap as above |
| `src/index.css` | Remove 3 blocks of `.rbc-*` CSS (lines 573–614, 712–850, 1131–1221), add FullCalendar dark theme CSS variables block |

---

## Task 1: Install FullCalendar packages

**Files:**
- Modify: `package.json`

> FullCalendar v6 ships as separate plugin packages. All four are needed: `react` (wrapper), `daygrid` (month view), `timegrid` (week/day views), `interaction` (click/drag/select).

- [ ] **Step 1: Install packages**

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

Expected output: Added 4 packages, no peer dependency errors.

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@fullcalendar/react'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install fullcalendar packages"
```

---

## Task 2: Replace RBC CSS with FullCalendar dark theme

**Files:**
- Modify: `src/index.css`

> Remove three blocks of `.rbc-*` CSS that fought with our layout. Add FullCalendar CSS variable overrides (~15 rules) for the dark glass theme. FullCalendar uses CSS custom properties on `.fc` — much cleaner than RBC's deeply nested class system.

The three blocks to remove:
- Block A: lines 573–614 (early `.rbc-calendar`, `.rbc-event`, `.rbc-toolbar`, and `.rbc-toolbar button.rbc-active` rules)
- Block B: lines 712–850 (`/* ===== react-big-calendar dark theme ===== */` section)
- Block C: lines 1131–1221 (`/* RBC overrides for gcal layout */` section)

- [ ] **Step 1: Remove Block A** — delete lines 573–614 from `src/index.css`

Delete from `.rbc-calendar {` through `.rbc-toolbar button.rbc-active { ... }` (the entire contiguous block of early RBC rules). Use the Edit tool to find and delete this block starting with:
```
.rbc-calendar {
  height: 100% !important;
}
```
and ending at the closing `}` of `.rbc-toolbar button.rbc-active { ... }` block.

- [ ] **Step 2: Remove Block B** — delete lines 712–850 from `src/index.css`

Delete from `/* ===== react-big-calendar dark theme ===== */` through the closing `}` of the `@media (max-width: 640px)` block that ends the section (ending at `}` before `/* Location combobox dropdown */`).

- [ ] **Step 3: Remove Block C** — delete lines 1131–1221 from `src/index.css`

Delete from `/* RBC overrides for gcal layout */` through the end of `.gcal-main .rbc-agenda-view { ... }`.

- [ ] **Step 4: Add FullCalendar dark theme block**

Append this block to `src/index.css` (after the last existing rule):

```css
/* ===== FullCalendar dark glass theme ===== */
.fc {
  --fc-border-color: rgba(255, 255, 255, 0.08);
  --fc-today-bg-color: rgba(167, 139, 250, 0.08);
  --fc-now-indicator-color: #a78bfa;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: rgba(255, 255, 255, 0.03);
  --fc-event-border-color: transparent;
  --fc-event-text-color: #fff;
  --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.06);
  height: 100%;
  color: #e2e8f0;
}

/* Column headers (day names + date numbers) */
.fc .fc-col-header-cell {
  background: rgba(15, 12, 41, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 6px 0;
  color: #a78bfa;
  font-weight: 600;
  font-size: 12px;
}

/* Today column header highlighted */
.fc .fc-col-header-cell.fc-day-today {
  background: rgba(167, 139, 250, 0.12);
}

/* Time gutter labels */
.fc .fc-timegrid-slot-label {
  color: #64748b;
  font-size: 11px;
}

/* Time grid lines */
.fc .fc-timegrid-slot {
  height: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.04) !important;
}

/* Events */
.fc .fc-event {
  border-radius: 4px;
  border: none;
  font-size: 11px;
  padding: 1px 3px;
  cursor: pointer;
}

.fc .fc-event-title {
  font-size: 11px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Month view cells */
.fc .fc-daygrid-day {
  min-height: 80px;
}

.fc .fc-daygrid-day-number {
  color: #94a3b8;
  font-size: 12px;
  padding: 4px 6px;
}

.fc .fc-day-today .fc-daygrid-day-number {
  background: #a78bfa;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2px;
}

/* Off-month dates dimmed */
.fc .fc-day-other .fc-daygrid-day-number {
  color: #475569;
}

.fc .fc-day-other {
  background: rgba(13, 17, 23, 0.3);
}

/* Scrollable time grid container */
.gcal-main .fc {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.gcal-main .fc .fc-view-harness {
  flex: 1;
  min-height: 0;
}

/* No border on calendar wrapper */
.fc-theme-standard .fc-scrollgrid {
  border: none;
}

.fc-theme-standard td,
.fc-theme-standard th {
  border-color: rgba(255, 255, 255, 0.07);
}

/* "more events" link */
.fc .fc-daygrid-more-link {
  color: #a78bfa;
  font-size: 11px;
}

/* Agenda/list view */
.fc .fc-list-day-cushion {
  background: rgba(167, 139, 250, 0.08);
}

.fc .fc-list-event:hover td {
  background: rgba(255, 255, 255, 0.05);
}
```

- [ ] **Step 5: Verify CSS compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: No CSS errors.

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "style: replace rbc CSS with fullcalendar dark theme overrides"
```

---

## Task 3: Migrate ScheduleCalendar.js to FullCalendar

**Files:**
- Modify: `src/components/ScheduleCalendar.js`

> FullCalendar uses a different event shape and callback API than RBC. Events need `id`, `title`, `start`, `end`, `backgroundColor`, `borderColor`, `extendedProps` (for custom data). Callbacks: `select` (slot click) replaces `onSelectSlot`; `eventClick` replaces `onSelectEvent`; `datesSet` replaces `onNavigate`+`onView`. The `view` prop is controlled via a `ref` to the FullCalendar instance.

**Key API differences:**
- `initialView` values: `"timeGridWeek"`, `"timeGridDay"`, `"dayGridMonth"`, `"listWeek"` (not `week/day/month/agenda`)
- `scrollTime`: `"08:00:00"` string (not a Date object)
- `headerToolbar={false}` — disables built-in toolbar (we have our own)
- `selectable={true}` enables slot selection
- `select` callback receives `{ start, end, allDay }`
- `eventClick` callback receives `{ event }` where `event.extendedProps` holds custom data
- `initialDate` sets starting date; use `calendarRef.current.getApi().gotoDate(date)` to navigate programmatically
- `calendarRef.current.getApi().changeView(viewName)` to change view

- [ ] **Step 1: Add FullCalendar imports, remove RBC imports**

Replace at the top of `src/components/ScheduleCalendar.js`:

```js
// REMOVE these two lines:
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

// ADD these lines:
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRef } from 'react';
```

Also remove `const localizer = momentLocalizer(moment);` (line 13).

Keep the `moment` import only if it is used elsewhere in the file (it IS used in `dateLabel` useMemo and `navigate` function — keep it).

So the final imports should be:
```js
import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import scheduleCaseSyncService from '../services/scheduleCaseSync';
import toast from 'react-hot-toast';
import { getEngineerStatus, ENGINEER_STATUS_CONFIG, STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';
```

- [ ] **Step 2: Add calendarRef**

Inside the `ScheduleCalendar` component, after the existing state declarations, add:

```js
const calendarRef = useRef(null);
```

- [ ] **Step 3: Update navigate() to use FullCalendar API**

Replace the existing `navigate` function:

```js
function navigate(direction) {
  const api = calendarRef.current?.getApi();
  if (!api) return;
  direction === 'PREV' ? api.prev() : api.next();
}
```

- [ ] **Step 4: Add handleToday function**

Replace the inline `setCurrentDate(new Date())` in the Today button with a function, and also sync state:

```js
function handleToday() {
  calendarRef.current?.getApi().today();
  setCurrentDate(new Date());
}
```

- [ ] **Step 5: Update view switcher to use FC view names**

FullCalendar view name mapping:
- `'month'` → `'dayGridMonth'`
- `'week'` → `'timeGridWeek'`
- `'day'` → `'timeGridDay'`
- `'agenda'` → `'listWeek'`

Update the view switcher state and `currentView` references. Keep `currentView` in the React state as the FC view name string (`'timeGridWeek'` etc.). Update the toolbar buttons:

```jsx
{[
  { label: 'Month', value: 'dayGridMonth' },
  { label: 'Week',  value: 'timeGridWeek' },
  { label: 'Day',   value: 'timeGridDay' },
  { label: 'Agenda', value: 'listWeek' },
].map(({ label, value }) => (
  <button
    key={value}
    className={`gcal-view-btn${currentView === value ? ' active' : ''}`}
    onClick={() => {
      setCurrentView(value);
      calendarRef.current?.getApi().changeView(value);
    }}
  >
    {label}
  </button>
))}
```

- [ ] **Step 6: Update dateLabel useMemo to use FC view names**

```js
const dateLabel = useMemo(() => {
  if (currentView === 'timeGridWeek') {
    const s = moment(currentDate).startOf('week');
    const e = moment(currentDate).endOf('week');
    return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
  }
  if (currentView === 'timeGridDay') return moment(currentDate).format('dddd, MMMM D, YYYY');
  return moment(currentDate).format('MMMM YYYY');
}, [currentDate, currentView]);
```

- [ ] **Step 7: Remap events to FullCalendar format**

FullCalendar events need `backgroundColor` and `borderColor` as top-level props (not via `eventPropGetter`). Add a `fcEvents` useMemo that maps `filteredEvents` to FC format:

```js
const fcEvents = useMemo(() => filteredEvents.map(ev => {
  if (typeof ev.id === 'string' && ev.id.startsWith('leave-')) {
    return {
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderColor: 'rgba(255,255,255,0.2)',
      textColor: 'rgba(255,255,255,0.4)',
      extendedProps: { ...ev.resource, dim: false },
    };
  }
  const { schedule, engineer, linkedCase } = ev.resource || {};
  const engColor = engineerColorMap[engineer?.id] || '#6b7280';
  const caseAccent = linkedCase ? STATUS_COLORS[linkedCase.status]?.border : null;
  const isOwn = schedule?.engineer_id === user?.id;
  const dim = isEngineerRole && !isOwn;
  return {
    id: String(ev.id),
    title: ev.title,
    start: ev.start,
    end: ev.end,
    backgroundColor: engColor,
    borderColor: caseAccent || engColor,
    textColor: dim ? 'rgba(255,255,255,0.45)' : '#fff',
    extendedProps: { ...ev.resource, dim },
  };
}), [filteredEvents, engineerColorMap, user?.id, isEngineerRole]);
```

- [ ] **Step 8: Replace `<Calendar>` with `<FullCalendar>` in the render**

In the JSX, find `.gcal-main` and replace its contents:

```jsx
{/* Main calendar */}
<div className="gcal-main">
  <FullCalendar
    ref={calendarRef}
    plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
    initialView={currentView}
    initialDate={currentDate}
    headerToolbar={false}
    events={fcEvents}
    selectable
    selectMirror
    scrollTime="08:00:00"
    nowIndicator
    height="100%"
    select={({ start, end }) => {
      setFormData(prev => ({ ...prev, start, end }));
      setShowModal(true);
    }}
    eventClick={({ event }) => {
      const resource = event.extendedProps;
      if (typeof event.id === 'string' && event.id.startsWith('leave-')) return;
      setSelectedEvent({ id: event.id, title: event.title, start: event.start, end: event.end, resource });
      setShowDeleteConfirm(false);
    }}
    datesSet={({ start, view }) => {
      setCurrentDate(start);
      setCurrentView(view.type);
    }}
    eventContent={({ event }) => {
      const resource = event.extendedProps || {};
      const { engineer, engineerStatus } = resource;
      const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', padding: '1px 2px' }}>
          {statusCfg && <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
            {event.title}{engineer ? ` — ${engineer.name}` : ''}
          </span>
        </div>
      );
    }}
  />
</div>
```

- [ ] **Step 9: Update Today button**

Change the Today button's `onClick`:
```jsx
<button className="gcal-today-btn" onClick={handleToday}>Today</button>
```

- [ ] **Step 10: Remove unused RBC-specific code**

- Remove `eventPropGetter` function (no longer used — replaced by FC event props)
- Remove `CustomEvent` component (replaced by `eventContent` inline above)
- Remove the `localizer` line if still present

- [ ] **Step 11: Verify the app starts without errors**

```bash
npm start 2>&1 | head -30
```

Expected: Compiled successfully. No import errors.

- [ ] **Step 12: Commit**

```bash
git add src/components/ScheduleCalendar.js
git commit -m "feat: migrate ScheduleCalendar from react-big-calendar to FullCalendar"
```

---

## Task 4: Migrate CaseCalendarView.jsx to FullCalendar

**Files:**
- Modify: `src/components/CaseCalendarView.jsx`

> Same migration pattern as ScheduleCalendar but simpler — no engineer color map, no modal, no select slot handler. Just view/navigate, status filter, and eventClick → onSelectCase.

- [ ] **Step 1: Replace imports**

```js
// REMOVE:
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

// ADD:
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRef } from 'react';
import moment from 'moment';
```

Full imports after change:
```js
import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import { STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';
```

Remove `const localizer = momentLocalizer(moment);`.

- [ ] **Step 2: Add calendarRef and update navigate/today**

```js
const calendarRef = useRef(null);

function navigate(direction) {
  const api = calendarRef.current?.getApi();
  if (!api) return;
  direction === 'PREV' ? api.prev() : api.next();
}

function handleToday() {
  calendarRef.current?.getApi().today();
  setCurrentDate(new Date());
}
```

- [ ] **Step 3: Update currentView to FC view names, update dateLabel**

Change `useState('week')` to `useState('timeGridWeek')`.

Update `dateLabel`:
```js
const dateLabel = useMemo(() => {
  if (currentView === 'timeGridWeek') {
    const s = moment(currentDate).startOf('week');
    const e = moment(currentDate).endOf('week');
    return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
  }
  if (currentView === 'timeGridDay') return moment(currentDate).format('dddd, MMMM D, YYYY');
  return moment(currentDate).format('MMMM YYYY');
}, [currentDate, currentView]);
```

- [ ] **Step 4: Remap events to FC format**

Replace the `events` useMemo:
```js
const fcEvents = useMemo(() => {
  const filtered = activeStatus ? cases.filter(c => c.status === activeStatus) : cases;
  return filtered
    .filter(c => c.scheduled_start)
    .map(c => {
      const colorObj = STATUS_COLORS[c.status];
      const bgColor = colorObj ? colorObj.bar : 'rgba(107,114,128,0.3)';
      const borderColor = colorObj ? colorObj.border : '#6b7280';
      const isOwn = c.assigned_engineer_id === currentUserId;
      const dimmed = isEngineer && !isOwn;
      return {
        id: String(c.id),
        title: `${c.case_number || '#' + c.id.slice(0, 6)} — ${c.client_name || c.title || 'Case'}`,
        start: new Date(c.scheduled_start),
        end: c.scheduled_end
          ? new Date(c.scheduled_end)
          : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
        backgroundColor: bgColor,
        borderColor,
        textColor: dimmed ? 'rgba(255,255,255,0.4)' : '#fff',
        extendedProps: { case: c },
      };
    });
}, [cases, activeStatus, currentUserId, isEngineer]);
```

- [ ] **Step 5: Update view switcher**

Same pattern as ScheduleCalendar:
```jsx
{[
  { label: 'Month', value: 'dayGridMonth' },
  { label: 'Week',  value: 'timeGridWeek' },
  { label: 'Day',   value: 'timeGridDay' },
  { label: 'Agenda', value: 'listWeek' },
].map(({ label, value }) => (
  <button
    key={value}
    className={`gcal-view-btn${currentView === value ? ' active' : ''}`}
    onClick={() => {
      setCurrentView(value);
      calendarRef.current?.getApi().changeView(value);
    }}
  >
    {label}
  </button>
))}
```

- [ ] **Step 6: Replace `<Calendar>` with `<FullCalendar>`**

```jsx
{/* Main calendar */}
<div className="gcal-main">
  <FullCalendar
    ref={calendarRef}
    plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
    initialView={currentView}
    initialDate={currentDate}
    headerToolbar={false}
    events={fcEvents}
    scrollTime="08:00:00"
    nowIndicator
    height="100%"
    eventClick={({ event }) => {
      onSelectCase?.(event.extendedProps.case);
    }}
    datesSet={({ start, view }) => {
      setCurrentDate(start);
      setCurrentView(view.type);
    }}
    eventContent={({ event }) => (
      <div style={{ overflow: 'hidden', padding: '1px 2px', fontSize: 11, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {event.title}
      </div>
    )}
  />
</div>
```

- [ ] **Step 7: Update Today button**

```jsx
<button className="gcal-today-btn" onClick={handleToday}>Today</button>
```

- [ ] **Step 8: Remove unused code**

Remove `eventPropGetter` function and `CustomEvent` component.

- [ ] **Step 9: Verify no console errors**

```bash
npm start 2>&1 | head -30
```

Expected: Compiled successfully.

- [ ] **Step 10: Commit**

```bash
git add src/components/CaseCalendarView.jsx
git commit -m "feat: migrate CaseCalendarView from react-big-calendar to FullCalendar"
```

---

## Task 5: Remove react-big-calendar dependency

**Files:**
- Modify: `package.json`

> Only remove RBC after both components are migrated. Verify no other file imports from it first.

- [ ] **Step 1: Verify no remaining RBC imports**

```bash
grep -r "react-big-calendar" src/
```

Expected: No output (zero matches).

- [ ] **Step 2: Uninstall RBC**

```bash
npm uninstall react-big-calendar
```

- [ ] **Step 3: Verify app still builds**

```bash
npm run build 2>&1 | tail -10
```

Expected: `Compiled successfully.`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove react-big-calendar dependency"
```

---

## Testing Checklist

After all tasks are done, verify visually in the browser:

- [ ] Week view shows 7 day columns side by side (Sun–Sat), not stacked
- [ ] Week view time gutter starts at 8 AM (not 1 AM)
- [ ] Today's column has a subtle purple tint
- [ ] Month view shows a date grid (not a time grid)
- [ ] Today's date number has a purple circle
- [ ] Events appear as colored chips in both views
- [ ] Clicking a time slot in ScheduleCalendar opens the Add Schedule modal
- [ ] Clicking an event opens the event detail popup
- [ ] Today / Prev / Next toolbar buttons work
- [ ] View switcher (Month/Week/Day/Agenda) works
- [ ] Engineer filter checkboxes hide/show events
- [ ] Status filter works in CaseCalendarView
- [ ] MiniCalendar date click navigates the main calendar
- [ ] No console errors
