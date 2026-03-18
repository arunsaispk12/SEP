# SEP UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire SEP app UI with the Glass Premium dark aesthetic — new glass sidebar/topbar shell, remove broken theme toggle, move user avatar+logout into sidebar, add list/calendar toggle to Cases tab, remove dead code, and apply glass card styling consistently across all pages.

**Architecture:** The gradient background is set once globally in CSS. Two new components (`GlassSidebar`, `GlassTopBar`) replace the existing `Navbar` and `SidebarTabs`. CSS utility classes (`.glass-panel`, `.glass-modal`, `.glass-input`) defined in `index.css` are applied across all page components. `CaseCalendarView` is a new component that wraps `react-big-calendar` for the Cases tab. `CaseManager` gets a list/calendar toggle at the top.

**Tech Stack:** React (inline styles + CSS classes), Tailwind CSS, Framer Motion, react-big-calendar + momentLocalizer, lucide-react, Supabase

**Spec:** `docs/superpowers/specs/2026-03-18-ui-rebuild-design.md`

---

## Glass Design Tokens (Reference — do not skip)

These tokens appear in every task. Memorise them before starting.

```
Background gradient:  linear-gradient(135deg,#0f0c29,#302b63,#24243e)  [fixed on html/body]
Glass panel bg:       rgba(255,255,255,0.06)
Glass panel border:   1px solid rgba(255,255,255,0.1)
Glass panel blur:     backdrop-filter: blur(12px)
Glass panel radius:   16px
Glass modal bg:       rgba(255,255,255,0.08)
Glass modal border:   1px solid rgba(255,255,255,0.12)
Glass modal blur:     backdrop-filter: blur(20px)
Glass modal radius:   20px
Input bg default:     rgba(255,255,255,0.05)
Input bg focused:     rgba(167,139,250,0.04)
Input border focused: 1px solid rgba(167,139,250,0.6)
Focus ring:           0 0 0 3px rgba(167,139,250,0.12)
Primary gradient:     linear-gradient(135deg,#3b82f6,#8b5cf6)
Accent purple:        #a78bfa
Accent blue:          #60a5fa
Text primary:         #ffffff
Text secondary:       rgba(255,255,255,0.55)
Text muted:           rgba(255,255,255,0.3)
Sidebar width:        240px
Topbar height:        48px
Font:                 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
```

---

## File Map

| File | Action |
|---|---|
| `src/index.css` | Modify — replace body bg, remove light theme block, add glass utilities, update rbc colours |
| `src/App.js` | Modify — remove isDark/toggleTheme, swap Navbar→GlassTopBar, SidebarTabs→GlassSidebar, update layout |
| `src/components/GlassSidebar.jsx` | **Create** — new sidebar |
| `src/components/GlassTopBar.jsx` | **Create** — new topbar |
| `src/components/CaseCalendarView.jsx` | **Create** — react-big-calendar cases view |
| `src/components/CaseManager.js` | Modify — add list/calendar toggle, wire CaseCalendarView |
| `src/components/UnifiedDashboard.js` | Modify — glass restyle |
| `src/components/EngineerDashboard.js` | Modify — glass restyle |
| `src/components/dashboard/*.jsx` | Modify — glass restyle (GlassPanel already glass-ready; others need update) |
| `src/components/ScheduleCalendar.js` | Modify — glass restyle |
| `src/components/ClientManagement.js` | Modify — glass restyle |
| `src/components/LocationManagement.js` | Modify — glass restyle |
| `src/components/ProfileManagement.js` | Modify — glass restyle + avatar preview |
| `src/components/UserManagement.js` | Modify — glass restyle |
| `src/components/AdminPanel.js` | Modify — glass restyle + tab data audit |
| `src/components/GoogleCalendarSync.js` | Modify — glass restyle + empty state |
| `src/components/EnhancedDashboard.js` | **Delete** |
| `src/components/EngineerPersonalDashboard.js` | **Delete** |
| `src/components/WeeklyCalendar.js` | **Delete** |
| `src/components/LoginTest.js` | **Delete** |
| `src/components/AuthDebug.js` | **Delete** |
| `src/components/DashboardCard.jsx` | **Delete** |

---

## Task 1: Global CSS — gradient background, glass utilities, remove light mode

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Update `@layer base` to use gradient background**

Replace lines 6–19 (`@layer base { ... }`) with:

```css
@layer base {
  * {
    border-color: rgba(148, 163, 184, 0.1);
  }
  html, body, #root {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    background-attachment: fixed;
    color: #f8fafc;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  }
}
```

- [ ] **Step 2: Add glass utility classes**

After the `@layer base` block and before the `.container` class, add:

```css
/* ===== Glass Design System ===== */
.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
}

.glass-panel-sm {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
}

.glass-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 12, 41, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.glass-modal {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
}

.glass-modal-wide {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  height: 42px;
  padding: 0 14px;
  width: 100%;
  outline: none;
  box-sizing: border-box;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.glass-input::placeholder { color: rgba(255, 255, 255, 0.25); }
.glass-input:focus {
  background: rgba(167, 139, 250, 0.04);
  border-color: rgba(167, 139, 250, 0.6);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.12);
}

.glass-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  height: 42px;
  padding: 0 14px;
  width: 100%;
  outline: none;
  box-sizing: border-box;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}
.glass-select:focus {
  border-color: rgba(167, 139, 250, 0.6);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.12);
}
.glass-select option { background: #1e1b4b; color: #fff; }

.glass-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  padding: 12px 14px;
  width: 100%;
  outline: none;
  box-sizing: border-box;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.glass-textarea::placeholder { color: rgba(255, 255, 255, 0.25); }
.glass-textarea:focus {
  border-color: rgba(167, 139, 250, 0.6);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.12);
}

.glass-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 20px;
  height: 40px;
  font-family: inherit;
  transition: opacity 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  white-space: nowrap;
}
.glass-btn-primary:hover { opacity: 0.9; box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
.glass-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.glass-btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 20px;
  height: 40px;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.glass-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.glass-btn-danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #f87171;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 20px;
  height: 40px;
  font-family: inherit;
  transition: background 0.15s;
  white-space: nowrap;
}
.glass-btn-danger:hover { background: rgba(239, 68, 68, 0.25); }

.section-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin-bottom: 8px;
}

.glass-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 20px 0;
}

/* Loading spinner */
.glass-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 3: Delete the entire light theme block**

**Do Step 3 before Step 2** (so line numbers are still accurate). Find and delete everything from this comment marker to the end of the file's light theme block:

```
/* ============================================================
   LIGHT THEME — html:not(.dark) overrides
```

Delete from that comment down through all `html:not(.dark)` rules including the final scrollbar override. Identify by the comment text, not line numbers (Step 2 will have shifted them).

After deletion, verify no `html:not(.dark)` rules remain:
```bash
grep -n "html:not(.dark)" src/index.css
```
Expected: zero matches.

- [ ] **Step 4: Update the loading screen styles in index.css**

After the global styles, add:

```css
/* ===== App loading state ===== */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  color: rgba(255,255,255,0.6);
  font-size: 14px;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

- [ ] **Step 5: Verify visually**

Run `npm start`. The browser should show a deep purple-indigo gradient background on the page — not a navy or white background. Login page should still look identical.

- [ ] **Step 6: Update tailwind.config.js**

In `src/tailwind.config.js` (or `tailwind.config.js` at project root), find `darkMode: 'class'` and change it to `darkMode: 'media'`. This prevents Tailwind from generating `dark:` variants that rely on a toggled class — the app is now dark-only.

```bash
grep -n "darkMode" tailwind.config.js
```

Change the found line from `darkMode: 'class'` to `darkMode: 'media'`.

- [ ] **Step 7: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "style: replace body bg with glass gradient, add glass utility classes, remove light theme block, set darkMode media"
```

---

## Task 2: Delete dead code

**Files:**
- Delete: `src/components/EnhancedDashboard.js`
- Delete: `src/components/EngineerPersonalDashboard.js`
- Delete: `src/components/WeeklyCalendar.js`
- Delete: `src/components/LoginTest.js`
- Delete: `src/components/AuthDebug.js`
- Delete: `src/components/DashboardCard.jsx`

- [ ] **Step 1: Verify files are not imported anywhere**

```bash
grep -r "EnhancedDashboard\|EngineerPersonalDashboard\|WeeklyCalendar\|LoginTest\|AuthDebug\|DashboardCard" src/
```

Expected: any matches are in the files themselves (their own `export` lines), not in other files. If any other file imports them, remove that import first.

- [ ] **Step 2: Delete the files**

```bash
rm src/components/EnhancedDashboard.js
rm src/components/EngineerPersonalDashboard.js
rm src/components/WeeklyCalendar.js
rm src/components/LoginTest.js
rm src/components/AuthDebug.js
rm src/components/DashboardCard.jsx
```

- [ ] **Step 3: Verify app still compiles**

Run `npm start`. No import errors should appear in the console.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused components — EnhancedDashboard, EngineerPersonalDashboard, WeeklyCalendar, LoginTest, AuthDebug, DashboardCard"
```

---

## Task 3: Create GlassSidebar component

**Files:**
- Create: `src/components/GlassSidebar.jsx`

The sidebar has three zones: brand (top), nav (scrollable middle), user (pinned bottom).

- [ ] **Step 1: Create the file with complete implementation**

```jsx
// src/components/GlassSidebar.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, BarChart2, Users, Building2, MapPin,
  Calendar, ClipboardList, RefreshCw, Home, Settings,
  LogOut, ChevronRight, X,
} from 'lucide-react';

const SIDEBAR_W = 240;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const ICON_MAP = {
  admin: Shield,
  dashboard: BarChart2,
  manager: BarChart2,
  users: Users,
  clients: Building2,
  locations: MapPin,
  calendar: Calendar,
  cases: ClipboardList,
  sync: RefreshCw,
  personal: Home,
  account: Settings,
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function avatarGradient(name) {
  const colors = [
    'linear-gradient(135deg,#a78bfa,#ec4899)',
    'linear-gradient(135deg,#60a5fa,#34d399)',
    'linear-gradient(135deg,#fbbf24,#f97316)',
    'linear-gradient(135deg,#34d399,#06b6d4)',
    'linear-gradient(135deg,#f472b6,#a78bfa)',
  ];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[idx];
}

const LogoMark = () => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 16px rgba(167,139,250,0.3)' }}>
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
      <circle cx="5" cy="5" r="1.8" fill="white"/>
      <circle cx="11" cy="5" r="1.8" fill="white"/>
      <circle cx="17" cy="5" r="1.8" fill="white"/>
      <circle cx="5" cy="11" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="11" r="2.5" fill="white"/>
      <circle cx="17" cy="11" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="5" cy="17" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="17" r="1.8" fill="white"/>
      <circle cx="17" cy="17" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <line x1="11" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="5" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="17" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="11" y1="11" x2="11" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
    </svg>
  </div>
);

export default function GlassSidebar({ activeTab, setActiveTab, tabs, user, profile, logout, isOpen, onClose }) {
  const name = profile?.name || user?.email || '';
  const role = profile?.role || '';
  const roleBadgeColor = {
    admin: '#f87171',
    manager: '#60a5fa',
    executive: '#fbbf24',
    engineer: '#34d399',
  }[role] || '#a78bfa';

  // isOpen controls mobile slide. On desktop (>768px) sidebar is always visible via CSS.
  return (
    <div
      className={`glass-sidebar${isOpen ? ' glass-sidebar--open' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIDEBAR_W,
        height: '100vh',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        fontFamily: FONT,
      }}
    >

      {/* ── Brand zone ── */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <LogoMark />
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.2px' }}>Service Engineer<br/>Planner</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Field Ops Platform</div>
        </div>
        {/* Mobile close button — hidden on desktop via CSS */}
        <button onClick={onClose} className="glass-sidebar-close" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'none' }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Nav zone ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tabs.map(tab => {
          const Icon = ICON_MAP[tab.id] || ClipboardList;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); onClose?.(); }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(167,139,250,0.15)' : 'transparent',
                textAlign: 'left',
                width: '100%',
                position: 'relative',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: 'linear-gradient(180deg,#a78bfa,#60a5fa)', borderRadius: '0 2px 2px 0' }} />
              )}
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} color={isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)'} />
              {tab.label}
              {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'rgba(167,139,250,0.6)' }} />}
            </motion.button>
          );
        })}
      </nav>

      {/* ── User zone ── */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {getInitials(name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ display: 'inline-block', marginTop: 3, padding: '1px 7px', borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: roleBadgeColor, background: `${roleBadgeColor}18`, border: `1px solid ${roleBadgeColor}30` }}>{role}</div>
          </div>
        </div>
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 36, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        >
          <LogOut size={13} />
          Sign out
        </motion.button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file saved correctly**

Check `src/components/GlassSidebar.jsx` exists and has no syntax errors (no red underlines in editor, or run `node -e "require('./src/components/GlassSidebar.jsx')"` and check for parse errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/GlassSidebar.jsx
git commit -m "feat: add GlassSidebar component with glass premium styling and user zone at bottom"
```

---

## Task 4: Create GlassTopBar component

**Files:**
- Create: `src/components/GlassTopBar.jsx`

- [ ] **Step 1: Create the file with complete implementation**

```jsx
// src/components/GlassTopBar.jsx
import React from 'react';
import { Bell, Menu } from 'lucide-react';

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const TAB_TITLES = {
  admin: 'Admin Panel',
  dashboard: 'Dashboard',
  manager: 'Dashboard',
  personal: 'My Dashboard',
  users: 'User Management',
  clients: 'Clients',
  locations: 'Locations',
  calendar: 'Schedule',
  cases: 'Cases',
  sync: 'Google Calendar',
  account: 'Account',
};

export default function GlassTopBar({ activeTab, onMenuClick }) {
  const title = TAB_TITLES[activeTab] || 'SEP';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 240,
      right: 0,
      height: 48,
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 20,
      paddingRight: 16,
      gap: 12,
      zIndex: 30,
      fontFamily: FONT,
    }}>
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}
        className="topbar-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.2px', flex: 1 }}>
        {title}
      </div>

      {/* Notification bell — placeholder */}
      <button
        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        title="Notifications"
      >
        <Bell size={14} color="rgba(255,255,255,0.5)" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add mobile CSS for sidebar and topbar to index.css**

At the end of `src/index.css`, add:

```css
/* ===== Sidebar mobile ===== */
@media (max-width: 768px) {
  .glass-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .glass-sidebar--open {
    transform: translateX(0);
  }
  .glass-sidebar-close {
    display: flex !important;
  }
}

/* ===== TopBar mobile ===== */
@media (max-width: 768px) {
  .topbar-menu-btn { display: flex !important; }
  .glass-topbar { left: 0 !important; }
}
```

Also update `GlassTopBar.jsx` outer div: change `<div style={{...}}>` to `<div className="glass-topbar" style={{...}}>`.

- [ ] **Step 3: Commit**

```bash
git add src/components/GlassTopBar.jsx src/index.css
git commit -m "feat: add GlassTopBar component with page title and mobile hamburger"
```

---

## Task 5: Wire App.js — new shell, remove theme toggle

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Replace imports at top of App.js**

Replace:
```js
import Navbar from './components/Navbar';
import SidebarTabs from './components/SidebarTabs';
```

With:
```js
import GlassSidebar from './components/GlassSidebar';
import GlassTopBar from './components/GlassTopBar';
```

- [ ] **Step 2: Remove isDark state, toggleTheme, and the dark class effect**

Remove these lines:
```js
const [isDark, setIsDark] = useState(true);

// Theme toggle functionality
const toggleTheme = () => {
  setIsDark(!isDark);
  document.documentElement.classList.toggle('dark', !isDark);
};

// Initialize theme on mount
useEffect(() => {
  document.documentElement.classList.add('dark');
}, []);
```

The current `App.js` already has `const [sidebarOpen, setSidebarOpen] = useState(false);` and the `useEffect` that closes sidebar on tab change — keep both. Do not remove them.

If `sidebarOpen` state is not already present (check the file), add it:
```js
const [sidebarOpen, setSidebarOpen] = useState(false);
```

And add the sidebar-close-on-tab-change effect if missing:
```js
useEffect(() => {
  setSidebarOpen(false);
}, [activeTab]);
```

- [ ] **Step 3: Replace the JSX return block**

Replace the entire `return (...)` in `AppContent` with:

```jsx
return (
  <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
    <Toaster position="top-right" toastOptions={{ style: { background: 'rgba(30,27,75,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', backdropFilter: 'blur(12px)' } }} />

    {/* Mobile backdrop */}
    {sidebarOpen && (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 35 }}
        onClick={() => setSidebarOpen(false)}
      />
    )}

    <GlassSidebar
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={tabs}
      user={user}
      profile={profile}
      logout={logout}
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />

    <GlassTopBar
      activeTab={activeTab}
      onMenuClick={() => setSidebarOpen(prev => !prev)}
    />

    {/* Main content area */}
    <div style={{ marginLeft: 240, paddingTop: 48 }} className="content-area">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{ padding: '24px' }}
        >
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'dashboard' && <UnifiedDashboard />}
          {activeTab === 'personal' && <EngineerDashboard onGoToCases={() => setActiveTab('cases')} />}
          {activeTab === 'account' && <ProfileManagement />}
          {activeTab === 'manager' && <UnifiedDashboard />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'clients' && <ClientManagement />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'calendar' && <ScheduleCalendar />}
          {activeTab === 'cases' && <CaseManager />}
          {activeTab === 'sync' && <GoogleCalendarSync />}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
);
```

- [ ] **Step 4: Add mobile CSS for content area**

In `src/index.css`, add:

```css
@media (max-width: 768px) {
  .content-area { margin-left: 0 !important; }
}
```

- [ ] **Step 5: Verify the shell works**

Run `npm start`. You should see:
- Deep gradient background
- Glass sidebar on the left with logo, tabs, user zone at bottom
- Thin glass topbar at top (starts at x=240)
- Content area to the right of sidebar
- No theme toggle anywhere
- Tabs navigate correctly for each role
- Logout button in sidebar works

- [ ] **Step 6: Commit**

```bash
git add src/App.js src/index.css
git commit -m "feat: wire GlassSidebar + GlassTopBar into App.js, remove theme toggle"
```

---

## Task 6: Create CaseCalendarView component

**Files:**
- Create: `src/components/CaseCalendarView.jsx`

**Context:** `react-big-calendar` is already installed. `moment` is already installed. The existing `ScheduleCalendar.js` uses `momentLocalizer(moment)`. The rbc dark CSS is already in `index.css`. The `STATUS_COLORS` map is in `src/components/dashboard/dashboardUtils.js`.

- [ ] **Step 1: Check the STATUS_COLORS export in dashboardUtils.js**

Read `src/components/dashboard/dashboardUtils.js`. Find the `STATUS_COLORS` object and note the exact export name. It should look like:
```js
export const STATUS_COLORS = { open: '...', assigned: '...', in_progress: '...', ... };
```

If it's a default export or named differently, adjust the import in Step 2 accordingly.

- [ ] **Step 2: Create CaseCalendarView.jsx**

```jsx
// src/components/CaseCalendarView.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { STATUS_COLORS } from './dashboard/dashboardUtils';

const localizer = momentLocalizer(moment);
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

// engineers prop is passed through for future use (showing assignee names on event chips)
export default function CaseCalendarView({ cases, engineers = [], currentUserId, isEngineer, onSelectCase }) {
  const [calView, setCalView] = useState('week');

  const events = useMemo(() => {
    return cases
      .filter(c => c.scheduled_start)
      .map(c => ({
        id: c.id,
        title: `${c.case_number || c.id.slice(0, 8)} — ${c.title || c.description?.slice(0, 30) || 'Case'}`,
        start: new Date(c.scheduled_start),
        end: c.scheduled_end
          ? new Date(c.scheduled_end)
          : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
        resource: c,
      }));
  }, [cases]);

  const unscheduledCount = cases.filter(c => !c.scheduled_start).length;

  const eventPropGetter = (event) => {
    const isOwn = event.resource.assigned_engineer_id === currentUserId;
    const dimmed = isEngineer && !isOwn;
    const color = STATUS_COLORS[event.resource.status] || '#6b7280';
    return {
      style: {
        backgroundColor: color,
        opacity: dimmed ? 0.45 : 1,
        border: dimmed ? '1px dashed rgba(255,255,255,0.3)' : 'none',
        borderRadius: 6,
        color: '#fff',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: FONT,
        padding: '2px 6px',
        cursor: 'pointer',
      },
    };
  };

  const views = ['day', 'week', 'month'];

  return (
    <div style={{ fontFamily: FONT }}>
      {/* View switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {views.map(v => (
          <button
            key={v}
            onClick={() => setCalView(v)}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: calView === v ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)',
              background: calView === v ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
              color: calView === v ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontFamily: FONT,
              transition: 'all 0.15s',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Unscheduled banner */}
      {unscheduledCount > 0 && (
        <div style={{ marginBottom: 14, padding: '8px 14px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, fontSize: 12, color: '#fbbf24' }}>
          {unscheduledCount} case{unscheduledCount > 1 ? 's have' : ' has'} no scheduled date and {unscheduledCount > 1 ? 'are' : 'is'} not shown in calendar view. Switch to List view to see {unscheduledCount > 1 ? 'them' : 'it'}.
        </div>
      )}

      {/* Legend */}
      {isEngineer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#a78bfa' }} />
            Your cases (full)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#6b7280', opacity: 0.45, border: '1px dashed rgba(255,255,255,0.3)' }} />
            Other cases (dimmed)
          </div>
        </div>
      )}

      {/* Calendar — toolbar=false because we render our own view switcher above */}
      <div style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={calView}
          onView={setCalView}
          onSelectEvent={event => onSelectCase?.(event.resource)}
          eventPropGetter={eventPropGetter}
          style={{ height: '100%' }}
          toolbar={false}
          popup
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CaseCalendarView.jsx
git commit -m "feat: add CaseCalendarView component with day/week/month views and role-based opacity"
```

---

## Task 7: Add list/calendar toggle to CaseManager

**Files:**
- Modify: `src/components/CaseManager.js`

**Context:** Read `src/components/CaseManager.js` before making changes. Note the existing state variables (especially `cases`, `engineers`, any auth/profile state). The toggle goes at the top of the returned JSX, before the existing search/filter bar.

- [ ] **Step 1: Read CaseManager.js**

Read `src/components/CaseManager.js`. Note:
- The top-level `return (...)` structure
- Where `cases` and `engineers` state arrays are defined
- How `selectedCase` is managed (for CaseDetailPanel)
- Where `user`/`profile` is accessed (likely from `useAuth()`)

- [ ] **Step 2: Add imports**

At the top of `CaseManager.js`, add:
```js
import CaseCalendarView from './CaseCalendarView';
```

- [ ] **Step 3: Add view mode state**

Inside the component function, add near the top with other state:
```js
const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
```

- [ ] **Step 4: Add isEngineer / currentUserId derivation**

After `const { user, profile } = useAuth();` (or wherever auth is accessed), add:
```js
const isEngineer = profile?.role === 'engineer';
const currentUserId = user?.id;
```

- [ ] **Step 5: Add the toggle bar at the top of the JSX return**

In the returned JSX, immediately before the search/filter row (or as the very first element inside the main wrapper), add:

```jsx
{/* View mode toggle */}
<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
  {['list', 'calendar'].map(mode => (
    <button
      key={mode}
      onClick={() => setViewMode(mode)}
      style={{
        padding: '6px 16px',
        borderRadius: 9,
        border: '1px solid',
        borderColor: viewMode === mode ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)',
        background: viewMode === mode ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
        color: viewMode === mode ? '#a78bfa' : 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        textTransform: 'capitalize',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
    >
      {mode === 'list' ? '☰ List' : '📅 Calendar'}
    </button>
  ))}
</div>
```

- [ ] **Step 6: Conditionally render CaseCalendarView in calendar mode**

Find where the main case list content is rendered (the search bar, filters, and case cards/table). Wrap it in a condition:

```jsx
{viewMode === 'list' ? (
  <>
    {/* existing search, filters, case list content — untouched */}
  </>
) : (
  <CaseCalendarView
    cases={cases}
    engineers={engineers}
    currentUserId={currentUserId}
    isEngineer={isEngineer}
    onSelectCase={(caseObj) => setSelectedCase(caseObj)}
  />
)}
```

**Important:** `setSelectedCase` should be the same state setter already used by `CaseDetailPanel`. If the variable name is different (e.g. `setActiveCaseDetail`), use the correct name.

- [ ] **Step 7: Verify calendar mode works**

Run `npm start`, navigate to Cases tab. Switch between List and Calendar modes. Calendar should show all cases that have a `scheduled_start`. Clicking a case event should open CaseDetailPanel.

- [ ] **Step 8: Commit**

```bash
git add src/components/CaseManager.js
git commit -m "feat: add list/calendar toggle to CaseManager with CaseCalendarView integration"
```

---

## Task 8: Glass restyle — Dashboard components

**Files:**
- Modify: `src/components/UnifiedDashboard.js`
- Modify: `src/components/EngineerDashboard.js`
- Modify: `src/components/dashboard/GlassPanel.jsx` (verify already glass-ready)
- Modify: `src/components/dashboard/DashboardKPIBar.jsx`
- Modify: `src/components/dashboard/TeamStatusPanel.jsx`
- Modify: `src/components/dashboard/CasesPanel.jsx`
- Modify: `src/components/dashboard/PendingApprovalsPanel.jsx`
- Modify: `src/components/dashboard/QuickAssignModal.jsx`
- Modify: `src/components/dashboard/MyWeekTimeline.jsx`
- Modify: `src/components/dashboard/WeeklyGantt.jsx`
- Modify: `src/components/dashboard/ActiveCaseHero.jsx`
- Modify: `src/components/dashboard/MyStatusControls.jsx`
- Modify: `src/components/dashboard/CaseDetailPanel.jsx`

**The glass restyle pattern to apply to each file:**

| Replace | With |
|---|---|
| `className="..."` with navy/gray bg | Inline `style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 16 }}` |
| `className="...modal..."` backgrounds | `className="glass-modal-backdrop"` on backdrop, `className="glass-modal"` on panel |
| `<input className="...">` | `<input className="glass-input">` |
| `<select className="...">` | `<select className="glass-select">` |
| Primary action buttons | `className="glass-btn-primary"` |
| Secondary/cancel buttons | `className="glass-btn-secondary"` |
| Danger buttons | `className="glass-btn-danger"` |
| Section label divs | `className="section-label"` |
| Dividers | `className="glass-divider"` |

- [ ] **Step 1: Read and restyle GlassPanel.jsx**

Read `src/components/dashboard/GlassPanel.jsx`. It should already use glass styling (rgba backgrounds, backdrop-filter). Verify it renders correctly with the new gradient background — glass cards should be subtly lighter than the deep purple behind them. If it uses hardcoded navy backgrounds instead, replace with `rgba(255,255,255,0.06)`.

- [ ] **Step 2: Restyle DashboardKPIBar.jsx**

Read the file. The 4 KPI cards likely use Tailwind `bg-navy-light` or similar. For each card div:
- Replace background class with inline `style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '14px 18px' }}`
- Ensure metric numbers are `color: '#fff'` and labels are `color: 'rgba(255,255,255,0.5)'`

- [ ] **Step 3: Restyle TeamStatusPanel.jsx**

Read the file. The panel wrapper and each engineer row:
- Panel: `className="glass-panel"` with `style={{ padding: '16px' }}`
- Engineer rows: `style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}`

- [ ] **Step 4: Restyle CasesPanel.jsx, PendingApprovalsPanel.jsx**

Same pattern: replace Tailwind bg classes with glass panel style. Panel header labels get `className="section-label"`.

- [ ] **Step 5: Restyle QuickAssignModal.jsx**

The modal backdrop becomes `className="glass-modal-backdrop"`. The modal panel becomes `className="glass-modal"`. Form inputs become `className="glass-input"` and `className="glass-select"`. Buttons get `className="glass-btn-primary"` or `className="glass-btn-secondary"`.

- [ ] **Step 6: Restyle MyWeekTimeline.jsx, WeeklyGantt.jsx**

Wrapper panels: `className="glass-panel"`. Week navigation buttons: `className="glass-btn-secondary"`. Day/row elements use `rgba(255,255,255,0.03)` backgrounds.

- [ ] **Step 7: Restyle ActiveCaseHero.jsx, MyStatusControls.jsx, CaseDetailPanel.jsx**

Same pattern. ActiveCaseHero: large glass panel, status badge retains existing colour. CaseDetailPanel: becomes a glass side panel with `style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: 20 }}`.

- [ ] **Step 8: Restyle UnifiedDashboard.js and EngineerDashboard.js**

These are layout files. Replace any `className="bg-navy-*"` or `style={{ background: '#...' }}` wrappers with transparent or glass backgrounds. The layout structure (grid, flex rows) stays the same — only backgrounds change.

- [ ] **Step 9: Verify dashboard renders correctly**

Run `npm start`, log in as admin and as engineer. Both dashboards should show glass cards floating on the deep gradient background. No white or solid navy panels.

- [ ] **Step 10: Commit**

```bash
git add src/components/UnifiedDashboard.js src/components/EngineerDashboard.js src/components/dashboard/
git commit -m "style: apply glass premium restyle to dashboard and sub-components"
```

---

## Task 9: Glass restyle — Management pages + functional gap fixes

**Files:**
- Modify: `src/components/ScheduleCalendar.js`
- Modify: `src/components/ClientManagement.js`
- Modify: `src/components/LocationManagement.js`
- Modify: `src/components/ProfileManagement.js`
- Modify: `src/components/UserManagement.js`
- Modify: `src/components/AdminPanel.js`
- Modify: `src/components/GoogleCalendarSync.js`

Apply the same glass pattern from Task 8 to each file. Additionally address the three functional gaps below.

- [ ] **Step 1: Restyle ScheduleCalendar.js**

Read the file. The calendar wrapper div (`.calendar-wrapper` or equivalent) gets `className="glass-panel"`. The toolbar/header area above the calendar gets glass panel styling. The react-big-calendar itself already has dark CSS from `index.css` — do not add duplicate rbc styles.

- [ ] **Step 2: Restyle ClientManagement.js**

Read the file. Apply:
- Page header area: transparent background (the gradient shows through)
- Client list cards: `className="glass-panel-sm"` with `style={{ padding: '14px 16px', marginBottom: 10 }}`
- Search input: `className="glass-input"`
- Filter selects: `className="glass-select"`
- "Add Client" button: `className="glass-btn-primary"`
- Add/Edit modal backdrop: `className="glass-modal-backdrop"`, panel: `className="glass-modal"`
- All form inputs inside modal: `className="glass-input"` / `className="glass-select"`
- Save button: `className="glass-btn-primary"`, Cancel: `className="glass-btn-secondary"`

- [ ] **Step 3: Restyle LocationManagement.js**

Same pattern as ClientManagement.

- [ ] **Step 4: Restyle ProfileManagement.js + add avatar preview**

Read the file. Apply glass restyle. Then find the avatar field (currently a plain text URL input) and replace it with:

```jsx
{/* Avatar URL + preview */}
<div>
  <div className="section-label">Avatar URL</div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    {/* Preview circle */}
    <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : getInitials(formData.name || '')}
    </div>
    <input
      type="url"
      value={avatarUrl}
      onChange={e => setAvatarUrl(e.target.value)}
      placeholder="https://example.com/photo.jpg"
      className="glass-input"
    />
  </div>
  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>Enter a public image URL. Leave blank to use initials avatar.</div>
</div>
```

**Note:** Replace `avatarUrl` and `setAvatarUrl` with the actual state variable names used in ProfileManagement.js (read the file to find them). `getInitials` is a helper — define it in the component if not present: `const getInitials = n => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '?';`

- [ ] **Step 5: Restyle UserManagement.js**

Read the file (large — 1810 lines). Work through it top-to-bottom:

1. **Find all modal backdrops** — search for `position: 'fixed'` or `inset: 0` in the JSX. Each is a modal. Replace backdrop div background with `className="glass-modal-backdrop"`. Replace the inner panel div with `className="glass-modal"` (or `glass-modal-wide` for forms with many fields).

2. **Find all card/panel wrappers** — search for `background: 'rgba(` or `className=".*card"`. Replace with `className="glass-panel-sm"` keeping existing padding as inline style.

3. **Find all `<input` tags** — add `className="glass-input"` and remove conflicting className/style background properties.

4. **Find all `<select` tags** — add `className="glass-select"` and remove conflicting styles.

5. **Find all `<textarea` tags** — add `className="glass-textarea"`.

6. **Find primary action buttons** (Add, Save, Approve, Confirm) — add `className="glass-btn-primary"`.

7. **Find cancel/secondary buttons** — add `className="glass-btn-secondary"`.

8. **Find delete/danger buttons** — add `className="glass-btn-danger"`.

Section headers (e.g. "Engineers", "Leaves", "Locations") — add `className="section-label"` to the label div.

- [ ] **Step 6: Restyle + audit AdminPanel.js**

Read the file. Note the 5 internal tabs (Overview, Users, Cases, Schedules, System).

Apply glass restyle to all panels.

Then audit each tab for live data:

**Overview tab:** Find where user count, active users, total cases, open cases, schedules count are shown. If any are hardcoded (e.g. `const totalUsers = 0`), replace with a `useEffect` that fetches:
```js
const { data: usersData } = await supabase.from('profiles').select('id, is_approved');
const { data: casesData } = await supabase.from('cases').select('id, status');
const { data: schedulesData } = await supabase.from('schedules').select('id');
setStats({
  totalUsers: usersData?.length || 0,
  activeUsers: usersData?.filter(u => u.is_approved).length || 0,
  totalCases: casesData?.length || 0,
  openCases: casesData?.filter(c => c.status === 'open').length || 0,
  schedules: schedulesData?.length || 0,
});
```

**Users tab:** Verify it fetches from `profiles` table. If using hardcoded array, replace with Supabase fetch.

**Cases tab:** Verify it fetches from `cases` table (top 20 with `.limit(20)`). If placeholder, add fetch.

**Schedules tab:** Verify it fetches from `schedules` table. If placeholder, add fetch.

**System tab:** Static/indicators are acceptable — no change needed.

- [ ] **Step 7: Restyle + empty state for GoogleCalendarSync.js**

Read the file. Check how it accesses `googleCalendarService` (look for the import at the top).

Check if `src/services/googleCalendarService.js` exists:
```bash
ls src/services/
```

If the service file **exists**, apply glass restyle and proceed normally.

If the service file **does not exist**, add an unconfigured empty state at the top of the render:

```jsx
// At top of component, before main content
const serviceAvailable = false; // set to true when googleCalendarService is wired up

if (!serviceAvailable) {
  return (
    <div className="glass-panel" style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Google Calendar not configured</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
        The Google Calendar integration requires a Google OAuth client ID.<br/>
        Set <code style={{ color: '#a78bfa' }}>REACT_APP_GOOGLE_CLIENT_ID</code> in your <code style={{ color: '#a78bfa' }}>.env</code> file and ensure the service is wired up.
      </div>
    </div>
  );
}
```

Apply glass restyle to the rest of the component regardless.

**How to find modal backdrops in any file:**
Search for: `position: 'fixed'`, `position: fixed`, `z-index: 1000`, or `inset: 0`. Any fixed-position full-screen div is a modal backdrop — replace its background with `className="glass-modal-backdrop"` and its inner panel with `className="glass-modal"` (or `glass-modal-wide` if it's a wider form).

- [ ] **Step 8: Commit ScheduleCalendar + ClientManagement + LocationManagement**

```bash
git add src/components/ScheduleCalendar.js src/components/ClientManagement.js src/components/LocationManagement.js
git commit -m "style: glass restyle for ScheduleCalendar, ClientManagement, LocationManagement"
```

- [ ] **Step 9: Commit ProfileManagement with avatar preview**

```bash
git add src/components/ProfileManagement.js
git commit -m "style: glass restyle for ProfileManagement + add avatar URL preview"
```

- [ ] **Step 10: Commit UserManagement**

```bash
git add src/components/UserManagement.js
git commit -m "style: glass restyle for UserManagement"
```

- [ ] **Step 11: Commit AdminPanel with data audit**

```bash
git add src/components/AdminPanel.js
git commit -m "style: glass restyle for AdminPanel + fix Overview tab live data fetching"
```

- [ ] **Step 12: Commit GoogleCalendarSync with empty state**

```bash
git add src/components/GoogleCalendarSync.js
git commit -m "style: glass restyle for GoogleCalendarSync + add not-configured empty state"
```

- [ ] **Step 13: Verify all management pages**

Run `npm start`, navigate through every tab. Check:
- No white, navy, or gray panels visible (only glass panels on gradient)
- All modals use glass overlay styling (dark backdrop + glass panel)
- Form inputs use glass-input style with purple focus ring
- ProfileManagement shows avatar preview circle
- AdminPanel stats show real numbers (not zeros)
- GoogleCalendarSync either shows connected state or the not-configured empty state

---

## Task 10: Final verification

- [ ] **Step 1: Run through all verification checks from the spec**

1. App loads with gradient background — no white flash, no navy backgrounds
2. Sidebar shows correct tabs per role (admin: 8, manager: 7, executive: 5, engineer: 5)
3. User avatar + logout is in sidebar bottom, not in navbar
4. Theme toggle is completely gone — grep confirms: `grep -r "isDark\|toggleTheme" src/` returns no matches in non-auth files
5. Cases tab: List mode shows existing table, Calendar mode shows all cases as events
6. Engineer in Calendar mode: own cases full opacity, others at 0.45 opacity with dashed border
7. All 6 dead files deleted — `ls src/components/EnhancedDashboard.js` returns not found
8. All modals use glass overlay styling (dark backdrop + glass panel)
9. ProfileManagement shows avatar URL preview circle
10. Mobile (resize browser to <768px): sidebar slides in as overlay
11. All 4 roles navigate correctly — no broken tabs, no blank white pages

- [ ] **Step 2: Fix any regressions**

If any tab throws a JS error or shows a blank white panel, read that component file and apply the glass pattern.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: final verification — resolve any restyle regressions across app"
```
