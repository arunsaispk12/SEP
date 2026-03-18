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
| Policies | Ownership-based + role-based (admin/manager) for every table |
| Functions | `handle_updated_at()`, `handle_new_user()` |
| Triggers | `updated_at` auto-update on 7 tables; `on_auth_user_created` on `auth.users` (auto-creates profile row on signup) |
| Seed data | 4 locations: Hyderabad Office, Bangalore Office, Coimbatore Office, Chennai Office |

---

## Key Behaviour Notes

- **Auto-profile on signup:** `handle_new_user()` reads `raw_user_meta_data` for `name`, `role`, `is_admin` and inserts a row into `profiles`. This means SignupPage's `signUp()` call will have a profile created automatically — AuthContext's fallback upsert is a safety net only.
- **Approval flow:** `is_approved` defaults to `false` for all roles except `admin` (auto-approved in the trigger).
- **Admin assignment:** Set `role = 'admin'` and `is_admin = true` directly in the `profiles` table via Supabase dashboard — never through signup UI.
- **Locations available immediately:** The 4 seed locations will be available for the signup Step 2 dropdown.

---

## Verification Checks

After applying the migration:
1. All 11 tables present in `public` schema
2. `select count(*) from locations` returns 4
3. `on_auth_user_created` trigger is active on `auth.users`

---

## Files

| File | Role |
|---|---|
| `src/database/schema.sql` | Source SQL — applied as migration content |

No modifications to any application code.
