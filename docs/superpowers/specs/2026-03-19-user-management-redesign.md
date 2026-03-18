# User Management Redesign Design Spec
**Date:** 2026-03-19
**Scope:** Full redesign of `UserManagement.js` — replace direct user creation with Supabase invite flow, add stats bar, clean up card layout with status states, fix edit form, remove leaves/location/password concerns.

---

## Overview

`UserManagement.js` currently does too many things: user CRUD with admin-set passwords, leave management, location management, and password change — all in ~950 lines. This redesign focuses it on one concern: **user account management**. The invite flow replaces direct password creation. Leaves are removed (handled in Dashboard). Location is removed (handled in LocationManagement tab). Password change modal is removed.

---

## Data Architecture

The app has two user tables:
- **`profiles`** — primary user table. Has `id uuid references auth.users(id) ON DELETE CASCADE`, `role`, `is_approved`, `is_active`, `laser_type`, `serial_number`, `tracker_status`, `phone`, `name`, `email`, `location_id`.
- **`engineers`** — scheduling-focused table. Has `id uuid references auth.users(id) ON DELETE CASCADE`. Currently missing `role`, `is_approved`, `invite_sent_at`, `laser_type`, `serial_number`, `tracker_status`.

`EngineerContext` reads from `engineers` (via `supabaseService.getEngineers()`). `UserManagement` consumes the `engineers` array from context.

**Decision:** Add missing columns to `engineers`. All user operations (invite, edit, delete) keep `profiles` and `engineers` in sync. Sync logic lives in `supabaseService`, not in components.

---

## Approved Design

### Section 1 — Page Structure

**Header:** Title "User Management" + subtitle. Single **"Invite User"** primary button (✉ icon) on the right. No "Add Location" button.

**Stats bar:** 4 glass pills in a 4-column grid:
- Total Users (all engineers count)
- Engineers (count where `role === 'engineer'`)
- Pending Activation — amber — count where `is_active === false AND invite_sent_at != null`. Clicking sets status filter to "Pending Activation".
- Admins (count where `role === 'admin'`)

**Filters:** Search input (name/email) + Role select (All / Engineer / Manager / Admin) + Status select (All Users / Active / Pending Activation / Not Invited).

---

### Section 2 — User Card Layout

Glass card per user with:

**Left:** Gradient initials circle — purple=active, amber=pending activation, red=not-invited.

**Center:** Name + status badge + role badge · email · location · phone.

**Status badge values:**
- `● Active` (green) — `is_active === true`
- `● Pending Activation` (amber) — `is_active === false AND invite_sent_at != null`
- `● Not Invited` (red) — `is_active === false AND invite_sent_at == null`

**Action buttons (right):**

| State | Buttons |
|---|---|
| Active | Edit · Delete |
| Pending Activation | Resend Invite · Edit · Delete |
| Not Invited | Send Invite · Edit · Delete |
| Any + `!is_approved` | Approve (CheckCircle, green) prepended |

**Delete:** Opens inline confirm ("Delete user? [Confirm] [Cancel]"). On Confirm: call `deleteUser(id)` — see Section 6. No `window.confirm`.

**Approve:** calls `approveUser(id)` — see Section 7. CheckCircle icon. Shown only when `!is_approved`.

**Send/Resend Invite:** calls the `invite-user` Edge Function (Section 4). On success: call `loadData()` to refresh, toast "Invite sent to [email]".

---

### Section 3 — Invite User Modal

Fields: Full Name (required) · Email (required) · Role (select: Engineer/Manager/Admin, required) · Location (select, optional).

No password fields. Info note: "A secure invite link will be emailed. The user sets their own password when they accept."

**On submit:** Call `supabase.functions.invoke('invite-user', { body: { email, name, role, location_id, resend: false } })`. On success: close modal, `loadData()`, toast. On error: show error, keep modal open.

---

### Section 4 — Edge Function: `invite-user`

**File:** `supabase/functions/invite-user/index.ts`

**Authorization:** Extract JWT from `Authorization` header. Create admin client with `SUPABASE_SERVICE_ROLE_KEY`. Look up caller in `profiles` where `id = jwt.sub`. If `role !== 'admin'`, return 403.

**Request:** `{ email, name, role, location_id, resend: boolean }`

**New invite (`resend: false`):**
1. Validate email, name, role present
2. Call `adminClient.auth.admin.inviteUserByEmail(email, { data: { name, role, location_id } })`
   — creates `auth.users` row immediately, sends invite email, returns `{ user: { id } }`
3. `INSERT INTO profiles (id, name, email, role, location_id, is_active, is_approved, invite_sent_at) VALUES (user.id, ..., false, false, now())`
4. `INSERT INTO engineers (id, name, email, role, location_id, is_active, is_approved, invite_sent_at) VALUES (user.id, ..., false, false, now())`
5. Return `{ success: true }`

**Resend (`resend: true`):**
1. Call `adminClient.auth.admin.inviteUserByEmail(email)` — Supabase re-sends invite for unaccepted users
2. If error `"User already registered"` (user already accepted invite and is active): return `{ error: "User has already activated their account" }`
3. On success: `UPDATE profiles SET invite_sent_at = now() WHERE email = email`; `UPDATE engineers SET invite_sent_at = now() WHERE email = email`
4. Return `{ success: true }`

---

### Section 5 — Edge Function: `delete-user`

**File:** `supabase/functions/delete-user/index.ts`

Deleting a user requires removing them from `auth.users`. The `ON DELETE CASCADE` on both `profiles` and `engineers` handles the DB cleanup automatically.

**Authorization:** Same JWT + admin-role check as `invite-user`.

**Request:** `{ userId: string }`

**Logic:**
1. Validate userId
2. Call `adminClient.auth.admin.deleteUser(userId)` — removes from `auth.users`; CASCADE deletes `profiles` and `engineers` rows automatically
3. Return `{ success: true }`

**Called from `UserManagement.js`:**
```js
await supabase.functions.invoke('delete-user', { body: { userId: engineer.id } });
// then call loadData() to refresh list
```

Do NOT call `deleteEngineer(id)` from context — that only deletes from `engineers` table, leaving orphan auth/profile rows.

---

### Section 6 — `supabaseService` Updates

**`updateEngineer(id, updates)`** — already updates `engineers`. Extend to also update `profiles` in the same function to keep both tables in sync:
```js
async updateEngineer(id, updates) {
  const { data, error } = await supabase.from('engineers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;

  // Sync to profiles (role, name, phone, location_id, laser_type, serial_number, tracker_status)
  await supabase.from('profiles')
    .update({ name: updates.name, role: updates.role, phone: updates.phone,
              location_id: updates.location_id, laser_type: updates.laser_type,
              serial_number: updates.serial_number, tracker_status: updates.tracker_status,
              updated_at: new Date().toISOString() })
    .eq('id', id);

  return data;
}
```

---

### Section 7 — EngineerContext: `approveUser` Fix

Currently `approveUser` updates only `profiles`. Must also update `engineers`:
```js
const approveUser = useCallback(async (userId) => {
  await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
  await supabase.from('engineers').update({ is_approved: true }).eq('id', userId);
  // existing state update logic
}, [...]);
```

---

### Section 8 — User Acceptance Trigger

When an invited user clicks the link and sets their password, Supabase updates `auth.users.email_confirmed_at` from NULL to a timestamp. We need a DB trigger to set `is_active: true` on both tables.

**Migration — add trigger:**
```sql
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set is_active = true where id = new.id;
    update public.engineers set is_active = true where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_user_confirmed
  after update on auth.users
  for each row execute procedure public.handle_user_confirmed();
```

This is added to the Supabase migration. Once fired, `is_active` becomes `true` on both tables, and on next `loadData()` call the card switches from "Pending Activation" to "Active".

---

### Section 9 — Database Migration

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

-- Trigger: set is_active=true when user confirms email
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set is_active = true where id = new.id;
    update public.engineers set is_active = true where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_user_confirmed
  after update on auth.users
  for each row execute procedure public.handle_user_confirmed();
```

Update `src/database/schema.sql` to match.

---

### Section 10 — Edit User Modal

Fields only:
- Full Name (required)
- Email (read-only — cannot change email post-invite)
- Role (select: Engineer / Manager / Admin)
- Location (select)
- Phone
- Laser Type (text)
- Serial Number (text)
- Tracker Status (select: Available / Not Available / empty)

**On submit:** call `updateEngineer(id, { name, role, location_id, phone, laser_type, serial_number, tracker_status })` from context. The updated `updateEngineer` in supabaseService syncs both tables.

---

### Section 11 — Removals from `UserManagement.js`

| Removed | Reason |
|---|---|
| Leaves management section | Dashboard PendingApprovalsPanel owns this |
| Add Location button + modal | LocationManagement tab owns this |
| Password change modal + all related state | ProfileManagement handles own password |
| View user modal (Eye button) | Card shows sufficient info |
| `addSkill`, `removeSkill`, `addCertification`, `removeCertification` | Not needed |
| `availableSkills`, `availableCertifications` | Not needed |
| Direct "Add User" form with password fields | Replaced by invite flow |

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/components/UserManagement.js` | Major rewrite — invite flow, new card layout, simplified forms |
| `supabase/functions/invite-user/index.ts` | New Edge Function |
| `supabase/functions/delete-user/index.ts` | New Edge Function |
| `src/services/supabaseService.js` | Extend `updateEngineer` to sync profiles |
| `src/context/EngineerContext.js` | Fix `approveUser` to update engineers table too |
| `src/database/schema.sql` | Add columns to engineers + profiles; add trigger |
| Supabase migration | Apply all schema changes |

---

## Verification Checks

1. "Invite User" opens modal with name/email/role/location only — no password fields
2. Invite calls Edge Function → both `engineers` and `profiles` rows created, `invite_sent_at` set
3. Invited user shows "Pending Activation" amber badge
4. Existing inactive users with no `invite_sent_at` show "Not Invited" red badge + "Send Invite"
5. "Resend Invite" re-sends email; gracefully rejects already-active users
6. When user accepts invite, `is_active` flips to true on both tables via trigger → card shows "Active"
7. Stats bar "Pending Activation" = `is_active=false AND invite_sent_at != null`; click filters list
8. Edit modal: name editable, email read-only, role/location/phone/laser fields present
9. Editing updates both `engineers` and `profiles` via `updateEngineer`
10. Delete calls `delete-user` Edge Function → `auth.users` deleted → CASCADE removes engineers + profiles
11. Approve updates `is_approved: true` on both tables
12. Delete uses inline confirm — no `window.confirm`
13. Approve uses CheckCircle icon, only shown when `!is_approved`
14. Leaves, Add Location, password modal — removed
15. Both Edge Functions reject non-admin callers with 403
