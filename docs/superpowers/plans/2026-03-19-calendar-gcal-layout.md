# Calendar Google-Style Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ScheduleCalendar and CaseCalendarView to use a Google Calendar-style layout: left sidebar (mini calendar + filter list) + custom top toolbar replacing RBC's default toolbar + main calendar scrolled to 8 AM.

**Architecture:** Two new shared components (`MiniCalendar`, `CalendarToolbar`) are used by both `ScheduleCalendar.js` and `CaseCalendarView.jsx`. Both views adopt the same three-zone shell: top bar (52px) + sidebar (220px) + main RBC area. Controlled `currentDate` and `currentView` state drives both the toolbar and RBC. `CaseManager.js` hides the stats grid when in calendar mode.

**Tech Stack:** React, react-big-calendar, moment.js, existing glass CSS design system (`rgba(255,255,255,0.06)` panels, `#a78bfa` purple accent)

---

## File Map

| File | Action |
|---|---|
| `src/components/MiniCalendar.jsx` | **Create** — compact month grid, today circle, week highlight, date click |
| `src/components/ScheduleCalendar.js` | **Rewrite** — gcal shell, engineer sidebar filter, all modal/form logic preserved |
| `src/components/CaseCalendarView.jsx` | **Rewrite** — gcal shell, status sidebar filter |
| `src/components/CaseManager.js` | **Modify** — hide stats grid when `viewMode === 'calendar'` |
| `src/index.css` | **Modify** — add gcal layout CSS classes |

---

## Task 1: CSS — gcal layout classes

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Open `src/index.css` and append the following block at the end** (after the last existing rule):

```css
/* ===== Google Calendar Layout ===== */
.gcal-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}

.gcal-topbar {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.gcal-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.gcal-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.gcal-today-btn {
  padding: 5px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.gcal-today-btn:hover { background: rgba(255, 255, 255, 0.12); }

.gcal-nav-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}
.gcal-nav-btn:hover { background: rgba(255, 255, 255, 0.08); }

.gcal-date-label {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.gcal-view-switcher {
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
}

.gcal-view-btn {
  padding: 5px 12px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: capitalize;
  white-space: nowrap;
}
.gcal-view-btn.active {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
}
.gcal-view-btn:not(.active):hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.7); }

.gcal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.gcal-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gcal-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Mini Calendar */
.mini-cal { }

.mini-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mini-cal-month {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.mini-cal-nav {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.mini-cal-nav:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); }

.mini-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  text-align: center;
}

.mini-cal-dow {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.3);
  padding: 2px 0;
  font-weight: 600;
}

.mini-cal-day {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
  padding: 2px 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  margin: 0 auto;
  transition: background 0.1s;
}
.mini-cal-day:hover:not(.today):not(.active-day) { background: rgba(255, 255, 255, 0.1); }
.mini-cal-day.off-month { color: rgba(255, 255, 255, 0.2); }
.mini-cal-day.today { background: #a78bfa; color: #fff; font-weight: 700; }
.mini-cal-day.active-day:not(.today) { background: rgba(167, 139, 250, 0.25); color: #a78bfa; font-weight: 600; }
.mini-cal-week-highlight { background: rgba(167, 139, 250, 0.08); border-radius: 4px; }

/* Filter section */
.gcal-filter-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
}

.gcal-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 5px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
}
.gcal-filter-row:hover { background: rgba(255, 255, 255, 0.06); }

.gcal-filter-color {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  flex-shrink: 0;
}

.gcal-filter-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gcal-filter-count {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

/* RBC overrides for gcal layout */
.gcal-main .rbc-calendar { height: 100% !important; }
.gcal-main .rbc-time-view,
.gcal-main .rbc-month-view,
.gcal-main .rbc-agenda-view { border-radius: 0 !important; border: none !important; height: 100%; }
.gcal-main .rbc-header {
  background: rgba(15, 12, 41, 0.6) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 8px 4px;
  text-align: center;
}
.gcal-main .rbc-header .rbc-button-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  pointer-events: none;
}
```

- [ ] **Step 2: Verify the file saved without syntax errors** — open dev server and confirm no CSS parse errors in console.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add gcal layout CSS classes"
```

---

## Task 2: MiniCalendar component

**Files:**
- Create: `src/components/MiniCalendar.jsx`

- [ ] **Step 1: Create `src/components/MiniCalendar.jsx` with this full content:**

```jsx
// src/components/MiniCalendar.jsx
import React, { useState, useMemo } from 'react';
import moment from 'moment';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Returns array of { day: number|null, date: Date|null, isCurrentMonth: boolean }
function buildCalendarGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];

  // Leading cells from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Trailing cells to complete last row (always fill to multiple of 7)
  let trail = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trail, date: new Date(year, month + 1, trail), isCurrentMonth: false });
    trail++;
  }
  return cells;
}

export default function MiniCalendar({ currentDate, onDateClick, currentView }) {
  const today = useMemo(() => moment().startOf('day'), []);

  // Mini cal month can be navigated independently
  const [miniMonth, setMiniMonth] = useState(() => moment(currentDate).startOf('month'));

  // Keep mini cal in sync when main calendar navigates to a different month
  const currentMoment = moment(currentDate);
  const currentMonthKey = currentMoment.format('YYYY-MM');
  const miniMonthKey = miniMonth.format('YYYY-MM');
  if (currentMonthKey !== miniMonthKey) {
    // Only sync if we're off by more than 1 month to avoid fighting independent navigation
  }

  const cells = useMemo(
    () => buildCalendarGrid(miniMonth.year(), miniMonth.month()),
    [miniMonth]
  );

  const weekStart = useMemo(() => moment(currentDate).startOf('week'), [currentDate]);
  const weekEnd = useMemo(() => moment(currentDate).endOf('week'), [currentDate]);

  function getClassNames(cell) {
    const classes = ['mini-cal-day'];
    if (!cell.isCurrentMonth) classes.push('off-month');
    const d = moment(cell.date).startOf('day');
    if (d.isSame(today)) classes.push('today');
    else if (currentView === 'day' && d.isSame(moment(currentDate).startOf('day'))) classes.push('active-day');
    return classes.join(' ');
  }

  function isInSelectedWeek(cell) {
    if (currentView !== 'week') return false;
    const d = moment(cell.date).startOf('day');
    return d.isSameOrAfter(weekStart) && d.isSameOrBefore(weekEnd);
  }

  // Group cells into rows of 7 for week highlight
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="mini-cal">
      {/* Header */}
      <div className="mini-cal-header">
        <span className="mini-cal-month">{miniMonth.format('MMMM YYYY')}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="mini-cal-nav" onClick={() => setMiniMonth(m => m.clone().subtract(1, 'month'))}>‹</button>
          <button className="mini-cal-nav" onClick={() => setMiniMonth(m => m.clone().add(1, 'month'))}>›</button>
        </div>
      </div>

      {/* Days of week */}
      <div className="mini-cal-grid">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="mini-cal-dow">{d}</div>
        ))}
      </div>

      {/* Date rows */}
      {rows.map((row, ri) => {
        const rowInWeek = row.some(c => isInSelectedWeek(c));
        return (
          <div
            key={ri}
            className={`mini-cal-grid${rowInWeek ? ' mini-cal-week-highlight' : ''}`}
            style={{ borderRadius: 4 }}
          >
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={getClassNames(cell)}
                onClick={() => {
                  onDateClick(cell.date);
                  // Sync mini cal if clicking off-month date
                  if (!cell.isCurrentMonth) {
                    setMiniMonth(moment(cell.date).startOf('month'));
                  }
                }}
              >
                {cell.day}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify file created** — `ls src/components/MiniCalendar.jsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/MiniCalendar.jsx
git commit -m "feat: add MiniCalendar component for gcal sidebar"
```

---

## Task 3: ScheduleCalendar rewrite

**Files:**
- Modify: `src/components/ScheduleCalendar.js` (full rewrite)

Context: This file is ~797 lines. All modal form logic (Add/Edit schedule, inline client form, event popup panel) is preserved exactly. Only the outer shell, toolbar, and event display change.

- [ ] **Step 1: Read the current file** to confirm the modal/form section spans roughly lines 433–793.

- [ ] **Step 2: Replace the full file** with the new content below. The `LocationCombobox` component, all state, all handlers, and all modals are **unchanged** — only the return JSX shell is replaced.

```jsx
// src/components/ScheduleCalendar.js
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import scheduleCaseSyncService from '../services/scheduleCaseSync';
import toast from 'react-hot-toast';
import { getEngineerStatus, ENGINEER_STATUS_CONFIG, STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';

const localizer = momentLocalizer(moment);
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const ENGINEER_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#f97316',
];

// ── LocationCombobox (unchanged) ──────────────────────────────────────────────
const LocationCombobox = ({ value, onChange, locations }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const filtered = (locations || [])
    .filter(l => l.toLowerCase().includes((value || '').toLowerCase()))
    .slice(0, 8);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Type or select location..."
        className="glass-input"
      />
      {open && filtered.length > 0 && (
        <div className="location-combobox-dropdown">
          {filtered.map(loc => (
            <div
              key={loc}
              className="location-combobox-option"
              onMouseDown={() => { onChange(loc); setOpen(false); }}
            >
              {loc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const ScheduleCalendar = () => {
  const {
    schedules, engineers, cases, clients, addClient,
    addSchedule, updateSchedule, deleteSchedule,
    getEngineerById, locations, locationObjects,
    isEngineerOnLeave, leaves
  } = useEngineerContext();
  const { user, profile } = useAuth();

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [hiddenEngineers, setHiddenEngineers] = useState(new Set());

  // ── Modal / form state ──────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', contact_person: '', mobile: '', address: '', location: '' });
  const [savingClient, setSavingClient] = useState(false);
  const [formData, setFormData] = useState({
    title: '', engineerId: '', location: '', client_id: null,
    start: new Date(), end: new Date(), description: '', priority: 'normal'
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelectedEvent(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const priorities = [
    { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
  ];

  const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#22c55e' };

  // ── Engineer color map ──────────────────────────────────────────────────────
  const engineerColorMap = useMemo(() => {
    const map = {};
    engineers.forEach((eng, i) => { map[eng.id] = ENGINEER_COLORS[i % ENGINEER_COLORS.length]; });
    return map;
  }, [engineers]);

  // ── Events ──────────────────────────────────────────────────────────────────
  const scheduleEvents = useMemo(() => schedules.map(schedule => {
    const engineer = getEngineerById(schedule.engineer_id);
    const engineerStatus = engineer ? getEngineerStatus(engineer, schedules) : null;
    const linkedCase = cases?.find(c => c.id === schedule.case_id) || null;
    return {
      id: schedule.id,
      title: schedule.title,
      start: new Date(schedule.start_time || schedule.start),
      end: new Date(schedule.end_time || schedule.end),
      resource: { schedule, engineer, engineerStatus, linkedCase },
    };
  }), [schedules, cases]);

  const leaveEvents = useMemo(() => (leaves || []).map(leave => {
    const engineer = getEngineerById(leave.engineer_id);
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    end.setHours(23, 59, 59, 999);
    return {
      id: `leave-${leave.id}`,
      title: `Leave — ${engineer?.name || 'Unknown'}`,
      start, end, allDay: true,
      resource: { engineer, priority: 'low', description: leave.reason || 'Leave' },
    };
  }), [leaves]);

  const filteredEvents = useMemo(() => {
    const filtered = scheduleEvents.filter(ev => {
      const engId = ev.resource?.engineer?.id;
      return !engId || !hiddenEngineers.has(engId);
    });
    return [...filtered, ...leaveEvents];
  }, [scheduleEvents, leaveEvents, hiddenEngineers]);

  // ── Date label ──────────────────────────────────────────────────────────────
  const dateLabel = useMemo(() => {
    if (currentView === 'week') {
      const s = moment(currentDate).startOf('week');
      const e = moment(currentDate).endOf('week');
      return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
    }
    if (currentView === 'day') return moment(currentDate).format('dddd, MMMM D, YYYY');
    return moment(currentDate).format('MMMM YYYY');
  }, [currentDate, currentView]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function navigate(direction) {
    const unit = currentView === 'month' ? 'month' : currentView === 'week' ? 'week' : 'day';
    const next = moment(currentDate)[direction === 'PREV' ? 'subtract' : 'add'](1, unit).toDate();
    setCurrentDate(next);
  }

  function toggleEngineer(id) {
    setHiddenEngineers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Handlers (unchanged logic) ──────────────────────────────────────────────
  const handleSelectSlot = ({ start, end }) => {
    setFormData(prev => ({ ...prev, start, end }));
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    if (typeof event.id === 'string' && event.id.startsWith('leave-')) return;
    setSelectedEvent(event);
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.engineerId && isEngineerOnLeave({ start: formData.start, end: formData.end }, formData.engineerId)) {
        toast.error('Selected engineer is on leave for the chosen time range');
        return;
      }
      const locationObj = (locationObjects || []).find(l => l.name === formData.location);
      const scheduleData = {
        title: formData.title, engineer_id: formData.engineerId || null,
        location_id: locationObj?.id || null, client_id: formData.client_id || null,
        start_time: formData.start.toISOString(), end_time: formData.end.toISOString(),
        description: formData.description || '', priority: formData.priority,
        status: 'scheduled', created_by: user?.id,
      };
      editingSchedule ? await updateSchedule(editingSchedule.id, scheduleData) : await addSchedule(scheduleData);
      resetForm();
    } catch (error) { console.error('Error saving schedule:', error); }
  };

  const handleDelete = async () => {
    if (editingSchedule) {
      try { await deleteSchedule(editingSchedule.id); resetForm(); }
      catch (error) { console.error('Error deleting schedule:', error); }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', engineerId: '', location: '', client_id: null, start: new Date(), end: new Date(), description: '', priority: 'normal' });
    setEditingSchedule(null);
    setShowModal(false);
  };

  const handleSyncWithCases = async () => {
    setIsSyncing(true);
    try {
      const result = await scheduleCaseSyncService.syncAllSchedulesWithCases();
      result.success
        ? toast.success(`Synced ${result.data.syncedSchedules}/${result.data.totalSchedules} schedules`)
        : toast.error('Failed to sync schedules with cases');
    } catch { toast.error('Error syncing schedules with cases'); }
    finally { setIsSyncing(false); }
  };

  const handleSaveNewClient = async (e) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const locationObj = (locationObjects || []).find(l => l.name === newClientForm.location);
      const created = await addClient({
        name: newClientForm.name, contact_person: newClientForm.contact_person || null,
        mobile: newClientForm.mobile || null, address: newClientForm.address || null,
        location_id: locationObj?.id || null, created_by: user?.id, is_disclosed: true,
      });
      setFormData(prev => ({ ...prev, client_id: created.id }));
      setShowInlineAdd(false);
      setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' });
      toast.success('Client added');
    } catch { toast.error('Failed to add client'); }
    finally { setSavingClient(false); }
  };

  const handleEditFromPopup = () => {
    const schedule = selectedEvent?.resource?.schedule;
    if (!schedule) return;
    setSelectedEvent(null);
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title, engineerId: schedule.engineer_id || '',
      location: (locationObjects || []).find(l => l.id === schedule.location_id)?.name || '',
      client_id: schedule.client_id || null,
      start: new Date(schedule.start_time || schedule.start),
      end: new Date(schedule.end_time || schedule.end),
      description: schedule.description || '', priority: schedule.priority || 'normal',
    });
    setShowModal(true);
  };

  const handleDeleteFromPopup = async () => {
    const schedule = selectedEvent?.resource?.schedule;
    if (!schedule) return;
    try { await deleteSchedule(schedule.id); setSelectedEvent(null); toast.success('Schedule deleted'); }
    catch { toast.error('Failed to delete schedule'); }
  };

  const isEngineerRole = profile?.role === 'engineer';

  // ── eventPropGetter ─────────────────────────────────────────────────────────
  const eventPropGetter = (event) => {
    if (typeof event.id === 'string' && event.id.startsWith('leave-')) {
      return { style: { backgroundColor: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.45)', borderRadius: 4, opacity: 0.7, fontSize: 11 } };
    }
    const { schedule, engineer, linkedCase } = event.resource || {};
    const isOwn = schedule?.engineer_id === user?.id;
    const dim = isEngineerRole && !isOwn;
    const engColor = engineerColorMap[engineer?.id] || '#6b7280';
    const caseAccent = linkedCase ? STATUS_COLORS[linkedCase.status]?.border : null;
    return {
      style: {
        backgroundColor: engColor, border: 'none',
        borderLeft: caseAccent ? `3px solid ${caseAccent}` : undefined,
        borderRadius: 4, opacity: dim ? 0.5 : 1, fontSize: 11, color: '#fff',
      }
    };
  };

  // ── CustomEvent ─────────────────────────────────────────────────────────────
  const CustomEvent = ({ event }) => {
    const { engineer, engineerStatus } = event.resource || {};
    const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
    const isLeave = typeof event.id === 'string' && event.id.startsWith('leave-');
    if (isLeave || currentView !== 'agenda') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', padding: '1px 2px' }}>
          {statusCfg && <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
            {event.title}{engineer ? ` — ${engineer.name}` : ''}
          </span>
        </div>
      );
    }
    const { schedule, linkedCase } = event.resource || {};
    const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '';
    return (
      <div style={{ padding: '2px 4px' }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{event.title}</div>
        {locationName && <div style={{ fontSize: 10, opacity: 0.8 }}>📍 {locationName}</div>}
        {engineer && <div style={{ fontSize: 10, opacity: 0.8 }}>👤 {engineer.name}{statusCfg && <span style={{ color: statusCfg.color }}> · {statusCfg.label}</span>}</div>}
        {linkedCase && <div style={{ fontSize: 10, opacity: 0.8 }}>🔗 Case #{linkedCase.id}</div>}
        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280' }}>{schedule?.priority || 'normal'}</span>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="gcal-layout">

      {/* ── TOP BAR ── */}
      <div className="gcal-topbar">
        <span className="gcal-title">Schedule Calendar</span>
        <div className="gcal-divider" />
        <button className="gcal-today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
        <button className="gcal-nav-btn" onClick={() => navigate('PREV')}>‹</button>
        <button className="gcal-nav-btn" onClick={() => navigate('NEXT')}>›</button>
        <span className="gcal-date-label">{dateLabel}</span>
        <div className="gcal-view-switcher">
          {['month', 'week', 'day', 'agenda'].map(v => (
            <button key={v} className={`gcal-view-btn${currentView === v ? ' active' : ''}`} onClick={() => setCurrentView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="gcal-divider" />
        <button className="glass-btn-secondary" onClick={handleSyncWithCases} disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RotateCcw size={13} /> {isSyncing ? 'Syncing…' : 'Sync'}
        </button>
        <button className="glass-btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Plus size={13} /> Add Schedule
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="gcal-body">

        {/* Sidebar */}
        <div className="gcal-sidebar">
          <MiniCalendar currentDate={currentDate} onDateClick={setCurrentDate} currentView={currentView} />
          <div>
            <div className="gcal-filter-label">Engineers</div>
            {engineers.map((eng, i) => {
              const color = ENGINEER_COLORS[i % ENGINEER_COLORS.length];
              const hidden = hiddenEngineers.has(eng.id);
              return (
                <div key={eng.id} className="gcal-filter-row" onClick={() => toggleEngineer(eng.id)}>
                  <div className="gcal-filter-color" style={{ background: hidden ? 'transparent' : color, border: hidden ? `1.5px solid ${color}` : 'none' }} />
                  <span className="gcal-filter-name" style={{ color: hidden ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)' }}>{eng.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main calendar */}
        <div className="gcal-main">
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            view={currentView}
            date={currentDate}
            onView={setCurrentView}
            onNavigate={setCurrentDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventPropGetter}
            components={{ toolbar: () => null, event: CustomEvent }}
            scrollToTime={new Date(2000, 0, 1, 8, 0, 0)}
            style={{ height: '100%' }}
            popup
          />
        </div>
      </div>

      {/* ── ADD / EDIT SCHEDULE MODAL ── */}
      {showModal && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.125rem', fontWeight: 700 }}>
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Title *</div>
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required className="glass-input" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Engineer *</div>
                <select value={formData.engineerId} onChange={e => setFormData(p => ({ ...p, engineerId: e.target.value }))} className="glass-select">
                  <option value="">Select Engineer</option>
                  {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name} — {eng.location}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Location</div>
                <LocationCombobox value={formData.location} onChange={val => setFormData(p => ({ ...p, location: val }))} locations={locations} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Client</div>
                <select value={formData.client_id || ''} onChange={e => { setFormData(p => ({ ...p, client_id: e.target.value ? parseInt(e.target.value) : null })); setShowInlineAdd(false); }} className="glass-select">
                  <option value="">Select Client (optional)</option>
                  {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!showInlineAdd && (
                  <button type="button" onClick={() => setShowInlineAdd(true)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#a78bfa', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    + Add new client
                  </button>
                )}
                {showInlineAdd && (
                  <div style={{ marginTop: 12, padding: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10 }}>
                    <div style={{ marginBottom: 10 }}>
                      <div className="section-label">Name *</div>
                      <input type="text" required value={newClientForm.name} onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))} className="glass-input" placeholder="Hospital / Clinic name" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div className="section-label">Contact person</div>
                        <input type="text" value={newClientForm.contact_person} onChange={e => setNewClientForm(p => ({ ...p, contact_person: e.target.value }))} className="glass-input" placeholder="Dr. Name" />
                      </div>
                      <div>
                        <div className="section-label">Mobile</div>
                        <input type="tel" value={newClientForm.mobile} onChange={e => setNewClientForm(p => ({ ...p, mobile: e.target.value }))} className="glass-input" placeholder="10-digit" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div className="section-label">Address</div>
                      <input type="text" value={newClientForm.address} onChange={e => setNewClientForm(p => ({ ...p, address: e.target.value }))} className="glass-input" placeholder="Hospital address" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div className="section-label">Location</div>
                      <LocationCombobox value={newClientForm.location} onChange={val => setNewClientForm(p => ({ ...p, location: val }))} locations={locations} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="glass-btn-secondary" onClick={() => { setShowInlineAdd(false); setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' }); }} style={{ fontSize: 12, padding: '6px 12px' }}>Cancel</button>
                      <button type="button" className="glass-btn-primary" disabled={savingClient} onClick={handleSaveNewClient} style={{ fontSize: 12, padding: '6px 12px' }}>{savingClient ? 'Saving...' : 'Save & Select'}</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Start Time *</div>
                  <input type="datetime-local" value={moment(formData.start).format('YYYY-MM-DDTHH:mm')} onChange={e => setFormData(p => ({ ...p, start: new Date(e.target.value) }))} required className="glass-input" />
                </div>
                <div>
                  <div className="section-label">End Time *</div>
                  <input type="datetime-local" value={moment(formData.end).format('YYYY-MM-DDTHH:mm')} onChange={e => setFormData(p => ({ ...p, end: new Date(e.target.value) }))} required className="glass-input" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Priority</div>
                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="glass-select">
                  {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Description</div>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows="3" className="glass-textarea" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                {editingSchedule && (
                  <button type="button" className="glass-btn-danger" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button type="button" className="glass-btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="glass-btn-primary">{editingSchedule ? 'Update' : 'Create'} Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL POPUP ── */}
      {selectedEvent && (() => {
        const { schedule, engineer, engineerStatus, linkedCase } = selectedEvent.resource || {};
        const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
        const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '—';
        const client = schedule?.client_id ? (clients || []).find(c => c.id === schedule.client_id) : null;
        const caseSC = linkedCase ? STATUS_COLORS[linkedCase.status] : null;
        const startD = new Date(schedule?.start_time || schedule?.start);
        const endD = new Date(schedule?.end_time || schedule?.end);
        const fmt = d => d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <>
            <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,12,41,0.7)', zIndex: 200 }} />
            <div className="event-popup-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{selectedEvent.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{fmt(startD)} – {endD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280', color: '#fff' }}>{schedule?.priority || 'normal'}</span>
                {caseSC && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: `1px solid ${caseSC.border}`, color: caseSC.border }}>{caseSC.label}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}><span>📍</span><span>{locationName}</span></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                {engineer ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: engineerColorMap[engineer.id] || 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {engineer.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{engineer.name}</div>
                      {statusCfg && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />{statusCfg.label}</div>}
                    </div>
                  </>
                ) : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}
              </div>
              {linkedCase && (
                <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: caseSC ? `3px solid ${caseSC.border}` : 'none' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>LINKED CASE</div>
                  <div style={{ fontSize: 13, color: '#fff' }}>#{linkedCase.id} — {linkedCase.title || linkedCase.description?.slice(0, 40) || 'Case'}</div>
                </div>
              )}
              {client && <div style={{ display: 'flex', gap: 8, marginBottom: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}><span>🏢</span><span>{client.name}</span></div>}
              {schedule?.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>{schedule.description}</div>}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
              {showDeleteConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>Delete this schedule?</span>
                  <button className="glass-btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="glass-btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleDeleteFromPopup}>Confirm</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="glass-btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={handleEditFromPopup}>Edit</button>
                  <button className="glass-btn-danger" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default ScheduleCalendar;
```

- [ ] **Step 3: Start dev server and open the Schedule tab**

```bash
npm start
```

Expected: Schedule Calendar loads with left sidebar (mini calendar + engineers list) and top bar (Today/nav/date/view switcher/Sync/Add). Calendar starts at 8 AM. RBC default toolbar is gone.

- [ ] **Step 4: Verify checklist**
  - [ ] Mini calendar shows current month with today in purple circle
  - [ ] Top bar shows correct date label for current week view
  - [ ] Clicking ‹ › in top bar advances/retreats the main calendar
  - [ ] Clicking a date in mini calendar navigates main calendar
  - [ ] View switcher changes between Month/Week/Day/Agenda
  - [ ] Engineer filter rows present in sidebar
  - [ ] Clicking an engineer row dims their name and hides their events

- [ ] **Step 5: Commit**

```bash
git add src/components/ScheduleCalendar.js src/components/MiniCalendar.jsx src/index.css
git commit -m "feat: redesign ScheduleCalendar with Google Calendar layout"
```

---

## Task 4: CaseCalendarView rewrite

**Files:**
- Modify: `src/components/CaseCalendarView.jsx` (full rewrite)

- [ ] **Step 1: Replace the full file with this content:**

```jsx
// src/components/CaseCalendarView.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';

const localizer = momentLocalizer(moment);

const STATUS_FILTERS = [
  { key: null,          label: 'All Cases',   color: '#a78bfa' },
  { key: 'open',        label: 'Open',        color: '#f87171' },
  { key: 'assigned',    label: 'Assigned',    color: '#60a5fa' },
  { key: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'completed',   label: 'Completed',   color: '#34d399' },
  { key: 'on_hold',     label: 'On Hold',     color: '#fbbf24' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#6b7280' },
];

export default function CaseCalendarView({ cases, engineers = [], currentUserId, isEngineer, onSelectCase }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [activeStatus, setActiveStatus] = useState(null); // null = all

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { null: cases.length };
    STATUS_FILTERS.forEach(f => {
      if (f.key) counts[f.key] = cases.filter(c => c.status === f.key).length;
    });
    return counts;
  }, [cases]);

  // Events
  const events = useMemo(() => {
    const filtered = activeStatus ? cases.filter(c => c.status === activeStatus) : cases;
    return filtered
      .filter(c => c.scheduled_start)
      .map(c => ({
        id: c.id,
        title: `${c.case_number || '#' + c.id.slice(0, 6)} — ${c.client_name || c.title || 'Case'}`,
        start: new Date(c.scheduled_start),
        end: c.scheduled_end
          ? new Date(c.scheduled_end)
          : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
        resource: c,
      }));
  }, [cases, activeStatus]);

  // Date label
  const dateLabel = useMemo(() => {
    if (currentView === 'week') {
      const s = moment(currentDate).startOf('week');
      const e = moment(currentDate).endOf('week');
      return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
    }
    if (currentView === 'day') return moment(currentDate).format('dddd, MMMM D, YYYY');
    return moment(currentDate).format('MMMM YYYY');
  }, [currentDate, currentView]);

  function navigate(direction) {
    const unit = currentView === 'month' ? 'month' : currentView === 'week' ? 'week' : 'day';
    setCurrentDate(moment(currentDate)[direction === 'PREV' ? 'subtract' : 'add'](1, unit).toDate());
  }

  const eventPropGetter = (event) => {
    const colorObj = STATUS_COLORS[event.resource?.status];
    const color = colorObj ? colorObj.border : '#6b7280';
    const barColor = colorObj ? colorObj.bar : 'rgba(107,114,128,0.3)';
    const isOwn = event.resource?.assigned_engineer_id === currentUserId;
    const dimmed = isEngineer && !isOwn;
    return {
      style: {
        backgroundColor: barColor,
        borderLeft: `3px solid ${color}`,
        opacity: dimmed ? 0.45 : 1,
        borderRadius: 4,
        color: '#fff',
        fontSize: 11,
      }
    };
  };

  const CustomEvent = ({ event }) => (
    <div style={{ overflow: 'hidden', padding: '1px 2px', fontSize: 11, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
      {event.title}
    </div>
  );

  return (
    <div className="gcal-layout" style={{ height: 'calc(100vh - 96px)' }}>

      {/* ── TOP BAR ── */}
      <div className="gcal-topbar">
        <button className="gcal-today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
        <button className="gcal-nav-btn" onClick={() => navigate('PREV')}>‹</button>
        <button className="gcal-nav-btn" onClick={() => navigate('NEXT')}>›</button>
        <span className="gcal-date-label">{dateLabel}</span>
        <div className="gcal-view-switcher">
          {['month', 'week', 'day', 'agenda'].map(v => (
            <button key={v} className={`gcal-view-btn${currentView === v ? ' active' : ''}`} onClick={() => setCurrentView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="gcal-body">

        {/* Sidebar */}
        <div className="gcal-sidebar">
          <MiniCalendar currentDate={currentDate} onDateClick={setCurrentDate} currentView={currentView} />
          <div>
            <div className="gcal-filter-label">Status</div>
            {STATUS_FILTERS.map(f => {
              const isActive = activeStatus === f.key;
              return (
                <div key={String(f.key)} className="gcal-filter-row" onClick={() => setActiveStatus(f.key)}
                  style={{ background: isActive ? 'rgba(167,139,250,0.1)' : undefined }}>
                  <div className="gcal-filter-color" style={{ background: f.color }} />
                  <span className="gcal-filter-name" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isActive ? 600 : 400 }}>
                    {f.label}
                  </span>
                  <span className="gcal-filter-count">{statusCounts[f.key] ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main calendar */}
        <div className="gcal-main">
          <Calendar
            localizer={localizer}
            events={events}
            view={currentView}
            date={currentDate}
            onView={setCurrentView}
            onNavigate={setCurrentDate}
            onSelectEvent={event => onSelectCase?.(event.resource)}
            eventPropGetter={eventPropGetter}
            components={{ toolbar: () => null, event: CustomEvent }}
            scrollToTime={new Date(2000, 0, 1, 8, 0, 0)}
            style={{ height: '100%' }}
            popup
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Open the Cases tab → switch to Calendar view**

Expected: Google Calendar layout appears. Sidebar shows mini calendar + status filter list. Top bar has Today/nav/date/view switcher (no action buttons).

- [ ] **Step 3: Verify checklist**
  - [ ] Status filter rows show counts
  - [ ] Clicking "Open" filters calendar to open cases only
  - [ ] Clicking "All Cases" shows all events
  - [ ] Calendar scrolled to 8 AM
  - [ ] View switcher works

- [ ] **Step 4: Commit**

```bash
git add src/components/CaseCalendarView.jsx
git commit -m "feat: redesign CaseCalendarView with Google Calendar layout"
```

---

## Task 5: CaseManager — hide stats grid in calendar mode

**Files:**
- Modify: `src/components/CaseManager.js`

- [ ] **Step 1: Find the stats grid block** (around line 285) and wrap it in a conditional:

Change:
```jsx
      {/* Stats Cards */}
      <div className="stats-grid">
```

To:
```jsx
      {/* Stats Cards — hidden in calendar view (calendar needs full height) */}
      {viewMode === 'list' && <div className="stats-grid">
```

And close with:
```jsx
      </div>}
```

(The closing `</div>` for stats-grid at line ~303 becomes `</div>}`)

- [ ] **Step 2: Verify in browser** — switching to Calendar view hides the stat cards; switching to List view shows them again.

- [ ] **Step 3: Commit**

```bash
git add src/components/CaseManager.js
git commit -m "fix: hide stats grid when CaseManager is in calendar view mode"
```

---

## Task 6: Final verification

- [ ] **Step 1: Full checklist against spec**

| # | Check | Pass? |
|---|---|---|
| 1 | Both calendars open scrolled to 8 AM | |
| 2 | Today = purple circle in column header and mini calendar | |
| 3 | Today's column has purple tint in week/day view | |
| 4 | ‹ › buttons navigate main calendar | |
| 5 | Mini calendar date click navigates main calendar | |
| 6 | View switcher: active = gradient, others = transparent | |
| 7 | Schedule: toggling engineer hides/shows their events | |
| 8 | Cases: clicking status filters events | |
| 9 | RBC default toolbar gone | |
| 10 | Events show title + engineer name (Schedule) | |
| 11 | Cases: stats grid hidden in calendar mode | |
| 12 | Today button navigates to current date | |

- [ ] **Step 2: Check no console errors** in dev tools

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Google Calendar layout for Schedule and Cases calendar views"
```
