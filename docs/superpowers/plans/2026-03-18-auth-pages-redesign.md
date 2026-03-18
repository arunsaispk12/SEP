# Auth Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite LoginPage.js and SignupPage.js to match the Glass Premium dark aesthetic used across all SEP dashboards.

**Architecture:** LoginPage becomes a split-panel layout (branding left, form right) with an inline dark password reset overlay. SignupPage becomes a centered glass card with a 3-step wizard (Account → Work Profile → Review). Both use inline styles throughout — no styled-jsx, matching the dashboard pattern.

**Tech Stack:** React 18, react-router-dom (Link), lucide-react, framer-motion (motion.div), react-hot-toast (via AuthContext — do NOT add extra toasts), Supabase via AuthContext hooks.

---

## Codebase Context

### AuthContext hooks used by these pages

```js
const { login, resetPassword, signUp, loading, error } = useAuth();
```

- `login(email, password)` — dispatches `LOGIN_START` → `LOGIN_SUCCESS` or `LOGIN_FAILURE`. Sets `error` in state on failure. Shows toast internally on success/locked. **Do NOT add extra toasts.**
- `resetPassword(email)` — returns `true` on success. Shows toast internally. **Do NOT add extra toasts.**
- `signUp(email, password, userData)` — `userData` shape:
  ```js
  { name, role, location_id, phone: '', bio: '', skills: [], certifications: [], experience_years: 0, avatar: '👤', is_available: true, is_active: true }
  ```
  Returns `true` on success. Shows toast internally. **Do NOT add extra toasts.**
- `error` — string set by `LOGIN_FAILURE`. Used for login error display only.
- `loading` — boolean. True during any auth operation.

### Role values (DB enum)
`'engineer'` | `'manager'` | `'executive'` | `'client'` — **never `'admin'`** from signup.

### Location loading
```js
import supabaseService from '../services/supabaseService';
const locationData = await supabaseService.getLocations(); // returns [{ id, name }]
```

### Routing
Both pages use `<Link to="/signup">` and `<Link to="/login">` from react-router-dom. No routing changes in App.js needed.

---

## Design Tokens

```js
const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';
const GLASS_CARD = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18, backdropFilter: 'blur(20px)' };
const INPUT = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, height: 42, color: '#fff', fontSize: 14, padding: '0 14px', width: '100%', outline: 'none', boxSizing: 'border-box' };
const INPUT_FOCUS = { borderColor: 'rgba(167,139,250,0.6)', boxShadow: '0 0 0 3px rgba(167,139,250,0.12)', background: 'rgba(167,139,250,0.04)' };
const BTN_PRIMARY = { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' };
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
```

### Command Network logo SVG (reused on both pages)
```jsx
const LogoMark = () => (
  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 28px rgba(167,139,250,0.45)', flexShrink: 0 }}>
    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
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
```

---

## File Structure

| File | Change | What it does |
|---|---|---|
| `src/components/LoginPage.js` | Full rewrite | Split-panel login + inline dark reset overlay |
| `src/components/SignupPage.js` | Full rewrite | Centered 3-step wizard |

No new files. No changes to AuthContext, App.js, or routing.

---

## Task 1: Rewrite LoginPage.js

**Files:**
- Modify: `src/components/LoginPage.js` (full rewrite)

### Overview

Split layout: left panel (branding), right panel (form). When "Forgot password?" is clicked, a dark glass overlay covers the right panel only — no white modal.

State needed:
```js
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showReset, setShowReset] = useState(false);
const [resetEmail, setResetEmail] = useState('');
const [resetLoading, setResetLoading] = useState(false);
const [resetSuccess, setResetSuccess] = useState(false);
const [focusedField, setFocusedField] = useState(null); // 'email' | 'password' | 'resetEmail'
```

- [ ] **Step 1: Replace the entire file with the new implementation**

```jsx
// src/components/LoginPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const LogoMark = () => (
  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 24px rgba(167,139,250,0.45)', flexShrink: 0, marginBottom: 12 }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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

const PILLS = [
  { label: 'Real-time scheduling', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  { label: 'Engineer dispatch',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)' },
  { label: 'Case management',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  { label: 'Leave & approvals',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)' },
];

function DarkInput({ type = 'text', value, onChange, placeholder, onFocus, onBlur, focused, autoFocus }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: '100%', height: 42, padding: '0 14px',
        background: focused ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.05)',
        border: focused ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: focused ? '0 0 0 3px rgba(167,139,250,0.12)' : 'none',
        borderRadius: 10, color: '#fff', fontSize: 14,
        fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color .15s, box-shadow .15s',
      }}
    />
  );
}

export default function LoginPage() {
  const { login, resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [focused, setFocused] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) { setResetError('Please enter your email address'); return; }
    setResetLoading(true);
    setResetError('');
    const ok = await resetPassword(resetEmail);
    setResetLoading(false);
    if (ok) {
      setResetSuccess(true);
    } else {
      setResetError('Failed to send reset email. Please try again.');
    }
  };

  const closeReset = () => {
    setShowReset(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  const LBL = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: FONT }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ width: 300, flexShrink: 0, padding: '40px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>
        <LogoMark />
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 3, letterSpacing: '-0.3px' }}>Service Engineer<br/>Planner</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24 }}>Field Operations Platform</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PILLS.map(p => (
            <div key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 5, background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontSize: 10, fontWeight: 600 }}>
              ✓ {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>Sign in to your workspace</div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <div style={LBL}>Email address</div>
              <DarkInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" focused={focused === 'email'} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} autoFocus />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={LBL}>Password</div>
              <DarkInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" focused={focused === 'password'} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button type="button" onClick={() => setShowReset(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
                Forgot password?
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: loading ? 'rgba(71,85,105,0.6)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Signing in...</>
              ) : 'Sign In →'}
            </button>
          </form>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />
          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Create one here</Link>
          </div>
        </div>

        {/* ── INLINE RESET OVERLAY ── */}
        {showReset && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,41,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: '100%', maxWidth: 380 }}>
              {!resetSuccess ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Reset password</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Enter your email and we'll send you a reset link</div>
                  <form onSubmit={handleReset}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={LBL}>Email address</div>
                      <DarkInput type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@company.com" focused={focused === 'resetEmail'} onFocus={() => setFocused('resetEmail')} onBlur={() => setFocused(null)} autoFocus />
                    </div>
                    {resetError && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{resetError}</div>}
                    <button type="submit" disabled={resetLoading} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: resetLoading ? 'not-allowed' : 'pointer', fontFamily: FONT, marginBottom: 12 }}>
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <button type="button" onClick={closeReset} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>← Back to sign in</button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Check your email</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>We sent a reset link to <span style={{ color: '#fff' }}>{resetEmail}</span></div>
                  <button onClick={closeReset} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, height: 40, width: '100%', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>← Back to sign in</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
```

- [ ] **Step 2: Start dev server and verify the login page renders**

```bash
cd C:/ASP/SEP && npm start
```

Open http://localhost:3000/login. Check:
- Dark gradient background fills viewport
- Left panel shows logo + brand + 4 colored pills
- Right panel shows email/password fields, dark-styled
- Email field focus shows purple glow
- Error state: try submitting empty — context shows error below fields in red box
- "Forgot password?" click → dark overlay slides over right panel (not a white modal)
- Reset form is dark-styled
- Reset success shows email confirmation message
- "← Back to sign in" dismisses overlay

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginPage.js
git commit -m "feat: redesign LoginPage to Glass Premium split layout"
```

---

## Task 2: Rewrite SignupPage.js

**Files:**
- Modify: `src/components/SignupPage.js` (full rewrite)

### Overview

Centered glass card, 3-step wizard. State lives entirely in the component. `signUp` is called on step 3 submit. On success, show a success state (no redirect — user waits for admin approval).

State:
```js
const [step, setStep] = useState(1); // 1 | 2 | 3
// step 1 fields
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
// step 2 fields
const [locationId, setLocationId] = useState('');
const [role, setRole] = useState('engineer');
const [locations, setLocations] = useState([]);
// ui state
const [errors, setErrors] = useState({});
const [focused, setFocused] = useState(null);
const [submitting, setSubmitting] = useState(false);
const [done, setDone] = useState(false); // success state
```

Role options (4 — no admin):
```js
const ROLES = [
  { value: 'engineer',  label: 'Field Engineer', icon: '🔧', desc: 'Handles on-site service cases' },
  { value: 'manager',   label: 'Manager',        icon: '👨‍💼', desc: 'Oversees teams & approvals' },
  { value: 'executive', label: 'Executive',       icon: '👔', desc: 'Analytics & reporting' },
  { value: 'client',    label: 'Client',          icon: '🏥', desc: 'Submit service requests' },
];
```

Step validation:
- Step 1: name (required, ≥2 chars), email (valid format), password (≥6 chars), confirmPassword (matches password)
- Step 2: locationId (required)

- [ ] **Step 1: Replace the entire file with the new implementation**

```jsx
// src/components/SignupPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import supabaseService from '../services/supabaseService';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const ROLES = [
  { value: 'engineer',  label: 'Field Engineer', icon: '🔧', desc: 'Handles on-site service cases' },
  { value: 'manager',   label: 'Manager',        icon: '👨‍💼', desc: 'Oversees teams & approvals' },
  { value: 'executive', label: 'Executive',       icon: '👔', desc: 'Analytics & reporting' },
  { value: 'client',    label: 'Client',          icon: '🏥', desc: 'Submit service requests' },
];

const STEPS = [
  { n: 1, label: 'Account' },
  { n: 2, label: 'Work Profile' },
  { n: 3, label: 'Review' },
];

const LogoMark = () => (
  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 28px rgba(167,139,250,0.45)', marginBottom: 12 }}>
    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
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

function DarkInput({ type = 'text', value, onChange, placeholder, focused, onFocus, onBlur, autoFocus }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: '100%', height: 42, padding: '0 14px',
        background: focused ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.05)',
        border: focused ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: focused ? '0 0 0 3px rgba(167,139,250,0.12)' : 'none',
        borderRadius: 10, color: '#fff', fontSize: 14,
        fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color .15s, box-shadow .15s',
      }}
    />
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{msg}</div>;
}

export default function SignupPage() {
  const { signUp, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [role, setRole] = useState('engineer');
  const [locations, setLocations] = useState([]);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    supabaseService.getLocations()
      .then(data => { setLocations(data.map(l => ({ id: l.id, name: l.name }))); setLocationsLoading(false); })
      .catch(() => { setLocations([
        { id: 1, name: 'Hyderabad' },
        { id: 2, name: 'Bangalore' },
        { id: 3, name: 'Coimbatore' },
        { id: 4, name: 'Chennai' },
      ]); setLocationsLoading(false); });
  }, []);

  const validateStep1 = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Please enter a valid email';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!locationId) e.location = 'Please select your location';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const ok = await signUp(email, password, {
      name,
      role,
      location_id: Number(locationId),
      phone: '',
      bio: '',
      skills: [],
      certifications: [],
      experience_years: 0,
      avatar: '👤',
      is_available: true,
      is_active: true,
    });
    setSubmitting(false);
    if (ok) setDone(true);
  };

  const fld = (id) => ({
    onFocus: () => setFocused(id),
    onBlur: () => setFocused(null),
    focused: focused === id,
  });

  const LBL = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 };
  const SECTION = { marginBottom: 14 };

  const selectedLocation = locations.find(l => String(l.id) === String(locationId));
  const selectedRole = ROLES.find(r => r.value === role);

  // ── SUCCESS STATE ──
  if (done) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18, backdropFilter: 'blur(20px)', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Account created!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 28 }}>
            Your request is pending admin approval.<br/>You'll receive an email once your access is activated.
          </div>
          <Link to="/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 10, padding: '12px 28px', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>← Back to Sign In</Link>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT, position: 'relative' }}>

      {/* radial glow behind card */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18, backdropFilter: 'blur(20px)', boxShadow: '0 32px 64px rgba(0,0,0,0.5),0 0 40px rgba(139,92,246,0.08)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── CARD HEADER ── */}
        <div style={{ padding: '28px 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <LogoMark />
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginBottom: 2 }}>Service Engineer Planner</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1 }}>Field Operations Platform</div>
        </div>

        {/* ── STEP PROGRESS ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 28px 0' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: step > s.n ? 13 : 11, fontWeight: 700,
                  background: step > s.n ? 'rgba(52,211,153,0.15)' : step === s.n ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                  border: step > s.n ? '1px solid rgba(52,211,153,0.5)' : step === s.n ? '1px solid rgba(167,139,250,0.65)' : '1px solid rgba(255,255,255,0.1)',
                  color: step > s.n ? '#34d399' : step === s.n ? '#c4b5fd' : 'rgba(255,255,255,0.2)',
                  boxShadow: step === s.n ? '0 0 0 4px rgba(167,139,250,0.1),0 0 16px rgba(167,139,250,0.25)' : 'none',
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: step === s.n ? '#c4b5fd' : step > s.n ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{s.label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.n ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)', marginTop: 14 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── CARD BODY ── */}
        <div style={{ padding: '20px 28px 28px' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Create your account</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Start with your name and credentials</div>
              <div style={SECTION}>
                <div style={LBL}>Full Name</div>
                <DarkInput value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoFocus {...fld('name')} />
                <FieldError msg={errors.name} />
              </div>
              <div style={SECTION}>
                <div style={LBL}>Work Email</div>
                <DarkInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" {...fld('email')} />
                <FieldError msg={errors.email} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={LBL}>Password</div>
                  <DarkInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" {...fld('password')} />
                  <FieldError msg={errors.password} />
                </div>
                <div>
                  <div style={LBL}>Confirm</div>
                  <DarkInput type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" {...fld('confirm')} />
                  <FieldError msg={errors.confirmPassword} />
                </div>
              </div>
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, marginTop: 6 }}>Continue →</button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Your work profile</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Tell us where you're based and what you do</div>
              <div style={SECTION}>
                <div style={LBL}>Location</div>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  disabled={locationsLoading}
                  style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: locationId ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', cursor: locationsLoading ? 'wait' : 'pointer', opacity: locationsLoading ? 0.5 : 1 }}
                >
                  <option value="" style={{ background: '#1e1b4b', color: '#fff' }}>{locationsLoading ? 'Loading cities…' : 'Select your city'}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id} style={{ background: '#1e1b4b', color: '#fff' }}>{l.name}</option>
                  ))}
                </select>
                <FieldError msg={errors.location} />
              </div>
              <div style={SECTION}>
                <div style={LBL}>Role</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {ROLES.map(r => (
                    <div
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      style={{
                        background: role === r.value ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.04)',
                        border: role === r.value ? '1px solid rgba(167,139,250,0.55)' : '1px solid rgba(255,255,255,0.09)',
                        boxShadow: role === r.value ? '0 0 0 1px rgba(167,139,250,0.15),0 0 20px rgba(167,139,250,0.1)' : 'none',
                        borderRadius: 12, padding: 14, cursor: 'pointer', userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: role === r.value ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{r.icon}</div>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: role === r.value ? '1.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.15)', background: role === r.value ? 'rgba(167,139,250,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {role === r.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: role === r.value ? '#c4b5fd' : 'rgba(255,255,255,0.75)', marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, marginTop: 6 }}>Continue →</button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>← Back</button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Review your details</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Everything look right? You can go back to edit.</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { icon: '👤', iconBg: 'rgba(96,165,250,0.1)',    key: 'Full Name',   val: name },
                  { icon: '✉',  iconBg: 'rgba(52,211,153,0.1)',   key: 'Work Email',  val: email },
                  { icon: '📍', iconBg: 'rgba(251,191,36,0.1)',   key: 'Location',    val: selectedLocation?.name || '—' },
                  { icon: selectedRole?.icon, iconBg: 'rgba(167,139,250,0.12)', key: 'Role', val: null, chip: selectedRole?.label },
                ].map((row, i, arr) => (
                  <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{row.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '.3px', marginBottom: 2 }}>{row.key}</div>
                      {row.chip
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6 }}>{row.chip}</span>
                        : <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{row.val}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={submitting || loading} style={{ background: submitting || loading ? 'rgba(71,85,105,0.6)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting || loading ? 'not-allowed' : 'pointer', boxShadow: submitting || loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting || loading
                  ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Creating account...</>
                  : 'Create Account →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>← Back</button>
              </div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 10, fontSize: 11, color: 'rgba(52,211,153,0.7)', lineHeight: 1.7, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
                <span>Your account will be reviewed by an admin. You'll receive an email once access is approved — usually within 24 hours.</span>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify signup page in browser**

Open http://localhost:3000/signup. Check:
- Dark gradient background + centered glass card with radial glow
- Logo + brand + step progress bar at top of card
- **Step 1**: all 4 fields render with dark glass styling; focus shows purple glow; validation errors show inline in red under field; "Continue →" advances to step 2
- **Step 2**: city dropdown populates from DB (or fallback); 4 role cards in 2×2 grid; selecting a role shows purple border + filled radio dot; "Continue →" advances to step 3; "← Back" returns to step 1
- **Step 3**: summary card shows all 4 values; role shows as purple chip; "← Back" returns to step 2; "Create Account →" submits
- **Success state**: green approval message with "← Back to Sign In" link

- [ ] **Step 3: Commit**

```bash
git add src/components/SignupPage.js
git commit -m "feat: redesign SignupPage to Glass Premium 3-step wizard"
```

---

## Task 3: Final Verification

- [ ] **Step 1: Check for lint warnings**

```bash
cd C:/ASP/SEP && npm run build 2>&1 | grep -E "Warning|Error" | head -30
```

Expected: no new warnings from LoginPage.js or SignupPage.js. The pre-existing `style jsx` warnings are now gone (we removed styled-jsx).

- [ ] **Step 2: Smoke test full auth flow**

1. Go to http://localhost:3000/login — verify Glass Premium split layout
2. Click "Create one here" — navigates to /signup
3. Fill Step 1, click Continue — advances to Step 2
4. Select location + role, click Continue — advances to Step 3
5. Verify summary card shows correct values
6. Click "← Back to Sign In" from signup — back to login
7. Login with valid credentials — app loads normally
8. On login page, click "Forgot password?" — dark overlay appears (not a white modal)
9. Enter email, click "Send Reset Link" — shows confirmation message

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: auth pages Glass Premium redesign complete"
```
