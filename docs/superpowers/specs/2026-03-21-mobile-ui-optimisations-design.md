# Mobile UI Optimisations — Design Spec

**Date:** 2026-03-21
**Status:** Approved

---

## Problem Summary

Four specific mobile layout issues reported by the user:

1. **Cases tab** — stat cards (Total / Pending / In Progress / Completed) occupy roughly half the screen in a 2×2 grid with large padding, leaving little room for the case list.
2. **Calendar** — creating a case by tapping a date does not work on touch devices. The existing `select` (drag) callback requires a tap-hold-drag gesture that does not fire on mobile browsers.
3. **Clients page** — layout overflows horizontally on mobile. Root cause: the search input wrapper has `minWidth: 300` which forces horizontal scroll on narrow screens; the header row also clips.
4. **Locations tab** — location cards use `minmax(340px, 1fr)` with a `minWidth: 400` wrapper; on a 375px screen this causes horizontal scrolling. Cards carry 24px padding and 48×48px icon boxes that are oversized for mobile.

---

## Scope

CSS and JSX changes only. No data-layer, routing, or auth changes.
All CSS changes are additive — desktop layout is unchanged.

---

## Fix 1 — Cases Stats: Horizontal Scrollable Strip

**File:** `src/index.css`

The existing rules are mobile-first:
```css
/* default */
.stats-grid { grid-template-columns: repeat(2, 1fr); }
/* desktop */
@media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
```

Add a new `@media (max-width: 767px)` block **after** the existing `@media (min-width: 768px)` rule so cascade order is correct. **Do not use `!important`** on any property in this block — the file's other mobile blocks use `!important` aggressively, but doing so here would break the desktop `repeat(4, 1fr)` rule at exactly 768px due to specificity.

New rules:
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

The `white-space: nowrap` on `.stat-label` prevents text wrapping inside the narrow 72–80px cards. Labels that are too long get ellipsis.

---

## Fix 2 — Calendar: `dateClick` for Touch Only

**File:** `src/components/UnifiedCalendar.jsx`

FullCalendar's `select` prop (drag-to-select) does not fire on a single tap on touch devices. Adding `dateClick` handles this — but `dateClick` fires on **every** pointer event including desktop mouse clicks. Without a guard, a desktop user who starts a drag would trigger `dateClick` (opening the modal) and then `select` (calling `openNewForm` again), causing a double-open.

Fix: gate `dateClick` on `jsEvent.pointerType` so it only acts on touch/pen events.

Add `dateClick` prop alongside the existing `select` prop:
```jsx
dateClick={!isEngineerRole ? ({ date, jsEvent }) => {
  if (jsEvent.pointerType === 'touch' || jsEvent.pointerType === 'pen') {
    openNewForm(date, new Date(date.getTime() + 60 * 60 * 1000));
  }
} : undefined}
```

`pointerType` is part of the standard `PointerEvent` API, available in all modern mobile browsers. The `select` prop is kept as-is — desktop drag-to-select continues to work normally.

---

## Fix 3 — Clients Page: Stacked Header + Full-Width Search

**Files:** `src/components/ClientManagement.js`, `src/index.css`

**CSS additions in `src/index.css`:**
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

The `.mobile-filter-bar > *` rule overrides `minWidth: 300` (on the search wrapper) and any other `minWidth` on direct children. The search wrapper also has `flex: 1` — leave it in place; it is harmless alongside `width: 100%` in a column-direction flex container.

**JSX changes in `src/components/ClientManagement.js`:**
- Add `className="mobile-page-header"` to the header `<div style={{ display: 'flex', justifyContent: 'space-between', ... }}>`.
- Add `className="mobile-filter-bar"` to the filter bar `<div style={{ display: 'flex', gap: 16, ... }}>`.
- No other changes — the media query handles everything else.

---

## Fix 4 — Locations: Full-Width Cards, Compact on Mobile

**Files:** `src/components/LocationManagement.js`, `src/index.css`

**JSX changes in `src/components/LocationManagement.js`:**

1. On the grid wrapper div (currently `minmax(340px, 1fr)` + `minWidth: 400`):
   - Change `minmax(340px, 1fr)` → `minmax(280px, 1fr)` (graceful degradation on medium screens).
   - Change `minWidth: 400` → `minWidth: 0` (removes forced horizontal overflow).
   - Add `className="location-card-grid"` to this div.
   - The outer `<div style={{ overflowX: 'auto' }}>` wrapper becomes inert once `minWidth: 0` is set but leaving it is safe — do not remove it.

2. Add `className="location-card-icon"` to the icon `<div style={{ width: 48, height: 48, ... }}>` inside each card's header section.

3. Add `className="location-card-header"` to the card header `<div style={{ padding: 20, display: 'flex', gap: 16, ... }}>` (the div with the icon and name/city). **This is required** because the padding is set as an inline style — a CSS selector alone cannot override inline styles without `!important`. Adding a className is the clean solution.

**CSS additions in `src/index.css`:**
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

---

## Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Add `@media (max-width: 767px)` blocks for `.stats-grid`, `.stat-card`, `.stat-number`, `.stat-label`, `.mobile-page-header`, `.mobile-filter-bar`, `.location-card-grid`, `.location-card-header`, `.location-card-icon` |
| `src/components/UnifiedCalendar.jsx` | Add `dateClick` prop (touch/pen only) to `<FullCalendar>` |
| `src/components/ClientManagement.js` | Add `className="mobile-page-header"` and `className="mobile-filter-bar"` to two divs |
| `src/components/LocationManagement.js` | Update grid `minmax` + `minWidth`; add `location-card-grid`, `location-card-header`, `location-card-icon` class names |

---

## Out of Scope

- Dashboard KPI bar, Gantt, team panels — separate task
- Form modals (keyboard avoidance, safe areas) — separate task
- Sidebar / navigation — previously fixed separately
