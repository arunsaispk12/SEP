# Mobile UI Optimisations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four specific mobile layout issues: oversized Cases stats cards, no touch-to-create in Calendar, Clients page horizontal overflow, and Locations cards too large for mobile screens.

**Architecture:** Pure CSS media queries (`max-width: 767px`) plus two small JSX changes (adding classNames and one FullCalendar prop). No component restructuring, no new files, no logic changes. Desktop layout is entirely unaffected.

**Tech Stack:** React (JSX, no TypeScript), FullCalendar v6, inline styles + `src/index.css` for design system

---

## File Map

| File | What changes |
|------|-------------|
| `src/index.css` | Add `@media (max-width: 767px)` blocks for stats cards, clients header/filter, and locations grid/card |
| `src/components/UnifiedCalendar.jsx` | Add `dateClick` prop to `<FullCalendar>` |
| `src/components/ClientManagement.js` | Add `className` to header div and filter bar div |
| `src/components/LocationManagement.js` | Update grid `minmax`/`minWidth`, add three `className` attributes |

---

## Task 1: Cases Stats — Horizontal Strip on Mobile

**Files:**
- Modify: `src/index.css` (after the existing `@media (min-width: 768px) { .stats-grid { ... } }` rule, around line 1282)

There are no automated tests for CSS layout in this project. Verify visually by resizing the browser to ≤767px.

- [ ] **Step 1: Locate the existing `.stats-grid` desktop rule in `src/index.css`**

Find this block (around line 1281):
```css
@media (min-width: 768px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
}
```

- [ ] **Step 2: Add the mobile override block immediately after it**

```css
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: unset;
    grid-auto-flow: column;
    grid-auto-columns: minmax(72px, 80px);
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .stat-card {
    padding: 10px 12px;
    text-align: center;
  }
  .stat-number {
    font-size: 1.25rem;
  }
  .stat-label {
    font-size: 0.65rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
```

**Important:** Do NOT use `!important` on any property here. The rest of `index.css` uses `!important` in other mobile blocks, but doing so here would override the `min-width: 768px` desktop rule due to cascade order.

- [ ] **Step 3: Verify visually**

Start the dev server (`npm start`). Navigate to the Cases tab. Resize the browser window to below 768px. The four stat cards should appear in a single horizontal scrollable row, each ~72–80px wide, with truncated labels.

At 768px and above, the cards should still be in a 4-column row as before.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "fix: compact cases stats cards into horizontal strip on mobile"
```

---

## Task 2: Calendar — `dateClick` for Touch Devices

**Files:**
- Modify: `src/components/UnifiedCalendar.jsx` (around line 422, inside the `<FullCalendar>` props)

- [ ] **Step 1: Open `src/components/UnifiedCalendar.jsx` and find the `<FullCalendar>` element**

It is around line 410. The existing `select` prop is at line 422:
```jsx
select={!isEngineerRole ? ({ start, end }) => openNewForm(start, end) : undefined}
```

- [ ] **Step 2: Add `dateClick` prop on the line immediately after `select`**

```jsx
dateClick={!isEngineerRole ? ({ date, jsEvent }) => {
  if (jsEvent.pointerType === 'touch' || jsEvent.pointerType === 'pen') {
    openNewForm(date, new Date(date.getTime() + 60 * 60 * 1000));
  }
} : undefined}
```

The `pointerType` guard prevents this from firing on desktop mouse clicks (which would conflict with the existing drag-to-select). On touch devices `pointerType` is `'touch'`; on a stylus it is `'pen'`. Regular mouse clicks have `pointerType === 'mouse'` and are ignored.

The `openNewForm` function already exists at line 204 — no changes needed there.

- [ ] **Step 3: Verify visually**

On a mobile device or with Chrome DevTools in device emulation mode: open the Calendar tab, tap any time slot. The new case modal should open with the tapped date/time pre-filled.

On desktop, drag across a time range — the modal should still open via the `select` handler with the full range. Clicking without dragging on desktop should do nothing.

- [ ] **Step 4: Commit**

```bash
git add src/components/UnifiedCalendar.jsx
git commit -m "fix: add dateClick handler to calendar for touch-to-create on mobile"
```

---

## Task 3: Clients Page — Stacked Header + Full-Width Search/Filter

**Files:**
- Modify: `src/components/ClientManagement.js` (lines ~128 and ~167)
- Modify: `src/index.css` (append to mobile section)

- [ ] **Step 1: Add CSS classes to `src/index.css`**

Add this block at the end of the existing mobile media query section (after the last `@media (max-width: 768px)` block, before the `/* ===== GoogleCalendarSync mobile =====` comment around line 1890):

```css
@media (max-width: 767px) {
  .mobile-page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .mobile-page-header .glass-btn-primary {
    width: 100%;
    justify-content: center;
  }
  .mobile-filter-bar {
    flex-direction: column;
  }
  .mobile-filter-bar > * {
    min-width: unset;
    width: 100%;
  }
}
```

- [ ] **Step 2: Add `className="mobile-page-header"` to the header div in `ClientManagement.js`**

Find this div (around line 128):
```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
```

Change to:
```jsx
<div className="mobile-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
```

- [ ] **Step 3: Add `className="mobile-filter-bar"` to the filter bar div and remove `minWidth: 300`**

Find this div (around line 167):
```jsx
<div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
```

Change to:
```jsx
<div className="mobile-filter-bar" style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
```

Then find the search wrapper div on the next line (around line 168). It currently has `minWidth: 300` in its inline style:
```jsx
<div style={{ flex: 1, minWidth: 300, display: 'flex', ... }}>
```

Remove `minWidth: 300` from it:
```jsx
<div style={{ flex: 1, display: 'flex', ... }}>
```

Leave `flex: 1` in place — it is harmless in a column-direction flex container on mobile.

- [ ] **Step 4: Verify visually**

At ≤767px: the "Client Management" heading and "Add New Client" button should stack vertically; the button should be full width. The search bar and location filter should also stack vertically, each full width.

At 768px+: the original side-by-side layout should be unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/ClientManagement.js
git commit -m "fix: stack clients page header and filter bar on mobile"
```

---

## Task 4: Locations Tab — Full-Width Cards on Mobile

**Files:**
- Modify: `src/components/LocationManagement.js` (lines ~183–187)
- Modify: `src/index.css` (append to mobile section)

- [ ] **Step 1: Add CSS classes to `src/index.css`**

Append to the same mobile section used in Task 3 (or add a new adjacent block):

```css
@media (max-width: 767px) {
  .location-card-grid {
    grid-template-columns: 1fr;
  }
  .location-card-header {
    padding: 14px;
  }
  .location-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex-shrink: 0;
  }
}
```

- [ ] **Step 2: Update the grid wrapper div in `LocationManagement.js`**

Find this div (around line 183):
```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, minWidth: 400 }}>
```

Change to:
```jsx
<div className="location-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, minWidth: 0 }}>
```

Two changes: `minmax(340px, 1fr)` → `minmax(280px, 1fr)` and `minWidth: 400` → `minWidth: 0`. Also add `className="location-card-grid"`. The outer `<div style={{ overflowX: 'auto' }}>` one level up becomes inert but leave it in place.

- [ ] **Step 3: Add `className="location-card-header"` to the card header div**

Each location card (inside the `.map`) has a header div (around line 186):
```jsx
<div style={{ padding: 20, display: 'flex', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
```

Change to:
```jsx
<div className="location-card-header" style={{ padding: 20, display: 'flex', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
```

This is required because the `padding: 20` is an inline style — CSS cannot override inline styles without `!important`. Adding the className lets the media query rule override it cleanly.

- [ ] **Step 4: Add `className="location-card-icon"` to the icon div**

Inside the same card header, find the icon div (around line 187):
```jsx
<div style={{ width: 48, height: 48, background: 'rgba(123,97,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
```

Change to:
```jsx
<div className="location-card-icon" style={{ width: 48, height: 48, background: 'rgba(123,97,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
```

Note: `flexShrink: 0` is already in the inline style so it was always present. The CSS class adds it redundantly for safety — that is intentional.

- [ ] **Step 5: Verify visually**

At ≤767px: location cards should be full width, one per row. The icon should be 40×40px and the card header padding should be visibly more compact than desktop.

At 768px+: cards should reflow to 2–3 columns as before (based on `minmax(280px, 1fr)`).

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/components/LocationManagement.js
git commit -m "fix: make location cards full-width and compact on mobile"
```

---

## Done

All four issues addressed. No regressions on desktop — every change is gated behind `max-width: 767px` or is an additive prop.
