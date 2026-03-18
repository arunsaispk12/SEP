# ScheduleCalendar Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add location combobox, client field with inline add, and Google Calendar-style event views with engineer status highlights to ScheduleCalendar.js; fix pre-existing client CRUD bug in EngineerContext.

**Architecture:** Seven sequential tasks — fix context bug first, then apply migrations, then build features layer by layer (form fields before calendar views before popup). All changes are in-place edits to existing files; no new component files needed.

**Tech Stack:** React (CRA), react-big-calendar + moment, Supabase MCP, lucide-react, react-hot-toast, glass utility CSS classes from index.css

---

## File Map

| File | What changes |
|---|---|
| `src/context/EngineerContext.js` | Add `addClient`, `updateClient`, `deleteClient` to context value |
| `src/database/schema.sql` | Add `address` to clients table; add `client_id` to schedules table |
| Supabase (via MCP) | Apply migration for both new columns |
| `src/components/ClientManagement.js` | Add `address` field to formData + form HTML |
| `src/components/ScheduleCalendar.js` | Major: LocationCombobox, client field, calendar views, event popup |
| `src/index.css` | Add combobox dropdown + popup overlay styles |

---

## Task 1: Fix EngineerContext — expose client CRUD

**Context:** `addClient`, `updateClient`, `deleteClient` are defined (lines 372–414) but not included in the context `value` useMemo (lines 679–706). Client CRUD in `ClientManagement.js` is currently broken silently.

**Files:**
- Modify: `src/context/EngineerContext.js:679–706`

- [ ] **Step 1: Add client functions to context value**

In `src/context/EngineerContext.js`, find the `const value = useMemo(() => ({` block (around line 679). Add the three client functions between the `deleteEngineer` line and `addSchedule` line:

```js
// Before (around line 685-687):
    deleteEngineer,
    addSchedule,

// After:
    deleteEngineer,
    addClient,
    updateClient,
    deleteClient,
    addSchedule,
```

- [ ] **Step 2: Add to useMemo dependency array**

The `useMemo` dep array is the long array at line 706. Add `addClient, updateClient, deleteClient,` after `deleteEngineer,` in the deps array:

```js
// Find this in the deps array:
... updateEngineer, addEngineer, deleteEngineer, addSchedule, ...

// Change to:
... updateEngineer, addEngineer, deleteEngineer, addClient, updateClient, deleteClient, addSchedule, ...
```

- [ ] **Step 3: Verify**

Run `npm start` (or it's already running on port 3000). Open Client Management tab. Try adding a client — it should work without console errors. Try editing a client — should update. Try deleting — should remove.

- [ ] **Step 4: Commit**

```bash
git add src/context/EngineerContext.js
git commit -m "fix: expose addClient, updateClient, deleteClient in EngineerContext value"
```

---

## Task 2: Apply database migrations + update schema.sql

**Context:** Two new columns required: `clients.address text` and `schedules.client_id integer FK → clients`. Apply via Supabase MCP tool then update the local schema.sql.

**Files:**
- Modify: `src/database/schema.sql`
- Supabase: apply migration via `mcp__supabase__apply_migration`

- [ ] **Step 1: Apply migration via Supabase MCP**

Call `mcp__supabase__apply_migration` with:
- `name`: `add_clients_address_and_schedules_client_id`
- `query`:
```sql
alter table public.clients add column if not exists address text;
alter table public.schedules add column if not exists client_id integer references public.clients(id) on delete set null;
```

- [ ] **Step 2: Verify migration applied**

Call `mcp__supabase__execute_sql` with:
```sql
select column_name from information_schema.columns
where table_name = 'clients' and column_name = 'address';

select column_name from information_schema.columns
where table_name = 'schedules' and column_name = 'client_id';
```
Both queries must return one row each.

- [ ] **Step 3: Update schema.sql — clients table**

In `src/database/schema.sql`, find the `clients` table definition (around line 19–32). Add `address text,` after `mobile text,`:

```sql
-- Before:
  mobile text,
  assigned_executive_id uuid references auth.users(id) on delete set null,

-- After:
  mobile text,
  address text,
  assigned_executive_id uuid references auth.users(id) on delete set null,
```

- [ ] **Step 4: Update schema.sql — schedules table**

Find the `schedules` table definition (around line 131–151). Add `client_id` after `case_id`:

```sql
-- Before:
  case_id bigint references public.cases(id) on delete set null,
  location_id integer references public.locations(id) on delete set null,

-- After:
  case_id bigint references public.cases(id) on delete set null,
  client_id integer references public.clients(id) on delete set null,
  location_id integer references public.locations(id) on delete set null,
```

- [ ] **Step 5: Commit**

```bash
git add src/database/schema.sql
git commit -m "feat: add clients.address and schedules.client_id columns"
```

---

## Task 3: ClientManagement.js — add address field

**Context:** The `clients` table now has `address text`. Add it to the formData state, resetForm, handleEdit, and the form HTML.

**Files:**
- Modify: `src/components/ClientManagement.js`

- [ ] **Step 1: Add address to formData initial state**

Around line 32–40, find `const [formData, setFormData] = useState({`. Add `address: ''` after `mobile: ''`:

```js
const [formData, setFormData] = useState({
  name: '',
  location_id: '',
  contact_person: '',
  designation: '',
  mobile: '',
  address: '',          // ← add this
  assigned_executive_id: null,
  is_disclosed: true
});
```

- [ ] **Step 2: Add address to resetForm**

Around line 71–82, find `setFormData({` inside `resetForm`. Add `address: ''` after `mobile: ''`:

```js
setFormData({
  name: '',
  location_id: '',
  contact_person: '',
  designation: '',
  mobile: '',
  address: '',          // ← add this
  assigned_executive_id: null,
  is_disclosed: true
});
```

- [ ] **Step 3: Add address to handleEdit**

Around line 85–97, find `setFormData({` inside `handleEdit`. Add `address: client.address || ''` after `mobile`:

```js
setFormData({
  name: client.name,
  location_id: client.location_id || '',
  contact_person: client.contact_person || '',
  designation: client.designation || '',
  mobile: client.mobile || '',
  address: client.address || '',    // ← add this
  assigned_executive_id: client.assigned_executive_id,
  is_disclosed: client.is_disclosed
});
```

- [ ] **Step 4: Add address input to form HTML**

Find the Mobile Number input block (around line 322–332):
```jsx
<div>
  <div className="section-label">Mobile Number *</div>
  <input
    type="tel"
    name="mobile"
    ...
  />
</div>
```

Add the address field block immediately after the closing `</div>` of the Mobile field, before the `</div>` that closes the Contact Details section:

```jsx
<div style={{ marginTop: 14 }}>
  <div className="section-label">Address</div>
  <input
    type="text"
    name="address"
    value={formData.address}
    onChange={handleInputChange}
    placeholder="Hospital address"
    className="glass-input"
  />
</div>
```

- [ ] **Step 5: Verify**

Open Client Management → Add New Client. The form should show an Address field below Mobile. Save a client with an address — open edit, address should populate. Open browser devtools Network tab, confirm the Supabase INSERT payload includes `address`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ClientManagement.js
git commit -m "feat: add address field to ClientManagement form"
```

---

## Task 4: ScheduleCalendar — LocationCombobox

**Context:** Replace the location `<select>` with a glass combobox (text input + floating suggestions). The existing `handleSubmit` already resolves `formData.location` string → `location_id` via `locationObjects` — that logic is unchanged.

**Files:**
- Modify: `src/components/ScheduleCalendar.js`

- [ ] **Step 1: Add LocationCombobox component**

At the top of `ScheduleCalendar.js`, after the imports and before `const ScheduleCalendar = () => {`, add the `LocationCombobox` component:

```jsx
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
```

- [ ] **Step 2: Replace location `<select>` with LocationCombobox**

In the form JSX (around line 314–330), find the Location `<select>` block:
```jsx
<div style={{ marginBottom: 14 }}>
  <div className="section-label">Location *</div>
  <select
    value={formData.location}
    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
    required
    className="glass-select"
  >
    <option value="">Select Location</option>
    {locations.map(location => (
      <option key={location} value={location}>{location}</option>
    ))}
  </select>
</div>
```

Replace entirely with:
```jsx
<div style={{ marginBottom: 14 }}>
  <div className="section-label">Location</div>
  <LocationCombobox
    value={formData.location}
    onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
    locations={locations}
  />
</div>
```

Note: remove `required` — freeform locations are valid without matching a preset.

- [ ] **Step 3: Add combobox CSS to index.css**

In `src/index.css`, add before the final closing `}` of the file (or at end):

```css
/* Location combobox dropdown */
.location-combobox-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(15, 12, 41, 0.95);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  backdrop-filter: blur(16px);
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.location-combobox-option {
  padding: 10px 14px;
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
}
.location-combobox-option:hover {
  background: rgba(167,139,250,0.12);
  color: #fff;
}
.location-combobox-option:first-child { border-radius: 10px 10px 0 0; }
.location-combobox-option:last-child  { border-radius: 0 0 10px 10px; }
```

- [ ] **Step 4: Verify**

Open Schedule Calendar → Add Schedule. The Location field should be a text input. Typing "hyd" should show a floating dropdown with "Hyderabad Office" (or matching presets). Clicking a suggestion fills the field. Clicking outside closes the dropdown. Freeform text ("Mumbai Client Site") saves without error.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScheduleCalendar.js src/index.css
git commit -m "feat: replace location select with glass combobox in ScheduleCalendar"
```

---

## Task 5: ScheduleCalendar — Client field + inline add

**Context:** Add `client_id` to form state, add a client `<select>` dropdown, and an inline "Add new client" slide-down expansion with name/contact/mobile/address/location fields.

**Files:**
- Modify: `src/components/ScheduleCalendar.js`

- [ ] **Step 1: Add `clients` to context destructure**

At the top of the `ScheduleCalendar` component, find the `useEngineerContext()` destructure and add `clients` and `addClient`:

```js
const {
  schedules,
  engineers,
  clients,        // ← add
  addClient,      // ← add
  addSchedule,
  updateSchedule,
  deleteSchedule,
  getEngineerById,
  locations,
  locationObjects,
  isEngineerOnLeave,
  leaves
} = useEngineerContext();
```

- [ ] **Step 2: Add `client_id` to formData state**

Add `client_id: null` to `useState` initial value and `resetForm`:

```js
// Initial state — add client_id: null
const [formData, setFormData] = useState({
  title: '',
  engineerId: '',
  location: '',
  client_id: null,    // ← add
  start: new Date(),
  end: new Date(),
  description: '',
  priority: 'normal'
});

// resetForm — add client_id: null
const resetForm = () => {
  setFormData({
    title: '',
    engineerId: '',
    location: '',
    client_id: null,  // ← add
    start: new Date(),
    end: new Date(),
    description: '',
    priority: 'normal'
  });
  ...
};
```

- [ ] **Step 3: Add `client_id` to handleSelectEvent**

In `handleSelectEvent`, add `client_id` to the `setFormData` call:

```js
setFormData({
  title: schedule.title,
  engineerId: schedule.engineer_id || '',
  location: schedule.location || '',
  client_id: schedule.client_id || null,   // ← add
  start: new Date(schedule.start || schedule.start_time),
  end: new Date(schedule.end || schedule.end_time),
  description: schedule.description || '',
  priority: schedule.priority || 'normal'
});
```

- [ ] **Step 4: Add `client_id` to handleSubmit payload**

In `handleSubmit`, add `client_id` to `scheduleData`:

```js
const scheduleData = {
  title: formData.title,
  engineer_id: formData.engineerId || null,
  location_id: locationObj?.id || null,
  client_id: formData.client_id || null,   // ← add
  start_time: formData.start.toISOString(),
  end_time: formData.end.toISOString(),
  description: formData.description || '',
  priority: formData.priority,
  status: 'scheduled',
  created_by: user?.id
};
```

- [ ] **Step 5: Add inline-add state**

After the existing `useState` declarations, add:

```js
const [showInlineAdd, setShowInlineAdd] = useState(false);
const [newClientForm, setNewClientForm] = useState({
  name: '', contact_person: '', mobile: '', address: '', location: ''
});
const [savingClient, setSavingClient] = useState(false);
```

- [ ] **Step 6: Add handleSaveNewClient function**

After `handleSyncWithCases`, add:

```js
const handleSaveNewClient = async (e) => {
  e.preventDefault();
  setSavingClient(true);
  try {
    const locationObj = (locationObjects || []).find(l => l.name === newClientForm.location);
    const created = await addClient({
      name: newClientForm.name,
      contact_person: newClientForm.contact_person || null,
      mobile: newClientForm.mobile || null,
      address: newClientForm.address || null,
      location_id: locationObj?.id || null,
      created_by: user?.id,
      is_disclosed: true
    });
    setFormData(prev => ({ ...prev, client_id: created.id }));
    setShowInlineAdd(false);
    setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' });
    toast.success('Client added');
  } catch (err) {
    toast.error('Failed to add client');
  } finally {
    setSavingClient(false);
  }
};
```

- [ ] **Step 7: Add client field JSX to form**

In the form JSX, after the Location combobox block (after its closing `</div>`), add:

```jsx
{/* Client field */}
<div style={{ marginBottom: 14 }}>
  <div className="section-label">Client</div>
  <select
    value={formData.client_id || ''}
    onChange={(e) => {
      setFormData(prev => ({ ...prev, client_id: e.target.value ? parseInt(e.target.value) : null }));
      setShowInlineAdd(false);
    }}
    className="glass-select"
  >
    <option value="">Select Client (optional)</option>
    {(clients || []).map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>

  {/* Inline add toggle */}
  {!showInlineAdd && (
    <button
      type="button"
      onClick={() => setShowInlineAdd(true)}
      style={{ marginTop: 8, background: 'none', border: 'none', color: '#a78bfa', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
    >
      + Add new client
    </button>
  )}

  {/* Inline expansion */}
  {showInlineAdd && (
    <div style={{ marginTop: 12, padding: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10 }}>
      <form onSubmit={handleSaveNewClient}>
        <div style={{ marginBottom: 10 }}>
          <div className="section-label">Name *</div>
          <input type="text" required value={newClientForm.name}
            onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))}
            className="glass-input" placeholder="Hospital / Clinic name" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <div className="section-label">Contact person</div>
            <input type="text" value={newClientForm.contact_person}
              onChange={e => setNewClientForm(p => ({ ...p, contact_person: e.target.value }))}
              className="glass-input" placeholder="Dr. Name" />
          </div>
          <div>
            <div className="section-label">Mobile</div>
            <input type="tel" value={newClientForm.mobile}
              onChange={e => setNewClientForm(p => ({ ...p, mobile: e.target.value }))}
              className="glass-input" placeholder="10-digit" />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="section-label">Address</div>
          <input type="text" value={newClientForm.address}
            onChange={e => setNewClientForm(p => ({ ...p, address: e.target.value }))}
            className="glass-input" placeholder="Hospital address" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div className="section-label">Location</div>
          <LocationCombobox
            value={newClientForm.location}
            onChange={val => setNewClientForm(p => ({ ...p, location: val }))}
            locations={locations}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="glass-btn-secondary"
            onClick={() => { setShowInlineAdd(false); setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' }); }}
            style={{ fontSize: 12, padding: '6px 12px' }}>Cancel</button>
          <button type="submit" className="glass-btn-primary" disabled={savingClient}
            style={{ fontSize: 12, padding: '6px 12px' }}>
            {savingClient ? 'Saving...' : 'Save & Select'}
          </button>
        </div>
      </form>
    </div>
  )}
</div>
```

- [ ] **Step 8: Verify**

Open Add Schedule. A "Client" dropdown appears below Location. Selecting a client sets `client_id`. Clicking "+ Add new client" shows the inline form. Filling name + Save & Select creates the client, auto-selects it in the dropdown, collapses the form. Creating a schedule with a client: check Supabase `schedules` table — `client_id` should be populated.

- [ ] **Step 9: Commit**

```bash
git add src/components/ScheduleCalendar.js
git commit -m "feat: add client field with inline add to ScheduleCalendar form"
```

---

## Task 6: Calendar view enhancements — event colors, status dots, case accent bar

**Context:** Update the schedule event mapping, `eventPropGetter`, and `CustomEvent` to show priority colors, engineer status dots, case-linked accent bars, and role-based dimming.

**Files:**
- Modify: `src/components/ScheduleCalendar.js`

- [ ] **Step 1: Add imports**

Add to the import list at the top:

```js
import { getEngineerStatus, ENGINEER_STATUS_CONFIG, STATUS_COLORS } from './dashboard/dashboardUtils';
```

Also add `cases` and `profile` to the context destructure:

```js
const {
  schedules,
  engineers,
  cases,          // ← add
  clients,
  addClient,
  ...
} = useEngineerContext();
const { user, profile } = useAuth();   // ← add profile
```

- [ ] **Step 2: Add currentView state**

After the existing `useState` declarations:

```js
const [currentView, setCurrentView] = useState('week');
```

- [ ] **Step 3: Define PRIORITY_COLORS constant**

After the existing `priorities` array, add:

```js
const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high:   '#f59e0b',
  normal: '#3b82f6',
  low:    '#22c55e',
};
```

- [ ] **Step 4: Update scheduleEvents mapping**

Replace the existing `scheduleEvents` mapping (the `schedules.map(...)` block) with:

```js
const scheduleEvents = schedules.map(schedule => {
  const engineer = getEngineerById(schedule.engineer_id);
  const engineerStatus = engineer ? getEngineerStatus(engineer, schedules) : null;
  const linkedCase = cases?.find(c => c.id === schedule.case_id) || null;
  return {
    id: schedule.id,
    title: schedule.title,
    start: new Date(schedule.start_time || schedule.start),
    end: new Date(schedule.end_time || schedule.end),
    resource: {
      schedule,       // full source object
      engineer,
      engineerStatus,
      linkedCase,
    }
  };
});
```

- [ ] **Step 5: Replace eventStyleGetter with new eventPropGetter**

Replace the existing `eventStyleGetter` function entirely:

```js
const isEngineerRole = profile?.role === 'engineer';

const eventPropGetter = (event) => {
  if (typeof event.id === 'string' && event.id.startsWith('leave-')) {
    return {
      style: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px dashed rgba(255,255,255,0.25)',
        color: 'rgba(255,255,255,0.45)',
        borderRadius: 4,
        opacity: 0.7,
        fontSize: 11,
      }
    };
  }
  const { schedule, linkedCase } = event.resource || {};
  const priority = schedule?.priority || 'normal';
  const isOwn = schedule?.engineer_id === user?.id;
  const dim = isEngineerRole && !isOwn;
  const caseAccent = linkedCase ? STATUS_COLORS[linkedCase.status]?.border : null;

  return {
    style: {
      backgroundColor: PRIORITY_COLORS[priority] || '#6b7280',
      borderLeft: caseAccent ? `3px solid ${caseAccent}` : 'none',
      borderRadius: 4,
      border: 'none',
      opacity: dim ? 0.5 : 1,
      fontSize: 11,
      color: '#fff',
    }
  };
};
```

- [ ] **Step 6: Replace CustomEvent with view-aware version**

Replace the existing `CustomEvent` component:

```jsx
const CustomEvent = ({ event }) => {
  const { engineer, engineerStatus } = event.resource || {};
  const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
  const isLeave = typeof event.id === 'string' && event.id.startsWith('leave-');

  // Compact in all views except agenda (and always compact for leave blocks)
  if (isLeave || currentView !== 'agenda') {
    // Compact: status dot + title
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', padding: '1px 2px' }}>
        {statusCfg && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
          {event.title}{engineer ? ` — ${engineer.name}` : ''}
        </span>
      </div>
    );
  }

  // Agenda: verbose
  const { schedule, linkedCase } = event.resource || {};
  const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '';
  return (
    <div style={{ padding: '2px 4px' }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{event.title}</div>
      {locationName && <div style={{ fontSize: 10, opacity: 0.8 }}>📍 {locationName}</div>}
      {engineer && (
        <div style={{ fontSize: 10, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
          👤 {engineer.name}
          {statusCfg && <span style={{ color: statusCfg.color }}>· {statusCfg.label}</span>}
        </div>
      )}
      {linkedCase && (
        <div style={{ fontSize: 10, opacity: 0.8 }}>🔗 Case #{linkedCase.id}</div>
      )}
      <div style={{ marginTop: 3 }}>
        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280' }}>
          {schedule?.priority || 'normal'}
        </span>
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Update Calendar props**

Find `<Calendar` in the JSX. Update `eventPropGetter` and `components`, and add `onView`:

```jsx
<Calendar
  localizer={localizer}
  events={events}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 'clamp(400px, 65vh, 700px)' }}
  onSelectSlot={handleSelectSlot}
  onSelectEvent={handleSelectEvent}
  selectable
  eventPropGetter={eventPropGetter}      // was eventStyleGetter
  components={{ event: CustomEvent }}
  views={['month', 'week', 'day', 'agenda']}
  defaultView="week"
  onView={v => setCurrentView(v)}        // ← add
/>
```

- [ ] **Step 8: Verify**

Open Schedule Calendar. Events should show priority colors (blue for normal, amber for high, red for urgent, green for low). Week/month/day views show compact bars with a colored status dot. Agenda view shows verbose content with location and engineer. Leave events are muted/dashed. Engineer role user: other engineers' events appear at half opacity.

- [ ] **Step 9: Commit**

```bash
git add src/components/ScheduleCalendar.js
git commit -m "feat: Google Calendar-style event bars with priority colors, status dots, case accent"
```

---

## Task 7: Glass event popup

**Context:** Clicking a schedule event (not a leave) opens a fixed-centered glass popup showing full details — engineer status, linked case, client, description — with Edit and Delete actions.

**Files:**
- Modify: `src/components/ScheduleCalendar.js`
- Modify: `src/index.css`

- [ ] **Step 1: Add popup state**

After the existing `useState` declarations, add:

```js
const [selectedEvent, setSelectedEvent] = useState(null);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

- [ ] **Step 2: Update handleSelectEvent**

Replace the existing `handleSelectEvent` entirely:

```js
const handleSelectEvent = (event) => {
  // Leave events: do nothing
  if (typeof event.id === 'string' && event.id.startsWith('leave-')) return;

  // Open popup
  setSelectedEvent(event);
  setShowDeleteConfirm(false);
};
```

- [ ] **Step 3: Add handleEditFromPopup function**

After `handleSaveNewClient`, add:

```js
const handleEditFromPopup = () => {
  const schedule = selectedEvent?.resource?.schedule;
  if (!schedule) return;
  setSelectedEvent(null);
  setEditingSchedule(schedule);
  setFormData({
    title: schedule.title,
    engineerId: schedule.engineer_id || '',
    location: (locationObjects || []).find(l => l.id === schedule.location_id)?.name || '',
    client_id: schedule.client_id || null,
    start: new Date(schedule.start_time || schedule.start),
    end: new Date(schedule.end_time || schedule.end),
    description: schedule.description || '',
    priority: schedule.priority || 'normal'
  });
  setShowModal(true);
};
```

- [ ] **Step 4: Add handleDeleteFromPopup function**

```js
const handleDeleteFromPopup = async () => {
  const schedule = selectedEvent?.resource?.schedule;
  if (!schedule) return;
  try {
    await deleteSchedule(schedule.id);
    setSelectedEvent(null);
    toast.success('Schedule deleted');
  } catch {
    toast.error('Failed to delete schedule');
  }
};
```

- [ ] **Step 5: Add Escape-key listener**

After the existing `useState`/`useEffect` blocks:

```js
React.useEffect(() => {
  const handler = (e) => { if (e.key === 'Escape') setSelectedEvent(null); };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

- [ ] **Step 6: Add popup JSX**

In the return JSX, after the closing `</div>` of the schedule modal (`{showModal && (...)}`) and before the `<style jsx>` block, add:

```jsx
{/* Event detail popup */}
{selectedEvent && (() => {
  const { schedule, engineer, engineerStatus, linkedCase } = selectedEvent.resource || {};
  const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
  const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '—';
  const client = schedule?.client_id ? (clients || []).find(c => c.id === schedule.client_id) : null;
  const caseSC = linkedCase ? STATUS_COLORS[linkedCase.status] : null;
  const startD = new Date(schedule?.start_time || schedule?.start);
  const endD = new Date(schedule?.end_time || schedule?.end);
  const fmt = (d) => d.toLocaleString('en-GB', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSelectedEvent(null)}
        style={{ position:'fixed', inset:0, background:'rgba(15,12,41,0.7)', zIndex:200 }}
      />
      {/* Panel */}
      <div className="event-popup-panel">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>{selectedEvent.title}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{fmt(startD)} – {endD.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <button onClick={() => setSelectedEvent(null)}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:20, lineHeight:1, padding:0 }}>×</button>
        </div>

        {/* Priority + status badges */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280', color:'#fff' }}>
            {schedule?.priority || 'normal'}
          </span>
          {caseSC && (
            <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, border:`1px solid ${caseSC.border}`, color:caseSC.border }}>
              {caseSC.label}
            </span>
          )}
        </div>

        {/* Location */}
        <div style={{ display:'flex', gap:8, marginBottom:10, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
          <span>📍</span><span>{locationName}</span>
        </div>

        {/* Engineer */}
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, padding:'10px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
          {engineer ? (
            <>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {engineer.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{engineer.name}</div>
                {statusCfg && (
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:statusCfg.color, display:'inline-block' }} />
                    {statusCfg.label}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.3)' }}>Unassigned</span>
          )}
        </div>

        {/* Linked case */}
        {linkedCase && (
          <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10, borderLeft: caseSC ? `3px solid ${caseSC.border}` : 'none' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>LINKED CASE</div>
            <div style={{ fontSize:13, color:'#fff' }}>#{linkedCase.id} — {linkedCase.title || linkedCase.description?.slice(0,40) || 'Case'}</div>
          </div>
        )}

        {/* Client */}
        {client && (
          <div style={{ display:'flex', gap:8, marginBottom:10, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
            <span>🏢</span><span>{client.name}</span>
          </div>
        )}

        {/* Description */}
        {schedule?.description && (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:12, lineHeight:1.6 }}>
            {schedule.description}
          </div>
        )}

        {/* Actions */}
        <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'12px 0' }} />
        {showDeleteConfirm ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', flex:1 }}>Delete this schedule?</span>
            <button className="glass-btn-secondary" style={{ fontSize:12, padding:'6px 12px' }}
              onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="glass-btn-danger" style={{ fontSize:12, padding:'6px 12px' }}
              onClick={handleDeleteFromPopup}>Confirm</button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="glass-btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}
              onClick={handleEditFromPopup}>Edit</button>
            <button className="glass-btn-danger" style={{ fontSize:12, padding:'6px 14px' }}
              onClick={() => setShowDeleteConfirm(true)}>Delete</button>
          </div>
        )}
      </div>
    </>
  );
})()}
```

- [ ] **Step 7: Add popup CSS to index.css**

```css
/* Event detail popup */
.event-popup-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  background: rgba(15, 12, 41, 0.96);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  padding: 20px;
  z-index: 201;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}
```

- [ ] **Step 8: Verify**

Open Schedule Calendar. Click any schedule event (not a leave block). A centered glass popup should appear with title, time, priority badge, location, engineer section (with status dot and label), and Edit/Delete buttons. Clicking Edit closes popup and opens the edit form pre-filled. Clicking Delete shows "Delete this schedule?" confirm row — Confirm deletes and closes. Pressing Escape closes popup. Clicking backdrop closes popup. Leave events: clicking them does nothing. Engineer with no assigned engineer: popup shows "Unassigned" text.

- [ ] **Step 9: Commit**

```bash
git add src/components/ScheduleCalendar.js src/index.css
git commit -m "feat: glass event popup with engineer status, case link, and inline delete confirm"
```

---

## Final Verification Checklist

- [ ] Client CRUD works in ClientManagement (add/edit/delete all function)
- [ ] Address field in ClientManagement add/edit modal
- [ ] Supabase `clients` table has `address` column
- [ ] Supabase `schedules` table has `client_id` column
- [ ] Location combobox: freeform text + floating suggestions, closes on outside click
- [ ] Client dropdown in schedule form; inline add creates + auto-selects client
- [ ] Schedule event bars: priority colors + engineer status dots
- [ ] Case-linked events: 3px left accent bar in case status color
- [ ] Agenda view: verbose event details
- [ ] Click any schedule event → glass popup with all detail sections
- [ ] Popup Edit → opens edit modal pre-filled (including client_id)
- [ ] Popup Delete → inline confirm, then deletes
- [ ] Leave events: muted all-day blocks, click does nothing
- [ ] Engineer role: others' events at 0.5 opacity
- [ ] Escape + backdrop click close popup
- [ ] Mobile: popup `min(480px, 90vw)` centered
