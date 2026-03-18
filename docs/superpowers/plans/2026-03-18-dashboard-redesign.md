# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `UnifiedDashboard` and `EngineerDashboard` with a Glass Premium UI — manager/admin get a 3-row command center with Gantt timeline; engineers get a hero active-case card with personal week schedule and team awareness.

**Architecture:** All new components live in `src/components/dashboard/`. `UnifiedDashboard.js` and `EngineerDashboard.js` become thin orchestrators importing from there. A shared `TeamStatusPanel` and `dashboardUtils` are built once and used by both. No new dependencies — uses existing Tailwind, framer-motion, lucide-react, react-hot-toast, supabaseService, and EngineerContext.

**Tech Stack:** React 18, Tailwind CSS, framer-motion, lucide-react, react-hot-toast, Supabase JS client, EngineerContext (useReducer), AuthContext

---

## File Map

**Create:**
- `src/components/dashboard/dashboardUtils.js` — pure utility functions (week math, engineer status, color maps)
- `src/components/dashboard/GlassPanel.jsx` — reusable glass card wrapper (background, border, blur, optional glow color)
- `src/components/dashboard/SkeletonPanel.jsx` — shimmer loading placeholder
- `src/components/dashboard/TeamStatusPanel.jsx` — shared engineer status list (used by both dashboards)
- `src/components/dashboard/DashboardKPIBar.jsx` — 4 clickable KPI filter cards (manager)
- `src/components/dashboard/CasesPanel.jsx` — upcoming + unassigned cases center panel (manager)
- `src/components/dashboard/PendingApprovalsPanel.jsx` — leave + assignment approval panel (manager)
- `src/components/dashboard/QuickAssignModal.jsx` — assign engineer to case modal (manager)
- `src/components/dashboard/WeeklyGantt.jsx` — Mon–Fri Gantt chart with leave hatching (manager)
- `src/components/dashboard/CaseDetailPanel.jsx` — slide-in case detail panel (manager)
- `src/components/dashboard/ActiveCaseHero.jsx` — full-width active case hero card (engineer)
- `src/components/dashboard/MyWeekTimeline.jsx` — engineer's personal Mon–Fri schedule (engineer)
- `src/components/dashboard/MyStatusControls.jsx` — location/availability controls + log-travel modal (engineer)

**Modify:**
- `src/components/UnifiedDashboard.js` — replace all internals with new dashboard components
- `src/components/EngineerDashboard.js` — full rewrite using new dashboard components
- `src/App.js` line 154 — route `personal` tab to `<EngineerDashboard />` instead of `<UnifiedDashboard />`

---

## Task 1: Shared Utilities

**Files:**
- Create: `src/components/dashboard/dashboardUtils.js`

- [ ] **Step 1: Create the utilities file**

```js
// src/components/dashboard/dashboardUtils.js

/** Returns Monday 00:00:00 of the week containing `date` */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns array of 5 Date objects [Mon, Tue, Wed, Thu, Fri] for the given weekStart */
export function getWeekDays(weekStart) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format date as "Tue 18" */
export function formatDayLabel(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

/** Is date today? */
export function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/** Is a timestamp within [weekStart, weekStart+5days)? */
export function isInWeek(timestamp, weekStart) {
  const d = new Date(timestamp);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 5);
  return d >= weekStart && d < end;
}

/**
 * Derive engineer status from engineers array + schedules array.
 * Returns 'on_case' | 'travelling' | 'available'
 */
export function getEngineerStatus(engineer, schedules) {
  const now = new Date();
  const activeSchedule = schedules.find(s =>
    s.engineer_id === engineer.id &&
    new Date(s.start_time) <= now &&
    new Date(s.end_time) >= now
  );
  if (activeSchedule) return 'on_case';
  if (engineer.current_location_id && engineer.current_location_id !== engineer.location_id) return 'travelling';
  return 'available';
}

export const STATUS_COLORS = {
  completed:   { bar: 'rgba(52,211,153,0.35)',  border: '#34d399', tag: 'tag-g', label: 'Done'     },
  in_progress: { bar: 'rgba(251,191,36,0.35)',  border: '#fbbf24', tag: 'tag-y', label: 'Active'   },
  assigned:    { bar: 'rgba(96,165,250,0.35)',   border: '#60a5fa', tag: 'tag-b', label: 'Upcoming' },
  open:        { bar: 'rgba(167,139,250,0.35)', border: '#a78bfa', tag: 'tag-p', label: 'Open'     },
  on_hold:     { bar: 'rgba(251,191,36,0.2)',   border: '#fbbf24', tag: 'tag-y', label: 'On Hold'  },
  cancelled:   { bar: 'rgba(156,163,175,0.2)',  border: '#6b7280', tag: 'tag-d', label: 'Cancelled'},
};

export const ENGINEER_STATUS_CONFIG = {
  available:  { color: '#34d399', label: 'Available',  glow: '0 0 5px #34d399' },
  on_case:    { color: '#f87171', label: 'On Case',    glow: '0 0 5px #f87171' },
  travelling: { color: '#fbbf24', label: 'Travelling', glow: '0 0 5px #fbbf24' },
};

/** Get engineer initials from name */
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Gradient backgrounds for avatars, cycling by index */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#a78bfa,#60a5fa)',
  'linear-gradient(135deg,#f43f5e,#fb923c)',
  'linear-gradient(135deg,#34d399,#06b6d4)',
  'linear-gradient(135deg,#fbbf24,#f59e0b)',
  'linear-gradient(135deg,#ec4899,#a78bfa)',
  'linear-gradient(135deg,#60a5fa,#34d399)',
];
export function avatarGradient(index) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

/** Format ISO timestamp as "9:00 AM" */
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Format ISO date as "Mar 18" */
export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd C:/ASP/SEP && node -e "require('./src/components/dashboard/dashboardUtils.js')" 2>&1 || echo "check for CommonJS vs ESM — expected ESM import error is OK if project uses babel"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/dashboardUtils.js
git commit -m "feat: add dashboard utility functions (week math, status derivation, color maps)"
```

---

## Task 2: Glass Panel + Skeleton Primitives

**Files:**
- Create: `src/components/dashboard/GlassPanel.jsx`
- Create: `src/components/dashboard/SkeletonPanel.jsx`

- [ ] **Step 1: Create GlassPanel**

```jsx
// src/components/dashboard/GlassPanel.jsx
import React from 'react';

const GLOW = {
  purple: { boxShadow: '0 0 12px rgba(167,139,250,0.3)', borderColor: 'rgba(167,139,250,0.35)' },
  green:  { boxShadow: '0 0 10px rgba(52,211,153,0.3)',  borderColor: 'rgba(52,211,153,0.35)'  },
  amber:  { boxShadow: '0 0 10px rgba(251,191,36,0.25)', borderColor: 'rgba(251,191,36,0.3)'   },
  red:    { boxShadow: '0 0 10px rgba(248,113,113,0.25)',borderColor: 'rgba(248,113,113,0.3)'  },
  none:   {},
};

/**
 * Reusable glass card.
 * @param {string} glow - 'purple' | 'green' | 'amber' | 'red' | 'none'
 * @param {string} topStripe - CSS color for 3px top accent stripe, or null
 * @param {string} className - extra Tailwind classes
 */
export default function GlassPanel({ children, glow = 'none', topStripe = null, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        ...GLOW[glow],
        ...style,
      }}
      className={className}
      {...props}
    >
      {topStripe && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: topStripe }} />
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create SkeletonPanel**

```jsx
// src/components/dashboard/SkeletonPanel.jsx
import React from 'react';

export default function SkeletonPanel({ height = 120, className = '' }) {
  return (
    <div
      className={className}
      style={{
        height,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }}
      />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/GlassPanel.jsx src/components/dashboard/SkeletonPanel.jsx
git commit -m "feat: add GlassPanel and SkeletonPanel primitives"
```

---

## Task 3: TeamStatusPanel (shared)

**Files:**
- Create: `src/components/dashboard/TeamStatusPanel.jsx`

This component is used by both the manager CommandCenter (left column) and the engineer dashboard (right column bottom). It receives `engineers`, `schedules`, and optionally `currentUserId` to highlight "you".

- [ ] **Step 1: Create TeamStatusPanel**

```jsx
// src/components/dashboard/TeamStatusPanel.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { getEngineerStatus, getInitials, avatarGradient, ENGINEER_STATUS_CONFIG } from './dashboardUtils';

export default function TeamStatusPanel({ engineers, schedules, currentUserId, activeFilter }) {
  // When activeFilter === 'available', dim engineers that are not available
  return (
    <GlassPanel style={{ padding: '10px 12px', height: '100%' }}>
      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>
        Team Status
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {engineers.map((eng, i) => {
          const status = getEngineerStatus(eng, schedules);
          const cfg = ENGINEER_STATUS_CONFIG[status];
          const isMe = eng.id === currentUserId;
          const dimmed = activeFilter === 'available' && status !== 'available';
          const cityName = eng.current_location?.name || eng.currentLocation || eng.location?.name || eng.location || '—';

          return (
            <div
              key={eng.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: dimmed ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 24, height: 24, minWidth: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#fff', fontWeight: 700,
                background: avatarGradient(i),
                boxShadow: isMe ? '0 0 0 2px #a78bfa' : 'none',
              }}>
                {getInitials(eng.name)}
              </div>

              {/* Name + location */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: isMe ? '#a78bfa' : '#fff', fontWeight: isMe ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {eng.name}{isMe && <span style={{ fontSize: 7, color: '#6b7280', marginLeft: 4 }}>(you)</span>}
                </div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>{cityName}</div>
              </div>

              {/* Status dot */}
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: cfg.color,
                boxShadow: cfg.glow,
                flexShrink: 0,
              }} title={cfg.label} />
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Start the dev server and verify no import errors**

```bash
# In a separate terminal:
cd C:/ASP/SEP && npm start
# Check browser console — no errors expected yet since nothing imports TeamStatusPanel
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/TeamStatusPanel.jsx
git commit -m "feat: add shared TeamStatusPanel component"
```

---

## Task 4: DashboardKPIBar (manager Row 1)

**Files:**
- Create: `src/components/dashboard/DashboardKPIBar.jsx`

- [ ] **Step 1: Create DashboardKPIBar**

```jsx
// src/components/dashboard/DashboardKPIBar.jsx
import React from 'react';

const CARDS = [
  { id: 'total',     label: 'Total Cases',         color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { id: 'upcoming',  label: 'Upcoming (7 days)',    color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  { id: 'unassigned',label: 'Unassigned',           color: '#f87171', glow: 'rgba(248,113,113,0.25)' },
  { id: 'available', label: 'Available Engineers',  color: '#34d399', glow: 'rgba(52,211,153,0.3)'  },
];

export default function DashboardKPIBar({ counts, activeFilter, onFilterChange }) {
  // counts: { total, upcoming, unassigned, available }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
      {CARDS.map(card => {
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            style={{
              background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${isActive ? card.color : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 10,
              padding: '8px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s',
              boxShadow: isActive ? `0 0 14px ${card.glow}` : 'none',
            }}
          >
            {/* Active stripe */}
            {isActive && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#fbbf24' }} />
            )}
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, lineHeight: 1 }}>
              {counts[card.id] ?? 0}
            </div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.6px', marginTop: 3 }}>
              {card.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/DashboardKPIBar.jsx
git commit -m "feat: add DashboardKPIBar with clickable filter cards"
```

---

## Task 5: CasesPanel (manager Row 2 center)

**Files:**
- Create: `src/components/dashboard/CasesPanel.jsx`

- [ ] **Step 1: Create CasesPanel**

```jsx
// src/components/dashboard/CasesPanel.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { formatShortDate, getInitials, avatarGradient, STATUS_COLORS } from './dashboardUtils';

export default function CasesPanel({ upcomingCases, unassignedCases, engineers, activeFilter, onQuickAssign }) {
  const highlightUpcoming   = activeFilter === 'upcoming';
  const highlightUnassigned = activeFilter === 'unassigned';

  return (
    <GlassPanel glow="purple" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Upcoming Cases */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{
          fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6,
          ...(highlightUpcoming ? { color: '#fbbf24' } : {})
        }}>
          Upcoming Cases
        </div>
        {upcomingCases.length === 0 ? (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No upcoming cases</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {upcomingCases.slice(0, 4).map((c, i) => {
              const assignedEng = engineers.find(e => e.id === c.assigned_engineer_id);
              const engIdx = engineers.indexOf(assignedEng);
              const sc = STATUS_COLORS[c.status] || STATUS_COLORS.open;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', minWidth: 52 }}>#{c.id}</div>
                  <div style={{ flex: 1, fontSize: 8, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {c.client_name || c.title}
                  </div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                    {c.scheduled_start ? formatShortDate(c.scheduled_start) : '—'}
                  </div>
                  {assignedEng && (
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: avatarGradient(engIdx),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700
                    }}>{getInitials(assignedEng.name)}</div>
                  )}
                  <span style={{
                    fontSize: 6, padding: '1px 5px', borderRadius: 8, fontWeight: 600,
                    background: `${sc.bar}`, color: sc.border, border: `1px solid ${sc.border}`,
                    whiteSpace: 'nowrap'
                  }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Unassigned Cases */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{
          fontSize: 7, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6,
          color: highlightUnassigned ? '#f87171' : 'rgba(248,113,113,0.6)',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <span>⚠</span> Unassigned Cases
        </div>
        {unassignedCases.length === 0 ? (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>All cases assigned</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {unassignedCases.slice(0, 4).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', minWidth: 52 }}>#{c.id}</div>
                <div style={{ flex: 1, fontSize: 8, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.client_name || c.title}
                </div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.location?.name || c.client_address || '—'}
                </div>
                <button
                  onClick={() => onQuickAssign(c)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(96,165,250,0.5)',
                    background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 12, lineHeight: '16px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}
                  title="Quick assign"
                >+</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/CasesPanel.jsx
git commit -m "feat: add CasesPanel with upcoming and unassigned sections"
```

---

## Task 6: PendingApprovalsPanel (manager Row 2 right)

**Files:**
- Create: `src/components/dashboard/PendingApprovalsPanel.jsx`

- [ ] **Step 1: Create PendingApprovalsPanel**

```jsx
// src/components/dashboard/PendingApprovalsPanel.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { formatShortDate } from './dashboardUtils';

export default function PendingApprovalsPanel({
  pendingLeaves,       // array from supabaseService.getLeavesByStatus('pending')
  unconfirmedCases,    // cases with status === 'assigned'
  engineers,
  onApproveLeave,      // (leaveId) => void
  onRejectLeave,       // (leaveId) => void
  onConfirmCase,       // (caseId) => void
  onReassignCase,      // (case) => void
}) {
  return (
    <GlassPanel style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>

      {/* Leave Requests */}
      <div>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>
          Leave Requests
        </div>
        {pendingLeaves.length === 0 ? (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No pending leave requests</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingLeaves.slice(0, 3).map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.engineer?.name || '—'}
                  </div>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>
                    {formatShortDate(l.start_date)} – {formatShortDate(l.end_date)} · {l.leave_type}
                  </div>
                </div>
                <button
                  onClick={() => onApproveLeave(l.id)}
                  style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Approve"
                >✓</button>
                <button
                  onClick={() => onRejectLeave(l.id)}
                  style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Reject"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Unconfirmed Assignments */}
      <div>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>
          Unconfirmed Assignments
        </div>
        {unconfirmedCases.length === 0 ? (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>All assignments confirmed</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unconfirmedCases.slice(0, 3).map(c => {
              const eng = engineers.find(e => e.id === c.assigned_engineer_id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{c.id} · {eng?.name || '—'}
                    </div>
                    <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>
                      {c.scheduled_start ? formatShortDate(c.scheduled_start) : 'No date'}
                    </div>
                  </div>
                  <button
                    onClick={() => onConfirmCase(c.id)}
                    style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Confirm (start)"
                  >✓</button>
                  <button
                    onClick={() => onReassignCase(c)}
                    style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Reassign"
                  >↻</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/PendingApprovalsPanel.jsx
git commit -m "feat: add PendingApprovalsPanel (leaves + unconfirmed assignments)"
```

---

## Task 7: QuickAssignModal

**Files:**
- Create: `src/components/dashboard/QuickAssignModal.jsx`

- [ ] **Step 1: Create QuickAssignModal**

```jsx
// src/components/dashboard/QuickAssignModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function QuickAssignModal({ caseToAssign, engineers, onSave, onClose }) {
  const availableEngineers = engineers.filter(e => e.is_available);
  const [engineerId, setEngineerId] = useState('');
  const [scheduledStart, setScheduledStart] = useState(
    caseToAssign?.scheduled_start
      ? new Date(caseToAssign.scheduled_start).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const handleSave = () => {
    if (!engineerId) return;
    onSave({
      caseId: caseToAssign.id,
      assigned_engineer_id: engineerId,
      scheduled_start: new Date(scheduledStart).toISOString(),
      status: 'assigned',
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 0 24px rgba(167,139,250,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>
            Assign Case #{caseToAssign?.id}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Engineer</div>
        <select
          value={engineerId}
          onChange={e => setEngineerId(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 12 }}
        >
          <option value="">Select available engineer…</option>
          {availableEngineers.map(e => (
            <option key={e.id} value={e.id}>
              {e.name} — {e.current_location?.name || e.location?.name || e.location || ''}
            </option>
          ))}
        </select>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Scheduled Start</div>
        <input
          type="datetime-local"
          value={scheduledStart}
          onChange={e => setScheduledStart(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!engineerId}
            style={{ padding: '6px 14px', background: engineerId ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.05)', border: `1px solid ${engineerId ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: engineerId ? '#60a5fa' : 'rgba(255,255,255,0.3)', cursor: engineerId ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/QuickAssignModal.jsx
git commit -m "feat: add QuickAssignModal for assigning engineers to cases"
```

---

## Task 8: WeeklyGantt (manager Row 3 left)

**Files:**
- Create: `src/components/dashboard/WeeklyGantt.jsx`

- [ ] **Step 1: Create WeeklyGantt**

```jsx
// src/components/dashboard/WeeklyGantt.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { getWeekDays, formatDayLabel, isToday, STATUS_COLORS, getInitials, avatarGradient } from './dashboardUtils';

function dayIndex(date) {
  // Returns 0–4 for Mon–Fri, -1 for weekend
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  if (day === 0 || day === 6) return -1;
  return day - 1; // 0=Mon, 4=Fri
}

function barStyle(startTime, endTime, weekStart) {
  // Clamp: if startTime is before the week, treat as Monday (index 0)
  const startD = new Date(startTime);
  const endD   = new Date(endTime);
  const weekEndD = new Date(weekStart); weekEndD.setDate(weekEndD.getDate() + 5);

  // startIdx: 0 if before week, dayIndex otherwise
  const rawStart = startD < weekStart ? 0 : dayIndex(startTime);
  const rawEnd   = endD >= weekEndD   ? 4 : dayIndex(endTime);

  const clampedStart = Math.max(0, rawStart === -1 ? 0 : rawStart);
  const clampedEnd   = Math.min(4, rawEnd   === -1 ? 4 : rawEnd);

  const left  = (clampedStart / 5) * 100;
  const width = ((clampedEnd - clampedStart + 1) / 5) * 100;

  return { left: `${left}%`, width: `${Math.max(width, 15)}%` };
}

export default function WeeklyGantt({ engineers, schedules, cases, leaves, weekStart, onWeekChange, onBarClick, activeFilter }) {
  const weekDays = getWeekDays(weekStart);

  return (
    <GlassPanel style={{ padding: '10px 12px' }}>
      {/* Header: nav + day labels */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); onWeekChange(d); }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
        >‹</button>
        <div style={{ flex: 1, display: 'flex' }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: isToday(d) ? '#a78bfa' : 'rgba(255,255,255,0.3)', fontWeight: isToday(d) ? 700 : 400, borderBottom: `1px solid ${isToday(d) ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: 3 }}>
              {formatDayLabel(d)}{isToday(d) ? ' ●' : ''}
            </div>
          ))}
        </div>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); onWeekChange(d); }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
        >›</button>
      </div>

      {/* Engineer rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {engineers.map((eng, i) => {
          const engSchedules = schedules.filter(s =>
            s.engineer_id === eng.id &&
            getWeekDays(weekStart).some(d => {
              const sd = new Date(s.start_time);
              return sd.toDateString() === d.toDateString();
            })
          );

          // Leave bars for this engineer this week
          const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 5);
          const engLeaves = leaves.filter(l =>
            l.engineer_id === eng.id &&
            l.status === 'approved' &&
            new Date(l.start_date) < weekEnd &&
            new Date(l.end_date) >= weekStart
          );

          const dimmed = activeFilter === 'available' && !eng.is_available;

          return (
            <div key={eng.id} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}>
              {/* Avatar */}
              <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: '50%', background: avatarGradient(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700 }}>
                {getInitials(eng.name)}
              </div>

              {/* Track */}
              <div style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                {/* Case bars */}
                {engSchedules.map(s => {
                  const relCase = cases.find(c => c.id === s.case_id);
                  const sc = STATUS_COLORS[relCase?.status] || STATUS_COLORS.open;
                  const pos = barStyle(s.start_time, s.end_time, weekStart);
                  return (
                    <div
                      key={s.id}
                      onClick={() => relCase && onBarClick(relCase)}
                      style={{
                        position: 'absolute', top: 2, bottom: 2,
                        ...pos,
                        background: sc.bar,
                        borderRadius: 3,
                        borderLeft: `2px solid ${sc.border}`,
                        display: 'flex', alignItems: 'center', paddingLeft: 4,
                        cursor: relCase ? 'pointer' : 'default',
                        overflow: 'hidden',
                      }}
                      title={relCase?.title}
                    >
                      <span style={{ fontSize: 6, color: sc.border, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {relCase ? `#${relCase.id} ${relCase.client_name || relCase.title || ''}` : s.title}
                      </span>
                    </div>
                  );
                })}

                {/* Leave hatching overlay */}
                {engLeaves.map(l => {
                  // Convert leave dates to day indices within this week
                  const leaveStart = new Date(l.start_date);
                  const leaveEnd   = new Date(l.end_date);
                  const startIdx = Math.max(0, dayIndex(leaveStart) === -1 ? 0 : dayIndex(leaveStart));
                  const endIdx   = Math.min(4, dayIndex(leaveEnd) === -1 ? 4 : dayIndex(leaveEnd));
                  const left  = (startIdx / 5) * 100;
                  const width = ((endIdx - startIdx + 1) / 5) * 100;
                  return (
                    <div
                      key={l.id}
                      style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `${left}%`, width: `${width}%`,
                        background: 'repeating-linear-gradient(45deg, rgba(251,191,36,0.15) 0px, rgba(251,191,36,0.15) 3px, transparent 3px, transparent 7px)',
                        borderLeft: '2px solid rgba(251,191,36,0.4)',
                      }}
                      title={`Leave: ${l.leave_type}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/WeeklyGantt.jsx
git commit -m "feat: add WeeklyGantt with leave hatching and week navigation"
```

---

## Task 9: CaseDetailPanel (manager Row 3 right)

**Files:**
- Create: `src/components/dashboard/CaseDetailPanel.jsx`

- [ ] **Step 1: Create CaseDetailPanel**

```jsx
// src/components/dashboard/CaseDetailPanel.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from './GlassPanel';
import { STATUS_COLORS, getInitials, avatarGradient, formatShortDate } from './dashboardUtils';

const NEXT_STATUSES = {
  open:        ['assigned', 'cancelled'],
  assigned:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'on_hold', 'cancelled'],
  on_hold:     ['in_progress', 'cancelled'],
  completed:   [],
  cancelled:   [],
};

export default function CaseDetailPanel({ selectedCase, engineers, onClose, onUpdateStatus }) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const eng = selectedCase ? engineers.find(e => e.id === selectedCase.assigned_engineer_id) : null;
  const engIdx = engineers.indexOf(eng);
  const sc = selectedCase ? (STATUS_COLORS[selectedCase.status] || STATUS_COLORS.open) : null;
  const nextStatuses = selectedCase ? (NEXT_STATUSES[selectedCase.status] || []) : [];

  return (
    <GlassPanel glow="purple" style={{ padding: '10px 12px', height: '100%', position: 'relative' }}>
      <AnimatePresence mode="wait">
        {!selectedCase ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ fontSize: 24, opacity: 0.2 }}>📋</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Click a case bar<br/>to view details</div>
          </motion.div>
        ) : (
          <motion.div
            key={selectedCase.id}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 2 }}>
                  Case #{selectedCase.id}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                  {selectedCase.client_name || selectedCase.title}
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', paddingLeft: 8 }}><X size={14} /></button>
            </div>

            {/* Status tag */}
            <span style={{ fontSize: 7, padding: '2px 8px', borderRadius: 8, background: sc.bar, color: sc.border, border: `1px solid ${sc.border}`, fontWeight: 600 }}>
              {sc.label}
            </span>

            {/* Details */}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {eng && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: avatarGradient(engIdx), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700 }}>
                    {getInitials(eng.name)}
                  </div>
                  <div style={{ fontSize: 9, color: '#fff' }}>{eng.name}</div>
                </div>
              )}
              {selectedCase.scheduled_start && (
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                  📅 {formatShortDate(selectedCase.scheduled_start)}
                  {selectedCase.scheduled_end && ` – ${formatShortDate(selectedCase.scheduled_end)}`}
                </div>
              )}
              {(selectedCase.location?.name || selectedCase.client_address) && (
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                  📍 {selectedCase.location?.name || selectedCase.client_address}
                </div>
              )}
              {selectedCase.description && (
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginTop: 2 }}>
                  {selectedCase.description.slice(0, 100)}{selectedCase.description.length > 100 ? '…' : ''}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {nextStatuses.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowStatusPicker(p => !p)}
                    style={{ width: '100%', padding: '5px 10px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fbbf24', cursor: 'pointer', fontSize: 9, fontWeight: 600 }}
                  >
                    ⟳ Update Status
                  </button>
                  {showStatusPicker && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {nextStatuses.map(s => {
                        const nsc = STATUS_COLORS[s] || STATUS_COLORS.open;
                        return (
                          <button
                            key={s}
                            onClick={() => { onUpdateStatus(selectedCase.id, s); setShowStatusPicker(false); }}
                            style={{ padding: '3px 8px', background: nsc.bar, border: `1px solid ${nsc.border}`, borderRadius: 6, color: nsc.border, cursor: 'pointer', fontSize: 8, fontWeight: 600 }}
                          >
                            {nsc.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/CaseDetailPanel.jsx
git commit -m "feat: add CaseDetailPanel with status picker and slide-in animation"
```

---

## Task 10: Wire Up UnifiedDashboard (manager/admin)

**Files:**
- Modify: `src/components/UnifiedDashboard.js`

- [ ] **Step 1: Replace UnifiedDashboard.js**

Replace the entire file contents with:

```jsx
// src/components/UnifiedDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import supabaseService from '../services/supabaseService';
import { getWeekStart } from './dashboard/dashboardUtils';
import DashboardKPIBar from './dashboard/DashboardKPIBar';
import TeamStatusPanel from './dashboard/TeamStatusPanel';
import CasesPanel from './dashboard/CasesPanel';
import PendingApprovalsPanel from './dashboard/PendingApprovalsPanel';
import QuickAssignModal from './dashboard/QuickAssignModal';
import WeeklyGantt from './dashboard/WeeklyGantt';
import CaseDetailPanel from './dashboard/CaseDetailPanel';
import SkeletonPanel from './dashboard/SkeletonPanel';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';

export default function UnifiedDashboard() {
  const { user, profile } = useAuth();
  const { engineers, cases, schedules, leaves, loading, updateCase, updateLeave } = useEngineerContext();

  const [activeFilter, setActiveFilter] = useState('total');
  const [selectedCase, setSelectedCase] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [quickAssignCase, setQuickAssignCase] = useState(null); // case to assign

  // Load pending leaves directly (context only loads approved)
  useEffect(() => {
    supabaseService.getLeavesByStatus('pending')
      .then(setPendingLeaves)
      .catch(() => setPendingLeaves([]));
  }, []);

  // KPI counts
  const today = new Date(); today.setHours(0,0,0,0);
  const in7days = new Date(today); in7days.setDate(today.getDate() + 7);

  const counts = useMemo(() => ({
    total:     cases.length,
    upcoming:  cases.filter(c => c.scheduled_start && new Date(c.scheduled_start) >= today && new Date(c.scheduled_start) <= in7days && !['completed','cancelled'].includes(c.status)).length,
    unassigned: cases.filter(c => !c.assigned_engineer_id && !['completed','cancelled'].includes(c.status)).length,
    available: engineers.filter(e => e.is_available).length,
  }), [cases, engineers]);

  const upcomingCases = useMemo(() =>
    cases.filter(c => c.scheduled_start && new Date(c.scheduled_start) >= today && new Date(c.scheduled_start) <= in7days && !['completed','cancelled'].includes(c.status))
      .sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start)),
  [cases]);

  const unassignedCases = useMemo(() =>
    cases.filter(c => !c.assigned_engineer_id && !['completed','cancelled'].includes(c.status)),
  [cases]);

  const unconfirmedCases = useMemo(() =>
    cases.filter(c => c.status === 'assigned'),
  [cases]);

  // Handlers
  // NOTE: updateLeave/updateCase/updateEngineer in context already show their own toasts.
  // Do NOT add extra toast.success() calls here — it would fire two toasts per action.

  const handleApproveLeave = async (leaveId) => {
    await updateLeave(leaveId, { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() });
    setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleRejectLeave = async (leaveId) => {
    await updateLeave(leaveId, { status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString() });
    setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleConfirmCase = async (caseId) => {
    await updateCase(caseId, { status: 'in_progress' });
  };

  const handleQuickAssignSave = async ({ caseId, assigned_engineer_id, scheduled_start, status }) => {
    await updateCase(caseId, { assigned_engineer_id, scheduled_start, status });
    setQuickAssignCase(null);
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    await updateCase(caseId, { status: newStatus });
    setSelectedCase(null);
  };

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[1,2,3,4].map(i => <SkeletonPanel key={i} height={56} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 8 }}>
          <SkeletonPanel height={180} />
          <SkeletonPanel height={180} />
          <SkeletonPanel height={180} />
        </div>
        <SkeletonPanel height={200} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: BG, minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Row 1: KPI Filter Cards */}
      <DashboardKPIBar counts={counts} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Row 2: Command Center */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 10 }}>
        <TeamStatusPanel engineers={engineers} schedules={schedules} currentUserId={user?.id} activeFilter={activeFilter} />
        <CasesPanel
          upcomingCases={upcomingCases}
          unassignedCases={unassignedCases}
          engineers={engineers}
          activeFilter={activeFilter}
          onQuickAssign={setQuickAssignCase}
        />
        <PendingApprovalsPanel
          pendingLeaves={pendingLeaves}
          unconfirmedCases={unconfirmedCases}
          engineers={engineers}
          onApproveLeave={handleApproveLeave}
          onRejectLeave={handleRejectLeave}
          onConfirmCase={handleConfirmCase}
          onReassignCase={setQuickAssignCase}
        />
      </div>

      {/* Row 3: Gantt + Case Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 10 }}>
        <WeeklyGantt
          engineers={engineers}
          schedules={schedules}
          cases={cases}
          leaves={leaves}
          weekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onBarClick={setSelectedCase}
          activeFilter={activeFilter}
        />
        <CaseDetailPanel
          selectedCase={selectedCase}
          engineers={engineers}
          onClose={() => setSelectedCase(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* Quick-assign modal */}
      {quickAssignCase && (
        <QuickAssignModal
          caseToAssign={quickAssignCase}
          engineers={engineers}
          onSave={handleQuickAssignSave}
          onClose={() => setQuickAssignCase(null)}
        />
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Start dev server and open the manager/admin dashboard in the browser**

```bash
npm start
# Log in as admin or manager, navigate to Dashboard tab
# Expected: Glass Premium background, 4 KPI cards, 3-column command center, Gantt timeline
```

- [ ] **Step 3: Fix any console errors before continuing**

Common issues to watch for:
- Missing `updateLeave` in destructure from `useEngineerContext` — add it to the destructure if missing
- `user` undefined before auth loads — the `if (loading)` guard above handles this

- [ ] **Step 4: Commit**

```bash
git add src/components/UnifiedDashboard.js
git commit -m "feat: rewrite UnifiedDashboard with Glass Premium command center layout"
```

---

## Task 11: ActiveCaseHero (engineer Row 1)

**Files:**
- Create: `src/components/dashboard/ActiveCaseHero.jsx`

- [ ] **Step 1: Create ActiveCaseHero**

```jsx
// src/components/dashboard/ActiveCaseHero.jsx
import React, { useState } from 'react';
import GlassPanel from './GlassPanel';
import CaseCompletionModal from '../CaseCompletionModal';
import { STATUS_COLORS, formatShortDate, formatTime } from './dashboardUtils';

const NEXT_STATUSES = {
  assigned:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'on_hold', 'cancelled'],
};

export default function ActiveCaseHero({ activeCase, onUpdateCase }) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  if (!activeCase) {
    return (
      <GlassPanel glow="green" topStripe="linear-gradient(90deg,#34d399,#06b6d4)" style={{ padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>✓</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>All clear</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>No active cases today. Enjoy your day.</div>
          </div>
        </div>
      </GlassPanel>
    );
  }

  const sc = STATUS_COLORS[activeCase.status] || STATUS_COLORS.open;
  const nextStatuses = NEXT_STATUSES[activeCase.status] || [];
  const locationName = activeCase.location?.name || activeCase.client_address || '';
  const timeRange = activeCase.scheduled_start
    ? `${formatTime(activeCase.scheduled_start)}${activeCase.scheduled_end ? ` – ${formatTime(activeCase.scheduled_end)}` : ''}`
    : '';

  const handleCompletionSave = async (completionData) => {
    await onUpdateCase(activeCase.id, {
      status: 'completed',
      completion_details: completionData,
      actual_end: new Date().toISOString(),
    });
    setShowCompletion(false);
  };

  return (
    <>
      <GlassPanel glow="amber" topStripe="linear-gradient(90deg,#fbbf24,#f59e0b)" style={{ padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 4 }}>
              Active Case · Today
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Case #{activeCase.id} — {activeCase.client_name || activeCase.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {locationName && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>📍 {locationName}</span>}
              {timeRange && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>🕐 {timeRange}</span>}
              <span style={{ fontSize: 7, padding: '2px 8px', borderRadius: 8, background: sc.bar, color: sc.border, border: `1px solid ${sc.border}`, fontWeight: 600 }}>
                {sc.label}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setShowCompletion(true)}
              style={{ padding: '6px 16px', background: 'rgba(52,211,153,0.25)', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 6, color: '#6ee7b7', cursor: 'pointer', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}
            >✓ Mark Complete</button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowStatusPicker(p => !p)}
                style={{ width: '100%', padding: '6px 16px', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fde68a', cursor: 'pointer', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}
              >⟳ Update Status</button>
              {showStatusPicker && nextStatuses.length > 0 && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: 8, padding: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                  {nextStatuses.map(s => {
                    const nsc = STATUS_COLORS[s] || STATUS_COLORS.open;
                    return (
                      <button
                        key={s}
                        onClick={async () => {
                          await onUpdateCase(activeCase.id, { status: s });
                          setShowStatusPicker(false);
                        }}
                        style={{ padding: '4px 10px', background: nsc.bar, border: `1px solid ${nsc.border}`, borderRadius: 5, color: nsc.border, cursor: 'pointer', fontSize: 9, fontWeight: 600, textAlign: 'left' }}
                      >{nsc.label}</button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      {showCompletion && (
        <CaseCompletionModal
          caseData={activeCase}
          onClose={() => setShowCompletion(false)}
          onSave={handleCompletionSave}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ActiveCaseHero.jsx
git commit -m "feat: add ActiveCaseHero with completion modal and status picker"
```

---

## Task 12: MyWeekTimeline (engineer Row 2 left)

**Files:**
- Create: `src/components/dashboard/MyWeekTimeline.jsx`

- [ ] **Step 1: Create MyWeekTimeline**

```jsx
// src/components/dashboard/MyWeekTimeline.jsx
import React, { useState } from 'react';
import GlassPanel from './GlassPanel';
import { getWeekStart, getWeekDays, formatDayLabel, isToday, STATUS_COLORS } from './dashboardUtils';

export default function MyWeekTimeline({ schedules, cases, engineerId, weekStart, onWeekChange, onGoToCase }) {
  const [popover, setPopover] = useState(null); // { caseObj, dayIdx }

  const weekDays = getWeekDays(weekStart);

  return (
    <GlassPanel style={{ padding: '10px 14px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <div style={{ flex: 1, fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px' }}>
          This Week — My Schedule
        </div>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); onWeekChange(d); }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
        >‹</button>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); onWeekChange(d); }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
        >›</button>
      </div>

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {weekDays.map((day, i) => {
          const daySchedules = schedules.filter(s => {
            if (s.engineer_id !== engineerId) return false;
            const sd = new Date(s.start_time);
            return sd.toDateString() === day.toDateString();
          });
          const dayCase = daySchedules.length > 0 ? cases.find(c => c.id === daySchedules[0].case_id) : null;
          const sc = dayCase ? (STATUS_COLORS[dayCase.status] || STATUS_COLORS.open) : null;
          const today = isToday(day);

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Day label */}
              <div style={{ width: 36, fontSize: 8, color: today ? '#a78bfa' : 'rgba(255,255,255,0.3)', fontWeight: today ? 700 : 400, flexShrink: 0 }}>
                {formatDayLabel(day)}{today ? ' ●' : ''}
              </div>

              {/* Bar track */}
              <div
                style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4, position: 'relative', cursor: dayCase ? 'pointer' : 'default' }}
                onClick={() => dayCase && setPopover(prev => prev?.id === dayCase.id ? null : { ...dayCase, dayIdx: i })}
              >
                {dayCase ? (
                  <div style={{
                    position: 'absolute', inset: '2px',
                    background: sc.bar, borderRadius: 3, borderLeft: `2px solid ${sc.border}`,
                    display: 'flex', alignItems: 'center', paddingLeft: 6, overflow: 'hidden'
                  }}>
                    <span style={{ fontSize: 7, color: sc.border, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{dayCase.id} {dayCase.location?.name || dayCase.client_address || dayCase.client_name || ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)' }}>No cases</span>
                  </div>
                )}
              </div>

              {/* Status tag */}
              <div style={{ width: 48, flexShrink: 0 }}>
                {sc && (
                  <span style={{ fontSize: 6, padding: '2px 5px', borderRadius: 6, background: sc.bar, color: sc.border, border: `1px solid ${sc.border}`, fontWeight: 600 }}>
                    {sc.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover */}
      {popover && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '0 0 10px 10px',
          padding: '10px 14px', zIndex: 10
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
            Case #{popover.id} — {popover.client_name || popover.title}
          </div>
          {popover.scheduled_start && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
              📅 {new Date(popover.scheduled_start).toLocaleString()}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
            {onGoToCase && (
              <button
                onClick={() => { onGoToCase(); setPopover(null); }}
                style={{ fontSize: 8, padding: '3px 10px', background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 5, color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}
              >Go to Case →</button>
            )}
            <button onClick={() => setPopover(null)} style={{ fontSize: 8, padding: '3px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/MyWeekTimeline.jsx
git commit -m "feat: add MyWeekTimeline for engineer personal schedule view"
```

---

## Task 13: MyStatusControls (engineer Row 2 right top)

**Files:**
- Create: `src/components/dashboard/MyStatusControls.jsx`

- [ ] **Step 1: Create MyStatusControls**

```jsx
// src/components/dashboard/MyStatusControls.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { getEngineerStatus, getInitials, avatarGradient, ENGINEER_STATUS_CONFIG } from './dashboardUtils';

export default function MyStatusControls({ engineer, engineerIndex, schedules, locationObjects, onUpdateEngineer }) {
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  if (!engineer) return null;

  const status = getEngineerStatus(engineer, schedules);
  const cfg = ENGINEER_STATUS_CONFIG[status];
  const cityName = engineer.current_location?.name || engineer.currentLocation || engineer.location?.name || engineer.location || '—';

  const handleLogTravel = async () => {
    if (!selectedLocationId) return;
    await onUpdateEngineer(engineer.id, { current_location_id: parseInt(selectedLocationId, 10), is_available: false });
    setShowTravelModal(false);
    setSelectedLocationId('');
  };

  const handleSetAvailable = async () => {
    const update = { is_available: true };
    if (engineer.location_id) update.current_location_id = engineer.location_id;
    await onUpdateEngineer(engineer.id, update);
  };

  return (
    <>
      <GlassPanel glow="purple" style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>
          My Status
        </div>

        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: avatarGradient(engineerIndex),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700,
            boxShadow: '0 0 0 2px #a78bfa',
          }}>
            {getInitials(engineer.name)}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{engineer.name}</div>
            <div style={{ fontSize: 8, color: cfg.color, marginTop: 1 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cfg.color, boxShadow: cfg.glow, marginRight: 4, verticalAlign: 'middle' }}/>
              {cfg.label} · {cityName}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => setShowTravelModal(true)}
          style={{ width: '100%', padding: '6px 0', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fde68a', cursor: 'pointer', fontSize: 9, fontWeight: 600, marginBottom: 6 }}
        >📍 Log Travel / Change Location</button>
        <button
          onClick={handleSetAvailable}
          style={{ width: '100%', padding: '6px 0', background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 6, color: '#6ee7b7', cursor: 'pointer', fontSize: 9, fontWeight: 600 }}
        >✓ Set Available</button>
      </GlassPanel>

      {/* Log Travel Modal */}
      {showTravelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: 12, padding: 24, width: 320, boxShadow: '0 0 24px rgba(167,139,250,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Log Travel</div>
              <button onClick={() => setShowTravelModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Destination</div>
            <select
              value={selectedLocationId}
              onChange={e => setSelectedLocationId(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 16 }}
            >
              <option value="">Select location…</option>
              {locationObjects.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTravelModal(false)} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button
                onClick={handleLogTravel}
                disabled={!selectedLocationId}
                style={{ padding: '6px 14px', background: selectedLocationId ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedLocationId ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: selectedLocationId ? '#fde68a' : 'rgba(255,255,255,0.3)', cursor: selectedLocationId ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/MyStatusControls.jsx
git commit -m "feat: add MyStatusControls with log travel modal and set available"
```

---

## Task 14: Wire Up EngineerDashboard

**Files:**
- Modify: `src/components/EngineerDashboard.js`
- Modify: `src/App.js` (line 154)

- [ ] **Step 1: Replace EngineerDashboard.js**

Replace the entire file contents with:

```jsx
// src/components/EngineerDashboard.js
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import { getWeekStart } from './dashboard/dashboardUtils';
import ActiveCaseHero from './dashboard/ActiveCaseHero';
import MyWeekTimeline from './dashboard/MyWeekTimeline';
import MyStatusControls from './dashboard/MyStatusControls';
import TeamStatusPanel from './dashboard/TeamStatusPanel';
import SkeletonPanel from './dashboard/SkeletonPanel';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';

// NOTE: EngineerDashboard needs to receive setActiveTab from App.js to support "Go to Case" navigation.
// In App.js, pass it as: <EngineerDashboard onGoToCases={() => setActiveTab('cases')} />

export default function EngineerDashboard({ onGoToCases }) {
  const { profile } = useAuth();
  const { engineers, cases, schedules, locationObjects, loading, updateCase, updateEngineer } = useEngineerContext();

  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());

  // Current engineer record
  const currentEngineer = engineers.find(e => e.id === profile?.id) || null;
  const engineerIndex = engineers.indexOf(currentEngineer);

  // Active case: in_progress first, then assigned today
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const activeCase = useMemo(() => {
    const myCases = cases.filter(c => c.assigned_engineer_id === profile?.id);
    const inProgress = myCases.filter(c => c.status === 'in_progress')
      .sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    if (inProgress.length > 0) return inProgress[0];
    const assignedToday = myCases.filter(c =>
      c.status === 'assigned' && c.scheduled_start &&
      new Date(c.scheduled_start) >= today && new Date(c.scheduled_start) < tomorrow
    ).sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    return assignedToday[0] || null;
  }, [cases, profile?.id]);

  // NOTE: updateCase/updateEngineer in context already show their own toasts.
  // Do NOT add extra toast.success() calls here — it would fire two toasts per action.

  const handleUpdateCase = async (caseId, updates) => {
    await updateCase(caseId, updates);
  };

  const handleUpdateEngineer = async (id, updates) => {
    await updateEngineer(id, updates);
  };

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletonPanel height={80} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
          <SkeletonPanel height={240} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonPanel height={110} />
            <SkeletonPanel height={120} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: BG, minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Row 1: Hero Active Case */}
      <ActiveCaseHero activeCase={activeCase} onUpdateCase={handleUpdateCase} />

      {/* Row 2: Week schedule (left) + Status controls + Team (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
        <MyWeekTimeline
          schedules={schedules}
          cases={cases}
          engineerId={profile?.id}
          weekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onGoToCase={onGoToCases}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MyStatusControls
            engineer={currentEngineer}
            engineerIndex={engineerIndex >= 0 ? engineerIndex : 0}
            schedules={schedules}
            locationObjects={locationObjects}
            onUpdateEngineer={handleUpdateEngineer}
          />
          <div style={{ flex: 1 }}>
            <TeamStatusPanel
              engineers={engineers}
              schedules={schedules}
              currentUserId={profile?.id}
              activeFilter={null}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Fix App.js routing**

In `src/App.js`, find line 154:
```jsx
{activeTab === 'personal' && <UnifiedDashboard />}
```
Change to:
```jsx
{activeTab === 'personal' && <EngineerDashboard onGoToCases={() => setActiveTab('cases')} />}
```

Also ensure `EngineerDashboard` is imported at the top:
```jsx
import EngineerDashboard from './components/EngineerDashboard';
```

- [ ] **Step 3: Open the engineer dashboard in the browser**

```bash
# Log in as an engineer user, navigate to Dashboard tab
# Expected: Glass Premium background, amber hero card (or green "All clear"), week timeline, status controls, team list
```

- [ ] **Step 4: Fix any console errors**

Common issues:
- `locationObjects` not destructured from context — check `useEngineerContext()` exposes it (it's in `initialState`)
- `updateLeave` not in `useEngineerContext` exports — check context value object

- [ ] **Step 5: Commit**

```bash
git add src/components/EngineerDashboard.js src/App.js
git commit -m "feat: rewrite EngineerDashboard with Glass Premium hero layout and wire personal tab"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Log in as admin — verify manager dashboard**

- KPI cards show counts and clicking them changes filter state (TeamStatus dims, Gantt dims accordingly)
- Row 2 center shows upcoming cases + unassigned with `+` button
- Row 2 right shows pending leave requests with ✓ / ✕ buttons, unconfirmed assignments
- Row 3 Gantt shows engineer rows with bars and leave hatching; clicking a bar opens Case Detail Panel
- Case Detail Panel shows status picker and closes on ✕

- [ ] **Step 2: Log in as engineer — verify engineer dashboard**

- Hero card shows active case with amber top stripe, or green "All clear" if none
- "Mark Complete" opens CaseCompletionModal
- "Update Status" shows valid next-status options
- Week timeline shows Mon–Fri with bars on days that have scheduled cases
- "Log Travel" button opens modal with location dropdown
- "Set Available" updates status dot in My Status panel
- Team Status list shows all engineers with colored dots

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Glass Premium dashboard redesign for manager and engineer views"
```
