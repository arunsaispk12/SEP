# User Management + Cases Mobile Optimisations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 mobile layout issues across the User Management page and Cases tab — eliminating horizontal overflow, compressing the 4-column stats into a 2×2 grid, and reducing vertical space waste on mobile.

**Architecture:** Pure CSS + JSX className additions. Every inline style property that needs a responsive override is removed from JSX and replaced with a CSS baseline rule (outside any media query) followed by a `@media (max-width: 767px)` or `@media (max-width: 768px)` override block. Desktop layout is entirely unchanged. No logic, routing, or data changes.

**Tech Stack:** React JSX (no TypeScript), inline styles + `src/index.css`

---

## File Map

| File | Changes |
|------|---------|
| `src/index.css` | Add baseline rules for `.um-stats-grid`, `.um-stat-card`, `.um-stat-value`, `.um-form-row`; mobile overrides for all UM fixes + cases padding/margin/filter-width |
| `src/components/UserManagement.js` | Add classNames + remove conflicting inline styles on stats wrapper, stat cards, stat values, header, filter bar, 3 filter inputs/selects, and 5 modal form-row divs |

---

## Task 1 — CSS additions in `src/index.css`

There are no automated tests for CSS layout. All verification is visual: resize the browser to ≤767px and confirm each section.

**Files:**
- Modify: `src/index.css` (lines ~1283, ~1321, ~1367)

### UM Stats + Form Row — Baselines and 767px overrides

- [ ] **Step 1: Add UM stats baseline rules after the existing `.stats-grid` 767px block (after line 1321)**

Find the closing `}` of the `@media (max-width: 767px)` block that ends around line 1321. Insert the following immediately after it:

```css
/* ── User Management Stats (baseline + mobile) ── */
.um-stats-grid { grid-template-columns: repeat(4, 1fr); }
.um-stat-card  { padding: 14px 16px; }
.um-stat-value { font-size: 26px; }

@media (max-width: 767px) {
  .um-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .um-stat-card  { padding: 10px 12px; }
  .um-stat-value { font-size: 1.25rem; }
}

/* ── User Management Modal Form Rows (baseline + mobile) ── */
.um-form-row { grid-template-columns: 1fr 1fr; }

@media (max-width: 767px) {
  .um-form-row { grid-template-columns: 1fr; }
}
```

**Important:** These baselines MUST appear before their respective `@media (max-width: 767px)` blocks. The override blocks must come after the baselines — equal specificity means last-declaration wins.

### Cases stats margin — add to existing 767px `.stats-grid` block

- [ ] **Step 2: Add `margin-bottom: 15px` to the existing `.stats-grid` mobile block (around line 1300–1307)**

Find this block:
```css
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: unset;
    grid-auto-flow: column;
    grid-auto-columns: minmax(72px, 80px);
    overflow-x: auto;
    padding-bottom: 4px;
  }
```

Add `margin-bottom: 15px;` as the last property inside `.stats-grid {}`:
```css
@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: unset;
    grid-auto-flow: column;
    grid-auto-columns: minmax(72px, 80px);
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 15px;
  }
  ...
}
```

### Cases card padding + filter width — add to existing 768px Cases block

- [ ] **Step 3: Add `.case-card`, `.search-box`, and `.filter-select` rules to the existing `@media (max-width: 768px)` block (around line 1367)**

Find this block:
```css
@media (max-width: 768px) {
  .filters-section, .filter-controls { flex-direction: column; }
  .form-row { grid-template-columns: 1fr; }
  .case-header, .case-info { flex-direction: column; gap: 10px; }
  .modal-actions { flex-direction: column-reverse; }
}
```

Add three rules inside it (order doesn't matter):
```css
@media (max-width: 768px) {
  .filters-section, .filter-controls { flex-direction: column; }
  .form-row { grid-template-columns: 1fr; }
  .case-header, .case-info { flex-direction: column; gap: 10px; }
  .modal-actions { flex-direction: column-reverse; }
  .case-card    { padding: 14px; }
  .search-box   { width: 100%; min-width: unset; }
  .filter-select { width: 100%; }
}
```

Note: `min-width: unset` on `.search-box` is required because the base rule at line 1327 sets `min-width: 200px` — without overriding it the element cannot shrink below 200px regardless of `width: 100%`.

- [ ] **Step 4: Verify CSS changes visually**

Start dev server (`npm start`). In Chrome DevTools, enable device emulation at 375px width.

Check Cases tab:
- Stats strip has `margin-bottom` of ~15px (less gap below it)
- Case cards have noticeably less padding on all sides
- Search box and status/priority dropdowns each fill the full width

Check that desktop (≥768px) is unchanged: case cards still have 20px padding, filter bar is horizontal.

- [ ] **Step 5: Commit CSS changes**

```bash
git add src/index.css
git commit -m "fix: add UM stats/form-row mobile CSS and reduce cases stats margin, card padding, filter width on mobile"
```

---

## Task 2 — JSX changes in `src/components/UserManagement.js`

**Files:**
- Modify: `src/components/UserManagement.js` (lines 176, 188, 195–205, 210–224, 229, 325, 337, 380, 391, 415)

There are no automated tests for this component's layout. Verify visually after each group of changes.

### Fix 3 — Header: add `mobile-page-header` class

- [ ] **Step 1: Verify the `mobile-page-header` CSS class exists**

Run: `grep -n "mobile-page-header" src/index.css`
Expected: at least one result (the class was added in a previous ClientManagement fix). If no result is found, stop — the CSS dependency is missing and must be added before proceeding.

- [ ] **Step 2: Add className to the header div (line 176)**

Find:
```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
```

Change to:
```jsx
<div className="mobile-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
```

No inline style property is removed — the CSS class does all the mobile work.

### Fix 1 — Stats grid: move inline styles to CSS classes

- [ ] **Step 3: Update the stats grid wrapper div (line 188)**

Find:
```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
```

Change to (remove `gridTemplateColumns`, add `className`):
```jsx
<div className="um-stats-grid" style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
```

- [ ] **Step 4: Update each stat card div (line 195, inside the `.map()`)**

Find (the outer div of each mapped stat card):
```jsx
<div key={stat.label}
  onClick={() => stat.clickStatus && setFilterStatus(f => f === stat.clickStatus ? 'all' : stat.clickStatus)}
  style={{
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${stat.clickStatus && filterStatus === stat.clickStatus ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12, padding: '14px 16px',
    cursor: stat.clickStatus ? 'pointer' : 'default',
  }}>
```

Change to (add `className`, remove `padding: '14px 16px'`):
```jsx
<div key={stat.label}
  className="um-stat-card"
  onClick={() => stat.clickStatus && setFilterStatus(f => f === stat.clickStatus ? 'all' : stat.clickStatus)}
  style={{
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${stat.clickStatus && filterStatus === stat.clickStatus ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12,
    cursor: stat.clickStatus ? 'pointer' : 'default',
  }}>
```

- [ ] **Step 5: Update the stat value div (line 203)**

Find:
```jsx
<div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
```

Change to (add `className`, remove `fontSize: 26`):
```jsx
<div className="um-stat-value" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</div>
```

### Fix 4 — Filters: add class and remove inline minWidth values

- [ ] **Step 5: Verify the `mobile-filter-bar` CSS class exists**

Run: `grep -n "mobile-filter-bar" src/index.css`
Expected: at least one result. If not found, stop — the CSS dependency is missing.

- [ ] **Step 6: Update the filters container div (line 210)**

Find:
```jsx
<div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
```

Change to (add `className`):
```jsx
<div className="mobile-filter-bar" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
```

- [ ] **Step 7: Remove `minWidth` from the search input (line 212)**

Find:
```jsx
<input type="text" placeholder="Search users…" value={searchTerm}
  onChange={e => setSearchTerm(e.target.value)} className="glass-input" style={{ flex: 1, minWidth: 200 }} />
```

Change to (remove `minWidth: 200`):
```jsx
<input type="text" placeholder="Search users…" value={searchTerm}
  onChange={e => setSearchTerm(e.target.value)} className="glass-input" style={{ flex: 1 }} />
```

- [ ] **Step 8: Remove `minWidth` from the role select (line 213)**

Find:
```jsx
<select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="glass-select" style={{ minWidth: 140 }}>
```

Change to (remove `minWidth: 140` — `style` prop can be removed entirely since it becomes empty):
```jsx
<select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="glass-select">
```

- [ ] **Step 9: Remove `minWidth` from the status select (line 219)**

Find:
```jsx
<select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-select" style={{ minWidth: 160 }}>
```

Change to:
```jsx
<select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-select">
```

### Fix 2 — User cards list: remove minWidth 400

- [ ] **Step 10: Change `minWidth: 400` to `minWidth: 0` on the cards container (line 229)**

Find:
```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 400 }}>
```

Change to:
```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
```

### Fix 5 — Modal form rows: move inline gridTemplateColumns to CSS class

- [ ] **Step 11: Update invite modal Name + Email row (line 325)**

Find:
```jsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
```
(This is the first such div, inside the invite `<form>`)

Change to:
```jsx
<div className="um-form-row" style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
```

- [ ] **Step 12: Update invite modal Role + Location row (line 337)**

Find (the second `gridTemplateColumns: '1fr 1fr'` div, also inside the invite form):
```jsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
```

Change to:
```jsx
<div className="um-form-row" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
```

- [ ] **Step 13: Update edit modal Name + Email row (line 380)**

Find (first `gridTemplateColumns: '1fr 1fr'` div inside the edit `<form>`):
```jsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
```

Change to:
```jsx
<div className="um-form-row" style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
```

- [ ] **Step 14: Update edit modal Role + Location row (line 391)**

Find (second `gridTemplateColumns: '1fr 1fr'` div inside the edit form):
```jsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
```

Change to:
```jsx
<div className="um-form-row" style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
```

- [ ] **Step 15: Update edit modal Laser Type + Serial Number row (line 415)**

Find (third `gridTemplateColumns: '1fr 1fr'` div inside the edit form — the Laser Type + Serial Number row):
```jsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
```
(Context clue: the div immediately after `<div style={{ marginBottom: 12 }}>` containing the Phone input)

Change to:
```jsx
<div className="um-form-row" style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
```

- [ ] **Step 16: Verify all JSX changes visually**

In Chrome DevTools at 375px:

User Management page:
- Header: "User Management" title and "Invite User" button stack vertically; button is full width
- Stats: 4 cards appear in a 2×2 grid (2 columns, 2 rows), not 4 tiny columns
- Filters: Search, Role, Status inputs each occupy full width, stacked vertically
- User cards list: no horizontal overflow; cards fit within screen
- Invite modal: Name/Email on separate rows; Role/Location on separate rows
- Edit modal: All 3 form rows (Name/Email, Role/Location, Laser/Serial) are single-column

Desktop (≥768px): stats still 4 columns, header still horizontal, filters still in a row, modal forms still 2-column.

- [ ] **Step 17: Commit JSX changes**

```bash
git add src/components/UserManagement.js
git commit -m "fix: add mobile classNames and remove overriding inline styles in UserManagement"
```

---

## Done

All 8 fixes complete. No regressions on desktop — every change is either gated behind a media query or is a plain removal of a min-width constraint.
