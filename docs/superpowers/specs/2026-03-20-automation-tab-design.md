# Automation Tab — Design Spec
**Date:** 2026-03-20
**Status:** Approved

---

## Overview

A new admin-only "Automation" tab in the app that configures three automation pipelines:
1. **Email Automation** — inbound email webhook parses client emails into cases
2. **WhatsApp Notifications** — event-driven WhatsApp share prompts for case/schedule events
3. **Client Request Form** — public shareable form at `/client-request` that emails the inbound address to create cases

---

## Access Control

- Tab entry added to `getTabsForUser()` in `App.js` **only** when `profile.role === 'admin'`:
  ```js
  { id: 'automation', label: 'Automation', icon: '⚡' }
  ```
- `/client-request` is **public** (no auth required). Add it to the unauthenticated `<Routes>` block in `App.js` **before** the `path="*"` catch-all:
  ```jsx
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/accept-invite" element={<AcceptInvitePage />} />
  <Route path="/client-request" element={<ClientRequestForm />} />
  <Route path="*" element={<LoginPage />} />
  ```

---

## automation_config Table (singleton)

One row, always `id = 1`. Created by migration with an initial default row. RLS: admins can read and update; service role (edge functions) can read.

```sql
create table public.automation_config (
  id integer primary key default 1 check (id = 1),  -- singleton
  inbound_email text default '',
  allowed_senders text[] default '{}',
  default_priority text default 'medium',
  whatsapp_triggers jsonb default '{"case_created":false,"schedule_added":false,"case_completed":false}',
  whatsapp_templates jsonb default '{}',
  updated_at timestamptz default now()
);

-- Seed the singleton row
insert into public.automation_config (id) values (1) on conflict do nothing;

-- RLS
alter table public.automation_config enable row level security;
create policy "admins_read_automation_config" on public.automation_config
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "admins_update_automation_config" on public.automation_config
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

### How the front-end reads it

Add `automationConfig` state and `loadAutomationConfig` / `saveAutomationConfig` to **`EngineerContext`**:

```js
const loadAutomationConfig = useCallback(async () => {
  if (!isSupabaseConfigured()) return;
  const { data } = await supabase.from('automation_config').select('*').eq('id', 1).single();
  if (data) dispatch({ type: 'SET_AUTOMATION_CONFIG', payload: data });
}, []);

const saveAutomationConfig = useCallback(async (updates) => {
  const { data, error } = await supabase
    .from('automation_config').update(updates).eq('id', 1).select().single();
  if (error) throw error;
  dispatch({ type: 'SET_AUTOMATION_CONFIG', payload: data });
}, []);
```

**`loadAutomationConfig` is NOT called inside `loadData()`** — `loadData` has no access to the user's profile/role. Instead, `AutomationPanel` calls `loadAutomationConfig()` in its own `useEffect` on mount:

```js
// Inside AutomationPanel.js
const { automationConfig, loadAutomationConfig, saveAutomationConfig } = useEngineerContext();
useEffect(() => { loadAutomationConfig(); }, [loadAutomationConfig]);
```

`automationConfig` defaults to `null` in `initialState`. `CaseManager` and `CaseCompletionModal` read it from context — if `null` (non-admin session where it was never loaded), the WhatsApp trigger check is skipped silently.

Expose `loadAutomationConfig` and `saveAutomationConfig` in the context value object.

---

## automation_logs Table

```sql
create table public.automation_logs (
  id bigserial primary key,
  type text not null,   -- 'email_case', 'form_submission'
  source text,          -- sender email or 'form'
  payload jsonb,
  result text,          -- 'created', 'failed', 'rejected'
  error text,
  created_at timestamptz default now()
);

alter table public.automation_logs enable row level security;

-- Edge functions write using service role (bypasses RLS)
-- Admins read directly from browser client
create policy "admins_read_automation_logs" on public.automation_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

`AutomationPanel` fetches logs directly via the browser Supabase client (admin JWT satisfies the RLS policy above).

---

## Section 1: Email Automation UI

Component: part of `AutomationPanel.js`

- **Webhook URL** — read-only input: `https://<project-ref>.supabase.co/functions/v1/parse-email-case`, copy button
- **Inbound email address** — editable text field bound to `automationConfig.inbound_email`, save on blur
- **Allowed senders** — tag-input list bound to `automationConfig.allowed_senders`, add/remove
- **Default priority** — dropdown bound to `automationConfig.default_priority`
- **Automation log** — table of last 20 rows from `automation_logs` where `type = 'email_case'`

### Edge Function: `parse-email-case`

Called by Mailgun/Postmark via HTTP POST. No user auth — uses `SUPABASE_SERVICE_ROLE_KEY`.

```
Env vars required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

Flow:
1. Parse multipart form (Mailgun) or JSON body (Postmark) to extract `from`, `subject`, `body_plain`
2. Fetch `automation_config` row using service role client
3. Check sender against `allowed_senders` — if not allowed, log `rejected` and return 200 (email services retry on non-2xx)
4. Parse body for structured fields:
   - `Hospital:` → match against `clients` table by name → `client_id`
   - `Location:` → match against `locations` table by name → `location_id`
   - `Priority:` → `priority` (default: `automation_config.default_priority`)
   - `Date:` → `scheduled_start`
   - Subject (strip `[SEP Request]` prefix) → `title`
   - Remaining body → `description`
5. Insert into `cases` table with `status = 'open'`, `created_by = null`
6. Log to `automation_logs` with `type = 'email_case'`, `result = 'created'`

---

## Section 2: WhatsApp Notifications UI

Component: part of `AutomationPanel.js`

Three rows — Case Created, Schedule Added, Case Completed:
- Toggle (on/off) — bound to `automationConfig.whatsapp_triggers.<event>`
- "Edit Template" expands inline textarea — bound to `automationConfig.whatsapp_templates.<event>`
- Live preview panel below textarea with sample data substituted for `{{variables}}`
- "Save" button calls `saveAutomationConfig({ whatsapp_triggers: ..., whatsapp_templates: ... })`

Supported template variables: `{{client}}`, `{{location}}`, `{{engineer}}`, `{{date}}`, `{{priority}}`, `{{status}}`

### WhatsApp trigger in CaseManager

In `CaseManager.handleSubmit`, after `await addCase(caseData)` succeeds, **before** `resetForm()`:

```js
// Resolve display values from already-available formData (names, not IDs)
const trigger = automationConfig?.whatsapp_triggers?.case_created;
const template = automationConfig?.whatsapp_templates?.case_created;
if (trigger && template) {
  const engineer = engineers.find(e => e.id === formData.assignedEngineer);
  const msg = template
    .replace('{{client}}', formData.clientName)
    .replace('{{location}}', formData.location)      // already a name string
    .replace('{{engineer}}', engineer?.name || 'Unassigned')
    .replace('{{date}}', new Date().toLocaleDateString('en-IN'))
    .replace('{{priority}}', formData.priority)
    .replace('{{status}}', 'open');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
```

**Timing note:** `window.open` is called within the same `handleSubmit` call stack (the form's `onSubmit` user gesture). One `await` (addCase) is generally safe for browser popup permission; the gesture chain is preserved in Chrome/Safari/Firefox as long as the await resolves quickly. This is the same pattern already used in `CaseCompletionModal`.

`automationConfig` and `engineers` are both available via `useEngineerContext()` in `CaseManager`.

---

## Section 3: Client Request Form

### New component: `src/components/ClientRequestForm.js`

Public page — no sidebar, no topbar, standalone branded card.

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| Hospital Name | text | yes |
| Contact Person | text | yes |
| Phone | tel | yes |
| Request Description | textarea | yes |
| Preferred Date | date | no |

**On submit:**
1. POST to Supabase Edge Function `submit-client-request` (anon key, no user token)
2. Show loading state on button
3. On success → replace form with confirmation: "✅ Your request has been submitted. We'll be in touch soon."
4. On error → show inline error message

### Edge Function: `submit-client-request`

```
Env vars required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
```

Flow:
1. Validate required fields (hospital, contact, phone, description)
2. Fetch `automation_config.inbound_email` using service role
3. If `inbound_email` is empty → return 503 "Automation not configured"
4. Send email via Resend API (`https://api.resend.com/emails`):
   ```
   from: noreply@yourdomain.com
   to: {inbound_email}
   subject: [SEP Request] {Hospital Name}
   text:
     Hospital: {Hospital Name}
     Location: (not specified)
     Priority: medium
     Date: {Preferred Date or 'Not specified'}

     {Request Description}

     ---
     Contact: {Contact Person}
     Phone: {Phone}
   ```
5. Log to `automation_logs` with `type = 'form_submission'`, `source = 'form'`
6. Return `{ success: true }`

**Canonical email service: Resend.** Secret name: `RESEND_API_KEY`. Set via `supabase secrets set RESEND_API_KEY=<key>`.

### Automation tab: shareable link panel

- Full URL: `{window.location.origin}/client-request` — copy button
- QR code generated client-side using `qrcode` npm package (`qrcode.toDataURL(url)` → `<img>`)
- "Share via WhatsApp" button: `wa.me/?text=Use this link to submit a service request: {url}`

### Email template card

Displayed in the Automation tab as a formatted code block with copy button:
```
To: {inbound_email}
Subject: [SEP Request] Your Hospital Name

Hospital: City Hospital
Location: Bangalore
Priority: medium
Date: 25/03/2026

Please describe the service request here.

---
Contact: Dr. Name
Phone: 98765 43210
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/AutomationPanel.js` | **New** — 3-section automation config UI |
| `src/components/ClientRequestForm.js` | **New** — public client request form |
| `src/App.js` | Add `automation` tab (admin only); add `/client-request` route before `path="*"` |
| `src/context/EngineerContext.js` | Add `automationConfig: null` to `initialState`, `SET_AUTOMATION_CONFIG` reducer case, `loadAutomationConfig` and `saveAutomationConfig` callbacks; expose both in context value. **Not called from `loadData`** — called from `AutomationPanel` on mount |
| `src/components/CaseManager.js` | After `addCase` success, check `automationConfig.whatsapp_triggers.case_created` and open WhatsApp |
| `src/components/CaseCompletionModal.js` | Use `automationConfig.whatsapp_templates.case_completed` when trigger is on |
| `supabase/functions/parse-email-case/index.ts` | **New** — inbound email parser |
| `supabase/functions/submit-client-request/index.ts` | **New** — form → outbound email via Resend |
| `src/database/schema.sql` | Add `automation_config` and `automation_logs` tables + RLS + seed |

---

## Dependencies

- `qrcode` npm package — QR code generation (client-side, no server needed)
- Resend account + API key (for `submit-client-request` outbound email)
- Mailgun or Postmark account (admin configures externally; webhook URL shown in UI)

---

## Testing

- Automation tab visible for admin, hidden for engineer/manager/executive
- `/client-request` accessible without login, submission creates `automation_logs` entry
- WhatsApp toggles and templates persist after page reload
- `parse-email-case` rejects unlisted senders (returns 200, logs `rejected`)
- QR code renders and points to correct `/client-request` URL
- Email template copy button copies correct format with current `inbound_email` value
