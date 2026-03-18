# User Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct user creation with a Supabase invite flow, add status-aware user cards, fix dual-table sync bugs, and remove unrelated concerns (leaves, location, password) from UserManagement.js.

**Architecture:** Two new Supabase Edge Functions handle admin operations requiring the service role key (`invite-user`, `delete-user`). A DB trigger auto-activates users on invite acceptance. `supabaseService.updateEngineer` and `EngineerContext.approveUser` are fixed to sync both `engineers` and `profiles` tables. `UserManagement.js` is rewritten around invite flow and clean status states.

**Tech Stack:** React, Supabase (anon + service role via Edge Functions), Deno (Edge Functions), react-hot-toast, lucide-react.

---

## File Map

| File | Change |
|---|---|
| `supabase/functions/invite-user/index.ts` | **Create** — invite + resend via service role |
| `supabase/functions/delete-user/index.ts` | **Create** — delete from auth.users via service role |
| `src/services/supabaseService.js` | **Modify** `updateEngineer` (line 69–79) to sync profiles |
| `src/context/EngineerContext.js` | **Modify** `approveUser` (line 591–612) to update engineers |
| `src/components/UserManagement.js` | **Rewrite** — invite flow, status cards, simplified forms |
| `src/database/schema.sql` | **Modify** — add columns to engineers + profiles, add trigger |
| Supabase migration (via MCP) | **Run** — apply schema changes live |

---

## Task 1: Database Migration — Add Columns + Activation Trigger

**Files:**
- Modify: `src/database/schema.sql`
- Run: Supabase migration via MCP tool

**Context:** `engineers` table is missing `role`, `is_approved`, `invite_sent_at`, `laser_type`, `serial_number`, `tracker_status`. `profiles` is missing `invite_sent_at`. A DB trigger must set `is_active = true` on both tables when a user accepts their invite (i.e., when `auth.users.email_confirmed_at` changes from NULL to a timestamp).

- [ ] **Step 1: Apply migration via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with this SQL:

```sql
-- Add missing columns to engineers table
alter table public.engineers
  add column if not exists role text not null default 'engineer'
    check (role in ('engineer', 'manager', 'admin')),
  add column if not exists is_approved boolean default false,
  add column if not exists invite_sent_at timestamptz,
  add column if not exists laser_type text,
  add column if not exists serial_number text,
  add column if not exists tracker_status text;

-- Add invite_sent_at to profiles
alter table public.profiles
  add column if not exists invite_sent_at timestamptz;

-- Trigger: auto-activate users when they accept invite
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set is_active = true, updated_at = now() where id = new.id;
    update public.engineers set is_active = true, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_confirmed on auth.users;
create trigger on_user_confirmed
  after update on auth.users
  for each row execute procedure public.handle_user_confirmed();
```

- [ ] **Step 2: Verify migration applied**

Use `mcp__supabase__execute_sql` to confirm:
```sql
select column_name from information_schema.columns
where table_name = 'engineers' and table_schema = 'public'
  and column_name in ('role','is_approved','invite_sent_at','laser_type','serial_number','tracker_status');
```
Expected: 6 rows returned.

- [ ] **Step 3: Update schema.sql to match**

In `src/database/schema.sql`, find the `engineers` table definition (around line 86–100) and add the 6 new columns inside the `create table` block:
```sql
  role text not null default 'engineer' check (role in ('engineer', 'manager', 'admin')),
  is_approved boolean default false,
  invite_sent_at timestamptz,
  laser_type text,
  serial_number text,
  tracker_status text,
```

Also find the `profiles` table definition and add:
```sql
  invite_sent_at timestamptz,
```
after the existing `updated_at` line.

Add the trigger function and trigger at the end of the file (before any seed data).

- [ ] **Step 4: Commit**

```bash
git add src/database/schema.sql
git commit -m "feat: add invite_sent_at, role, is_approved, laser fields to engineers; add activation trigger"
```

---

## Task 2: Edge Function — `invite-user`

**Files:**
- Create: `supabase/functions/invite-user/index.ts`

**Context:** The frontend uses the anon key only. `supabase.auth.admin.inviteUserByEmail()` requires the service role key. This Edge Function runs server-side with Deno. It validates the caller is an admin, sends the invite (creating the `auth.users` row immediately), then inserts into both `profiles` and `engineers`. For resend, it calls `inviteUserByEmail` again (Supabase handles re-sending for unaccepted users) and updates `invite_sent_at`.

The Edge Function reads two env vars Supabase injects automatically: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 1: Create the function file**

Create `supabase/functions/invite-user/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: callerError } = await anonClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: callerProfile } = await adminClient
      .from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, role, location_id, resend } = await req.json();

    if (!email || !name || !role) {
      return new Response(JSON.stringify({ error: 'email, name, and role are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resend) {
      // Resend: re-invite unaccepted user
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { name, role, location_id }
      });
      if (inviteError) {
        // If user is already confirmed (accepted invite), return specific error
        if (inviteError.message?.includes('already registered') ||
            inviteError.message?.includes('already been registered')) {
          return new Response(JSON.stringify({ error: 'User has already activated their account' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw inviteError;
      }
      const now = new Date().toISOString();
      await adminClient.from('profiles').update({ invite_sent_at: now }).eq('email', email);
      await adminClient.from('engineers').update({ invite_sent_at: now }).eq('email', email);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // New invite
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { data: { name, role, location_id } }
    );
    if (inviteError) throw inviteError;

    const userId = inviteData.user.id;
    const now = new Date().toISOString();

    // Insert into profiles
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId, name, email, role,
      location_id: location_id || null,
      is_active: false, is_approved: false,
      invite_sent_at: now,
      created_at: now, updated_at: now,
    });
    if (profileError) throw profileError;

    // Insert into engineers
    const { error: engineerError } = await adminClient.from('engineers').insert({
      id: userId, name, email, role,
      location_id: location_id || null,
      is_active: false, is_approved: false,
      invite_sent_at: now,
      is_available: true,
      created_at: now, updated_at: now,
    });
    if (engineerError) throw engineerError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('invite-user error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy the Edge Function**

Use `mcp__supabase__deploy_edge_function` with:
- `name`: `invite-user`
- `files`: the content of `supabase/functions/invite-user/index.ts`

- [ ] **Step 3: Verify deployment**

Use `mcp__supabase__list_edge_functions` — confirm `invite-user` appears in the list.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/invite-user/index.ts
git commit -m "feat: add invite-user edge function with admin auth check"
```

---

## Task 3: Edge Function — `delete-user`

**Files:**
- Create: `supabase/functions/delete-user/index.ts`

**Context:** `adminClient.auth.admin.deleteUser(userId)` removes the `auth.users` row. Both `profiles.id` and `engineers.id` have `ON DELETE CASCADE`, so they are automatically removed. The anon key client cannot call admin.deleteUser.

- [ ] **Step 1: Create the function file**

Create `supabase/functions/delete-user/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: callerProfile } = await adminClient
      .from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('delete-user error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy**

Use `mcp__supabase__deploy_edge_function` with name `delete-user`.

- [ ] **Step 3: Verify**

Use `mcp__supabase__list_edge_functions` — confirm `delete-user` appears.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/delete-user/index.ts
git commit -m "feat: add delete-user edge function with cascade auth cleanup"
```

---

## Task 4: Fix `supabaseService.updateEngineer` + `EngineerContext.approveUser`

**Files:**
- Modify: `src/services/supabaseService.js` lines 69–79
- Modify: `src/context/EngineerContext.js` lines 591–612

**Context:** Two existing bugs:
1. `updateEngineer` only writes to `engineers`, leaving `profiles` stale.
2. `approveUser` only writes to `profiles`, so `engineers.is_approved` stays false — the approve button never goes away after approval.

- [ ] **Step 1: Fix `updateEngineer` in supabaseService.js**

Replace lines 69–79 in `src/services/supabaseService.js`:

```js
async updateEngineer(id, updates) {
  const { data, error } = await supabase
    .from(TABLES.ENGINEERS)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Sync writable fields to profiles to keep both tables consistent
  const profileUpdates = {};
  const syncFields = ['name', 'role', 'phone', 'location_id', 'laser_type', 'serial_number', 'tracker_status'];
  syncFields.forEach(f => { if (updates[f] !== undefined) profileUpdates[f] = updates[f]; });
  if (Object.keys(profileUpdates).length > 0) {
    profileUpdates.updated_at = new Date().toISOString();
    await supabase.from('profiles').update(profileUpdates).eq('id', id);
  }

  return data;
},
```

- [ ] **Step 2: Fix `approveUser` in EngineerContext.js**

Replace lines 591–612 in `src/context/EngineerContext.js`:

```js
const approveUser = useCallback(async (id) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('engineers').update({ is_approved: true }).eq('id', id);

      dispatch({ type: 'UPDATE_ENGINEER', payload: { id, updates: data } });
    } else {
      dispatch({ type: 'UPDATE_ENGINEER', payload: { id, updates: { is_approved: true } } });
    }
    toast.success('User approved successfully!');
  } catch (error) {
    console.error('Approve user error:', error);
    toast.error('Failed to approve user');
    throw error;
  }
}, []);
```

- [ ] **Step 3: Manual verification**

Start the app (`npm start`). Navigate to User Management. Edit an existing user's phone number → save → check the DB via Supabase dashboard or MCP `execute_sql`:
```sql
select e.phone, p.phone from engineers e join profiles p on p.id = e.id where e.email = 'your-test-user@email.com';
```
Both should show the same value.

- [ ] **Step 4: Commit**

```bash
git add src/services/supabaseService.js src/context/EngineerContext.js
git commit -m "fix: sync profiles on updateEngineer; fix approveUser to update engineers table"
```

---

## Task 5: Rewrite `UserManagement.js`

**Files:**
- Modify: `src/components/UserManagement.js` (full rewrite)

**Context:** The current file is ~950 lines mixing user CRUD (with password creation), leaves management, location management, and password change. The rewrite focuses on user accounts only, using the invite flow. Read the full current file before making changes.

Key imports already in the file to keep: `useAuth`, `useEngineerContext`, lucide-react icons, `toast`, `supabaseService`.
New import needed: `supabase` from `../config/supabase` (for `supabase.functions.invoke`).
New icons needed: `CheckCircle`, `Mail` from lucide-react (replace `Save`, `Plus` usage).

**State to keep:** `searchTerm`, `filterRole`, `editingUser`, `showEditForm`.
**State to remove:** `showAddForm`, `showPasswordForm`, `showLocationForm`, `showLeaveModal`, `editingLeave`, `leaveForm`, `newUser`, `newLocation`, `passwordData`, `showPasswords`, `showViewModal`, `selectedUser`.
**State to add:** `filterStatus` (`'all'|'active'|'pending'|'not_invited'`), `showInviteForm`, `inviteForm` (`{name:'', email:'', role:'engineer', location_id:''}`), `inviteLoading`, `deletingId` (tracks which user has inline confirm open).

- [ ] **Step 1: Write the new UserManagement.js**

Replace the entire contents of `src/components/UserManagement.js` with:

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import { supabase } from '../config/supabase';
import {
  UserPlus, Edit, Trash2, Mail, CheckCircle, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user } = useAuth();
  const { engineers, approveUser, updateEngineer, loadData, locations: ctxLocations } = useEngineerContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'engineer', location_id: '' });
  const [inviteLoading, setInviteLoading] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [deletingId, setDeletingId] = useState(null); // user id with inline confirm open

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (ctxLocations && ctxLocations.length > 0) {
      setLocations(ctxLocations);
    }
  }, [ctxLocations]);

  // ── Derived stats ───────────────────────────────────────────────
  const totalUsers = engineers.length;
  const engineerCount = engineers.filter(e => e.role === 'engineer').length;
  const pendingCount = engineers.filter(e => !e.is_active && e.invite_sent_at).length;
  const adminCount = engineers.filter(e => e.role === 'admin').length;

  // ── Filtering ───────────────────────────────────────────────────
  const filteredUsers = engineers.filter(e => {
    const matchSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (e.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || e.role === filterRole;
    let matchStatus = true;
    if (filterStatus === 'active') matchStatus = e.is_active === true;
    else if (filterStatus === 'pending') matchStatus = !e.is_active && !!e.invite_sent_at;
    else if (filterStatus === 'not_invited') matchStatus = !e.is_active && !e.invite_sent_at;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Status helpers ──────────────────────────────────────────────
  const getStatus = (e) => {
    if (e.is_active) return 'active';
    if (e.invite_sent_at) return 'pending';
    return 'not_invited';
  };

  const STATUS_CONFIG = {
    active:      { label: 'Active',             color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)' },
    pending:     { label: 'Pending Activation', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
    not_invited: { label: 'Not Invited',        color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.20)' },
  };

  const AVATAR_COLORS = {
    active:      'linear-gradient(135deg,#7c3aed,#4f46e5)',
    pending:     'linear-gradient(135deg,#d97706,#b45309)',
    not_invited: 'linear-gradient(135deg,#dc2626,#991b1b)',
  };

  const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const getRoleLabel = (role) => ({ engineer: '🔧 Engineer', manager: '👨‍💼 Manager', admin: '🛡️ Admin' }[role] || role);

  const getLocationName = (locId) => locations.find(l => l.id === locId)?.name || '';

  // ── Invite ──────────────────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { ...inviteForm, location_id: inviteForm.location_id || null, resend: false }
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      toast.success(`Invite sent to ${inviteForm.email}`);
      setShowInviteForm(false);
      setInviteForm({ name: '', email: '', role: 'engineer', location_id: '' });
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (engineer) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: engineer.email, name: engineer.name, role: engineer.role,
                location_id: engineer.location_id, resend: true }
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      toast.success(`Invite resent to ${engineer.email}`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to resend invite');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDeleteConfirm = async (engineer) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: engineer.id }
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      toast.success('User deleted');
      setDeletingId(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // ── Edit ────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateEngineer(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        location_id: editingUser.location_id || null,
        phone: editingUser.phone || null,
        laser_type: editingUser.laser_type || null,
        serial_number: editingUser.serial_number || null,
        tracker_status: editingUser.tracker_status || null,
      });
      toast.success('User updated');
      setShowEditForm(false);
      setEditingUser(null);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const iconBtn = (extra = {}) => ({
    width: 34, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', ...extra
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, color: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 26, fontWeight: 700 }}>User Management</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Manage user accounts and access</p>
        </div>
        <button className="glass-btn-primary" onClick={() => setShowInviteForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={16} /> Invite User
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: totalUsers, color: '#a78bfa' },
          { label: 'Engineers', value: engineerCount, color: '#60a5fa' },
          { label: 'Pending Activation', value: pendingCount, color: '#fbbf24', clickStatus: 'pending' },
          { label: 'Admins', value: adminCount, color: '#f87171' },
        ].map(stat => (
          <div key={stat.label}
            onClick={() => stat.clickStatus && setFilterStatus(f => f === stat.clickStatus ? 'all' : stat.clickStatus)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${stat.clickStatus && filterStatus === stat.clickStatus ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, padding: '14px 16px', cursor: stat.clickStatus ? 'pointer' : 'default',
            }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search users…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="glass-input" style={{ flex: 1, minWidth: 200 }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="glass-select" style={{ minWidth: 140 }}>
          <option value="all">All Roles</option>
          <option value="engineer">Engineers</option>
          <option value="manager">Managers</option>
          <option value="admin">Admins</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-select" style={{ minWidth: 160 }}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="pending">Pending Activation</option>
          <option value="not_invited">Not Invited</option>
        </select>
      </div>

      {/* ── User list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#475569' }}>No users found</div>
        )}
        {filteredUsers.map(engineer => {
          const status = getStatus(engineer);
          const sc = STATUS_CONFIG[status];
          return (
            <div key={engineer.id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16
            }}>
              {/* Avatar */}
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: AVATAR_COLORS[status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {getInitials(engineer.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{engineer.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                    {sc.label}
                  </span>
                  <span style={{ background: 'rgba(123,97,255,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                    {getRoleLabel(engineer.role)}
                  </span>
                </div>
                <div style={{ color: '#64748b', fontSize: 13 }}>
                  {engineer.email}
                  {engineer.location_id && ` · 📍 ${getLocationName(engineer.location_id)}`}
                  {engineer.phone && ` · 📞 ${engineer.phone}`}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 7, flexShrink: 0, alignItems: 'center' }}>
                {!engineer.is_approved && (
                  <button onClick={() => approveUser(engineer.id)} title="Approve"
                    style={iconBtn({ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' })}>
                    <CheckCircle size={16} />
                  </button>
                )}
                {(status === 'pending' || status === 'not_invited') && (
                  <button onClick={() => handleResendInvite(engineer)} title={status === 'pending' ? 'Resend Invite' : 'Send Invite'}
                    style={{ ...iconBtn({ border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', background: 'rgba(99,102,241,0.12)' }), padding: '0 12px', width: 'auto', fontSize: 12, fontWeight: 600, gap: 4, display: 'flex' }}>
                    <Mail size={13} /> {status === 'pending' ? 'Resend' : 'Send Invite'}
                  </button>
                )}
                <button onClick={() => { setEditingUser({ ...engineer }); setShowEditForm(true); }} title="Edit"
                  style={iconBtn({ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' })}>
                  <Edit size={15} />
                </button>

                {/* Inline delete confirm */}
                {deletingId === engineer.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: 12, color: '#f87171', whiteSpace: 'nowrap' }}>Delete user?</span>
                    <button onClick={() => handleDeleteConfirm(engineer)}
                      style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Confirm
                    </button>
                    <button onClick={() => setDeletingId(null)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingId(engineer.id)} title="Delete"
                    style={iconBtn({ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' })}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Invite Modal ── */}
      {showInviteForm && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>✉ Invite User</h3>
              <button onClick={() => setShowInviteForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 18px 0', color: '#64748b', fontSize: 13 }}>An invite email will be sent — user sets their own password on first login.</p>

            <form onSubmit={handleInvite}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Full Name *</div>
                  <input required className="glass-input" value={inviteForm.name}
                    onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div className="section-label">Email *</div>
                  <input required type="email" className="glass-input" value={inviteForm.email}
                    onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="section-label">Role *</div>
                  <select required className="glass-select" value={inviteForm.role}
                    onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="engineer">🔧 Engineer</option>
                    <option value="manager">👨‍💼 Manager</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                </div>
                <div>
                  <div className="section-label">Location</div>
                  <select className="glass-select" value={inviteForm.location_id}
                    onChange={e => setInviteForm(p => ({ ...p, location_id: e.target.value }))}>
                    <option value="">No location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#818cf8', marginBottom: 16 }}>
                ℹ A secure invite link will be emailed. No password needed — the user creates their own when they accept.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => setShowInviteForm(false)}>Cancel</button>
                <button type="submit" className="glass-btn-primary" disabled={inviteLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={15} /> {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditForm && editingUser && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Edit User</h3>
              <button onClick={() => { setShowEditForm(false); setEditingUser(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Full Name *</div>
                  <input required className="glass-input" value={editingUser.name || ''}
                    onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div className="section-label">Email</div>
                  <input readOnly className="glass-input" value={editingUser.email || ''} style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Role *</div>
                  <select required className="glass-select" value={editingUser.role || 'engineer'}
                    onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="engineer">🔧 Engineer</option>
                    <option value="manager">👨‍💼 Manager</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                </div>
                <div>
                  <div className="section-label">Location</div>
                  <select className="glass-select" value={editingUser.location_id || ''}
                    onChange={e => setEditingUser(p => ({ ...p, location_id: e.target.value || null }))}>
                    <option value="">No location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div className="section-label">Phone</div>
                <input type="tel" className="glass-input" value={editingUser.phone || ''}
                  onChange={e => setEditingUser(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Laser Type</div>
                  <input className="glass-input" value={editingUser.laser_type || ''}
                    onChange={e => setEditingUser(p => ({ ...p, laser_type: e.target.value }))} />
                </div>
                <div>
                  <div className="section-label">Serial Number</div>
                  <input className="glass-input" value={editingUser.serial_number || ''}
                    onChange={e => setEditingUser(p => ({ ...p, serial_number: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">Tracker Status</div>
                <select className="glass-select" value={editingUser.tracker_status || ''}
                  onChange={e => setEditingUser(p => ({ ...p, tracker_status: e.target.value }))}>
                  <option value="">Not set</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => { setShowEditForm(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={15} /> Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
```

- [ ] **Step 2: Verify `locations` is exposed from EngineerContext**

Open `src/context/EngineerContext.js` and search for `locations` in the context value (around line 679). Confirm it's in the value object. If `locations` is not exposed (only `locationObjects` may be), update the destructure in UserManagement.js:

```js
// If context exposes locationObjects (array of {id, name}), use that:
const { engineers, approveUser, updateEngineer, loadData, locationObjects } = useEngineerContext();
// and in useEffect: setLocations(locationObjects || []);
```

Check the EngineerContext value object to confirm which key name is used.

- [ ] **Step 3: Check `locations` key in EngineerContext**

Open `src/context/EngineerContext.js` around line 679 and find the key name for the locations array. The value object has `locationObjects: state.locationObjects || []`. Update `UserManagement.js` to use `locationObjects` instead of `locations` if needed.

- [ ] **Step 4: Manual verification**

Run `npm start`. Navigate to User Management:
- Stats bar shows 4 pills
- Users render as cards with correct status colors
- "Invite User" button opens modal (no password fields)
- Edit opens simplified modal with only the 6 field groups
- Delete shows inline confirm
- No leaves section, no Add Location button

- [ ] **Step 5: Commit**

```bash
git add src/components/UserManagement.js
git commit -m "feat: rewrite UserManagement with invite flow, status cards, inline delete confirm"
```

---

## Task 6: Deploy Edge Functions to Supabase

**Context:** If the Edge Functions were created in Task 2 and 3 but not yet deployed to the live project, deploy them now via MCP.

- [ ] **Step 1: Verify both functions are listed**

Use `mcp__supabase__list_edge_functions` — both `invite-user` and `delete-user` should appear. If either is missing, re-run `mcp__supabase__deploy_edge_function` for that function.

- [ ] **Step 2: Verify SUPABASE_ANON_KEY is available in Edge Function env**

Edge Functions automatically receive `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. No manual secret configuration needed for these three.

- [ ] **Step 3: End-to-end smoke test**

In the running app, attempt to invite a test email address. Check Supabase dashboard → Authentication → Users — the invited user should appear with `invited_at` set and no `confirmed_at`. Check the `engineers` table — a row should exist with `is_active: false` and `invite_sent_at` set.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete user management redesign with invite flow and edge functions"
```
