# Auth Pages Design Spec
**Date:** 2026-03-18
**Scope:** LoginPage.js, SignupPage.js — full UI redesign to Glass Premium dark theme

---

## Overview

Redesign the two auth pages (Login and Signup) to match the Glass Premium dark aesthetic used throughout the SEP dashboards. The current pages are visually inconsistent — LoginPage mixes light and dark styles, SignupPage is fully white/light.

---

## Design System

All auth pages use the same Glass Premium tokens:

| Token | Value |
|---|---|
| Page background | `linear-gradient(135deg,#0f0c29,#302b63,#24243e)` |
| Glass card | `rgba(255,255,255,0.06)` bg, `1px solid rgba(255,255,255,0.11)` border, `backdrop-filter:blur(20px)` |
| Input field | `rgba(255,255,255,0.05)` bg, `1px solid rgba(255,255,255,0.1)` border, `border-radius:10px`, `height:42px` |
| Input focused | `border-color:rgba(167,139,250,0.6)`, `box-shadow:0 0 0 3px rgba(167,139,250,0.12)` |
| Primary button | `linear-gradient(135deg,#3b82f6,#8b5cf6)`, `height:46px`, `border-radius:11px`, `box-shadow:0 4px 20px rgba(99,102,241,0.4)` |
| Label | `10px`, uppercase, `letter-spacing:.7px`, `rgba(255,255,255,0.4)` |
| Font stack | `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` |

---

## Logo Mark

**Command Network** — used on both pages:

- Container: `48×48px`, `border-radius:14px`, `background:linear-gradient(135deg,#a78bfa,#ec4899)`
- Shadow: `0 0 0 1px rgba(167,139,250,0.3), 0 0 28px rgba(167,139,250,0.45)`
- SVG: 3×3 dot grid with connecting lines radiating from the center node

```svg
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
  <line x1="11" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
  <line x1="5" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
  <line x1="17" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
  <line x1="11" y1="11" x2="11" y2="17" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
</svg>
```

---

## Page 1 — Login

### Layout

Split panel, full viewport height:

- **Left panel** (38% width): branding + feature highlights, `background:rgba(0,0,0,0.15)`, `border-right:1px solid rgba(255,255,255,0.07)`
- **Right panel** (flex:1): login form, centered vertically

### Left Panel Content

1. Logo mark (Command Network, 44×44px)
2. Brand name: "Service Engineer Planner" — `14px`, `font-weight:800`
3. Sub: "Field Operations Platform" — `9px`, uppercase, muted
4. Feature pills (4 items):
   - ✓ Real-time scheduling — green `#34d399`
   - ✓ Engineer dispatch — blue `#60a5fa`
   - ✓ Case management — purple `#a78bfa`
   - ✓ Leave & approvals — amber `#fbbf24`

Each pill: `background:rgba(color,0.12)`, `border:1px solid rgba(color,0.25)`, `border-radius:5px`, `font-size:10px`

### Right Panel — Login Form

- Title: "Welcome back" — `20px`, `font-weight:800`
- Subtitle: "Sign in to your workspace" — `12px`, muted
- Fields: Email address (focused by default), Password
- "Forgot password?" — right-aligned, `color:#60a5fa`, `font-size:11px`
- Submit: "Sign In →" button (primary)
- Divider
- Link row: "Don't have an account?" + "Create one here" (`color:#60a5fa`)

### Password Reset

Inline dark-styled overlay within the login page — **no white modal**. When "Forgot password?" is clicked:
- A dark glass overlay (`rgba(15,12,41,0.9)` + `backdrop-filter:blur(8px)`) appears over the right panel
- Contains: email field + "Send Reset Link" button + "← Back to sign in" link
- Same Glass Premium input styling throughout

---

## Page 2 — Signup (3-Step Wizard)

### Layout

Centered glass card on full dark gradient background:

- Page: `background:linear-gradient(135deg,#0f0c29,#302b63,#24243e)`, `display:flex`, `align-items:center`, `justify-content:center`, min-height `100vh`
- Subtle radial glow behind card: `radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)`
- Card: `max-width:480px`, `width:100%`, glass panel styles, `border-radius:18px`

### Card Header (fixed across all steps)

Centered, inside the card:
1. Logo mark (48×48px)
2. Brand name: "Service Engineer Planner"
3. Sub: "Field Operations Platform"

### Horizontal Step Progress Bar

Three steps connected by lines, rendered below the card header:

- Step circle: `28×28px`, `border-radius:50%`
- Inactive: `rgba(255,255,255,0.05)` bg, `rgba(255,255,255,0.1)` border, dim number
- Active: `rgba(167,139,250,0.2)` bg, `rgba(167,139,250,0.65)` border, purple number, outer ring glow
- Done: `rgba(52,211,153,0.15)` bg, `rgba(52,211,153,0.5)` border, green checkmark `✓`
- Connector line between steps: `1px solid rgba(255,255,255,0.1)`, done segments turn green

Step labels below circles: `9.5px`, `font-weight:600`

### Step 1 — Account

Fields:
- Full Name
- Work Email
- Password + Confirm Password (2-column grid)

Actions:
- "Continue →" primary button
- Divider
- "Already have an account? Sign in" link

### Step 2 — Work Profile

Fields:
- **Location** — dropdown, `rgba(255,255,255,0.05)` bg, chevron icon right
- **Role** — 2×2 grid of role cards (4 options, no Admin)

Role card design:
- `background:rgba(255,255,255,0.04)`, `border:1px solid rgba(255,255,255,0.09)`, `border-radius:12px`, `padding:14px`
- Contains: icon wrapper (32×32, `border-radius:9px`) + role name + description + radio ring top-right
- Selected state: `border-color:rgba(167,139,250,0.55)`, `background:rgba(167,139,250,0.08)`, purple glow, filled radio dot

Role options (in order):
| Role | Icon | Description |
|---|---|---|
| Field Engineer | 🔧 | Handles on-site service cases |
| Manager | 👨‍💼 | Oversees teams & approvals |
| Executive | 👔 | Analytics & reporting |
| Client | 🏥 | Submit service requests |

**No Admin role in signup.** Admin is assigned directly in the Supabase `profiles` table via the `role` column — never through self-signup.

Actions:
- "Continue →" primary button
- "← Back" text link

### Step 3 — Review & Submit

Summary card listing all collected values:

| Row | Icon bg | Field | Value |
|---|---|---|---|
| 1 | blue | Full Name | entered value |
| 2 | green | Work Email | entered value |
| 3 | amber | Location | selected city |
| 4 | purple | Role | chip badge (`rgba(167,139,250,0.12)` bg) |

Actions:
- "Create Account →" primary button
- "← Back" text link
- Approval note (green tinted box): "Your account will be reviewed by an admin. You'll receive an email once access is approved — usually within 24 hours."

---

## Data & Auth Flow

### Login
1. User submits email + password
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. On success: `AuthContext` picks up session, redirects to app
4. On error: show inline error below the form (dark-styled, `color:#f87171`)

### Signup
1. Collect all 3 steps client-side with local state
2. On Step 3 submit:
   - Use `AuthContext.signUp()` — check its signature and extend it to accept `{ full_name, location, role }` if needed, rather than inserting the profile row directly from the component
   - Profile `role` defaults to the user's selection; `is_approved` defaults to `false`
3. Show success state: "Account created — awaiting admin approval" (no redirect to app)

### Password Reset
1. Call `supabase.auth.resetPasswordForEmail(email)`
2. Show confirmation: "Check your email for a reset link"

### Admin Assignment
Admin role is set directly in Supabase `profiles` table by updating `role = 'admin'`. No UI for this — database-only operation.

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/LoginPage.js` | Full rewrite — Glass Premium split layout |
| `src/components/SignupPage.js` | Full rewrite — centered glass card, 3-step wizard |

No new files needed. No routing changes — existing `App.js` auth routing remains intact.
