# Supabase Setup Design Spec
**Date:** 2026-03-18
**Scope:** Apply full database schema to the live Supabase project (empty/fresh)

---

## Overview

The SEP app already has a complete schema at `src/database/schema.sql`. The Supabase project (`vrwmijknkujmmjwiedks.supabase.co`) is empty. This spec covers applying the schema as a single migration via the Supabase MCP tool and verifying the result.

No code changes. No new files beyond the migration record.

---

## What Gets Applied

| Category | Items |
|---|---|
| Extension | `uuid-ossp` |
| Tables (11) | `locations`, `clients`, `profiles`, `engineers`, `cases`, `schedules`, `leaves`, `user_sessions`, `google_calendar_tokens`, `notifications`, `audit_logs` |
| RLS | Enabled on all 11 tables |
| Policies | Full definitions in `schema.sql`. Key patterns: `user_sessions`, `google_calendar_tokens`, `notifications` — self-only (uid match). `profiles` — self-only patched to add admin/manager select (see defects). All other tables — mix of ownership (creator/assignee/engineer_id) and admin/manager access; exact per-operation rules in schema. `clients` insert uses `auth.role() = 'authenticated'` (any logged-in user). `clients` delete is admin/manager only. |
| Functions | `handle_updated_at()`, `handle_new_user()` (`security definer`) |
| Triggers | `updated_at` auto-update on 6 tables: profiles, engineers, cases, schedules, leaves, google_calendar_tokens (source schema also defines one for `user_sessions`, which is dropped — see defects; `clients` has an `updated_at` column but no trigger — also noted in defects); `on_auth_user_created` on `auth.users` |
| Seed data | 4 locations: Hyderabad Office, Bangalore Office, Coimbatore Office, Chennai Office |

---

## Schema Defects Fixed During Migration

Three bugs in `schema.sql` must be noted. Two are patched in the applied migration; one is a known gap accepted as-is:

### 1. `user_sessions` missing `updated_at` column
`schema.sql` defines a trigger `handle_user_sessions_updated_at` but the `user_sessions` table has no `updated_at` column (it has `last_activity` instead). The trigger must be dropped — it would error on any update to `user_sessions`.

**Fix:** omit `create trigger handle_user_sessions_updated_at` from the applied migration (or add an `updated_at` column — omitting is simpler since `last_activity` already serves the same purpose).

### 3. `clients.updated_at` has no trigger (accepted gap)
The `clients` table has an `updated_at` column but no `handle_clients_updated_at` trigger was defined in `schema.sql`. This means `clients.updated_at` will never auto-update. **Accepted as-is** — client records are not time-sensitive and this can be added later. No fix applied in this migration.

---

### 2. `profiles` select policy blocks admin approval workflow
The `profiles_select` policy is `auth.uid() = id` only. Admins and managers cannot see other users' profiles, which breaks the approval workflow (approving pending users requires listing all profiles).

**Fix:** Replace the policy with one that also allows admin/manager access. Use a `security definer` helper function to avoid circular RLS recursion (a policy on `profiles` that queries `profiles` would recurse infinitely):

```sql
create or replace function public.is_admin_or_manager()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('admin', 'manager') or is_admin = true)
  );
$$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select using (auth.uid() = id or public.is_admin_or_manager());
```

---

## Key Behaviour Notes

- **Auto-profile on signup:** `handle_new_user()` reads `raw_user_meta_data` for `name`, `role`, `is_admin` and inserts a row into `profiles`. This means SignupPage's `signUp()` call will have a profile created automatically — AuthContext's fallback upsert is a safety net only.
- **Approval flow:** `is_approved` defaults to `false` for all roles except `admin` (auto-approved in the trigger). With the fixed `profiles_select` policy, admins/managers can list and approve pending users.
- **Admin assignment:** Set `role = 'admin'` and `is_admin = true` directly in the `profiles` table via Supabase dashboard — never through signup UI.
- **Locations available immediately:** The 4 seed locations will be available for the signup Step 2 dropdown.

---

## Verification Checks

After applying the migration:
1. All 11 tables present in `public` schema with RLS enabled
2. `select count(*) from locations` returns 4
3. `on_auth_user_created` trigger is active on `auth.users`
4. `handle_new_user` function exists and is `security definer`
5. `is_admin_or_manager` helper function exists and is `security definer`
6. No `handle_user_sessions_updated_at` trigger exists on `user_sessions`

---

## Files

| File | Role |
|---|---|
| `src/database/schema.sql` | Source SQL — applied as migration content |

No modifications to any application code.
