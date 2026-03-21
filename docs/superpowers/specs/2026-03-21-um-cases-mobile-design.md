# User Management + Cases Mobile Optimisations — Design Spec

**Date:** 2026-03-21
**Status:** Approved

---

## Problem Summary

1. **User Management — stats grid**: Inline `gridTemplateColumns: 'repeat(4,1fr)'` cannot be overridden by a CSS media query. On mobile the 4 cards compress to unusable tiny columns.
2. **User Management — user cards list**: `minWidth: 400` on the container forces horizontal scroll on phones.
3. **User Management — header**: `justifyContent: space-between` with "Invite User" button clips on narrow screens.
4. **User Management — filters**: `minWidth: 200 / 140 / 160` on inputs and selects cause overflow.
5. **User Management — modal forms**: Inline `gridTemplateColumns: '1fr 1fr'` on 5 form-row divs (invite + edit modals) cannot be overridden; 2-column layout doesn't fit mobile.
6. **Cases — stats strip margin**: `margin-bottom: 30px` on the base `.stats-grid` rule wastes vertical space below the scrollable strip on mobile. The strip itself is correct but the spacing is large.
7. **Cases — case cards**: `.case-card` has `padding: 20px` on all sides; on small screens this wastes space and the card feels cramped.
8. **Cases — filter bar width**: `.search-box` and `.filter-select` may not reach full width on mobile due to missing `width: 100%` override.
9. **Cases — modal form**: Already handled — `.form-row { grid-template-columns: 1fr }` exists at `max-width: 768px`. No change needed.

---

## Scope

CSS and JSX changes only. No logic, routing, or data changes.
User Management CSS changes use `@media (max-width: 767px)` blocks (consistent with previous mobile fixes). Cases CSS changes use the existing breakpoints already present for each rule: Fix 6 targets the existing `@media (max-width: 767px)` `.stats-grid` block; Fixes 7 and 8 target the existing `@media (max-width: 768px)` block for Cases-specific card and filter styles.
Desktop layout is entirely unaffected.

The **inline-style-vs-CSS** pattern from previous fixes applies here: any inline style that must be overridden on mobile must be removed from JSX and replaced with a CSS baseline rule + media query.

---

## Fix 1 — User Management Stats: 2×2 Compact Grid

**Root cause:** `gridTemplateColumns: 'repeat(4,1fr)'`, `padding: '14px 16px'`, and `fontSize: 26` are all inline styles — CSS media queries cannot override them.

**JSX changes in `src/components/UserManagement.js`:**

1. Grid wrapper div (line 188):
   - Add `className="um-stats-grid"`
   - Remove `gridTemplateColumns: 'repeat(4,1fr)'` from inline style (keep `display: 'grid'`, `gap: 12`, `marginBottom: 20`)

2. Each stat card div inside the `.map()` (line 195):
   - Add `className="um-stat-card"`
   - Remove `padding: '14px 16px'` from inline style (keep `background`, `border`, `borderRadius`, `cursor`)

3. Each value div (line 203):
   - Add `className="um-stat-value"`
   - Remove `fontSize: 26` from inline style (keep `fontWeight: 700`, `color: stat.color`)

**CSS additions in `src/index.css` — baseline rules (outside any media query):**
```css
.um-stats-grid { grid-template-columns: repeat(4, 1fr); }
.um-stat-card  { padding: 14px 16px; }
.um-stat-value { font-size: 26px; }
```

**CSS additions — mobile override block (after the baselines):**
```css
@media (max-width: 767px) {
  .um-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .um-stat-card  { padding: 10px 12px; }
  .um-stat-value { font-size: 1.25rem; }
}
```

Place baselines + override block together, near the existing `.stats-grid` rules (~line 1275 area), so they are easy to find. The override block must come after the baselines.

---

## Fix 2 — User Management User Cards: Remove minWidth

**JSX change in `src/components/UserManagement.js` line 229:**

Remove `minWidth: 400` from the cards container inline style. Change to `minWidth: 0` (or remove the property entirely).

```jsx
// Before
<div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 400 }}>
// After
<div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
```

No CSS change needed.

---

## Fix 3 — User Management Header: Reuse Existing Class

**JSX change in `src/components/UserManagement.js` line 176:**

Add `className="mobile-page-header"` to the header div. The CSS for this class already exists from the ClientManagement fix.

```jsx
<div className="mobile-page-header" style={{ display: 'flex', justifyContent: 'space-between', ... }}>
```

No CSS change needed.

---

## Fix 4 — User Management Filters: Reuse Existing Class

**JSX changes in `src/components/UserManagement.js` line 210:**

1. Add `className="mobile-filter-bar"` to the filters container div. The CSS for this class already exists from the ClientManagement fix (`.mobile-filter-bar > * { min-width: unset; width: 100%; }`).

```jsx
<div className="mobile-filter-bar" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
```

2. **Remove `minWidth` from inline styles on each filter input/select inside this div.** The CSS `.mobile-filter-bar > * { min-width: unset }` rule cannot override inline `style={{}}` properties — inline styles always win over CSS class rules. Remove these inline minWidth values:
   - Search `<input>` (line ~212): remove `minWidth: 200` from its inline style
   - Role `<select>` (line ~213): remove `minWidth: 140` from its inline style
   - Status `<select>` (line ~219): remove `minWidth: 160` from its inline style

No CSS change needed — the existing `.mobile-filter-bar > *` rule handles the override once the inline properties are removed.

---

## Fix 5 — User Management Modal Form Rows: Single Column on Mobile

**Root cause:** 5 divs across invite + edit modals use inline `gridTemplateColumns: '1fr 1fr'` — CSS cannot override them.

**JSX changes in `src/components/UserManagement.js`:**

Target divs (identified by their inline `gridTemplateColumns: '1fr 1fr'`):
- Invite modal line 325: Name + Email row
- Invite modal line 337: Role + Location row
- Edit modal line 380: Name + Email row
- Edit modal line 391: Role + Location row
- Edit modal line 415: Laser Type + Serial Number row

For each:
- Add `className="um-form-row"`
- Remove `gridTemplateColumns: '1fr 1fr'` from inline style (keep `display: 'grid'`, `gap: 12`, `marginBottom: ...`)

**CSS additions in `src/index.css`:**
```css
/* Baseline — outside any media query */
.um-form-row { grid-template-columns: 1fr 1fr; }

/* Mobile override */
@media (max-width: 767px) {
  .um-form-row { grid-template-columns: 1fr; }
}
```

---

## Fix 6 — Cases Stats: Reduce Mobile Margin

**File:** `src/index.css` — the existing `@media (max-width: 767px)` block for `.stats-grid` (around line 1300).

Add `margin-bottom: 15px` to the `.stats-grid` override inside that block:

```css
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: unset;
    grid-auto-flow: column;
    grid-auto-columns: minmax(72px, 80px);
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 15px; /* ← add this */
  }
  ...
}
```

---

## Fix 7 — Cases Case Cards: Reduce Padding on Mobile

**File:** `src/index.css`

The base rule is `.case-card { padding: 20px; }` (around line 1340). Add `padding: 14px` override inside the **existing `@media (max-width: 768px)` block** that already handles `.case-header` and `.case-info` (around line 1367). Using `768px` here is intentional — it matches the existing Cases breakpoint already in that block. Place `.case-card { padding: 14px; }` inside that block:

```css
@media (max-width: 768px) {
  /* existing rules ... */
  .case-card { padding: 14px; } /* ← add this */
}
```

---

## Fix 8 — Cases Filter Bar: Full-Width Inputs on Mobile

**File:** `src/index.css`

The existing `@media (max-width: 768px)` block already sets `.filters-section { flex-direction: column }`. Add the following inside that **same `@media (max-width: 768px)` block** (to stay consistent with the Cases breakpoint already used there):

```css
@media (max-width: 768px) {
  /* existing rules ... */
  .search-box    { width: 100%; min-width: unset; } /* ← add this */
  .filter-select { width: 100%; }                   /* ← add this */
}
```

Adding `min-width: unset` to `.search-box` is required because the base rule sets `min-width: 200px` (around line 1327) — without overriding it, the min-width could prevent the element from shrinking to full available width on very narrow screens.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/index.css` | Baseline rules for `.um-stats-grid`, `.um-stat-card`, `.um-stat-value`, `.um-form-row`; mobile overrides for all UM fixes + cases padding/margin/filter-width |
| `src/components/UserManagement.js` | Add classNames + remove conflicting inline styles on stats wrapper, stat cards, stat values, header, filters, and 5 modal form-row divs |

---

## Not In Scope

- User management modal action buttons (already readable as a flex row on mobile)
- Delete confirmation inline UI (acceptable as-is with minWidth removed)
- Cases modal form (already handled by existing `.form-row` media query)
- Engineer dashboard, admin panel, automation panel
