# Invited User Signup Flow — Design Spec
**Date:** 2026-03-20
**Status:** Approved

---

## Overview

When an admin invites a user via the UserManagement UI, Supabase sends an email containing a magic link. Clicking that link redirects the user to `/accept-invite` with an invite token in the URL hash. Currently no page handles this — the user lands in a broken state. This spec defines a dedicated `/accept-invite` route with a 2-step wizard to complete the invited user's account setup.

---

## Goals

- Catch invited users on arrival and guide them through account setup
- Collect: password (step 1), name + phone (step 2)
- Auto-approve and activate the user on completion (no separate admin approval needed)
- Redirect to dashboard when done

---

## Out of Scope

- Skills, certifications, experience fields (not required)
- Avatar/photo upload
- Role or location selection (admin-set, not user-editable at signup)

---

## Auth State Model for Invited Users

**Key insight:** When an invited user arrives, we never dispatch `LOGIN_SUCCESS` — we dispatch `SET_PENDING_SETUP: true` instead. This means:
- `isAuthenticated` remains `false`
- `pendingSetup` is `true`
- The user is in the `!isAuthenticated` rendering branch of `App.js`
- The `/accept-invite` route in the unauthenticated `<Routes>` block is matched and renders `AcceptInvitePage`

The `pendingSetup` flag is stored in auth state but its primary purpose is to prevent the user from being treated as a normal unauthenticated user (e.g., hitting the `is_approved` login check). `AcceptInvitePage` checks for a valid session directly via `supabase.auth.getSession()` — **not** via `isAuthenticated` from context, which will always be `false` at this point.

---

## Data Flow & Token Handling

1. Admin sends invite → `invite-user` edge function calls `inviteUserByEmail` with `redirectTo: '<APP_URL>/accept-invite'` → Supabase emails user
2. User clicks email link → browser redirects to `/accept-invite` with `#access_token=...&refresh_token=...&type=invite` in URL hash
3. Supabase JS client auto-exchanges the hash token on page load and fires `onAuthStateChange` with event `SIGNED_IN`
4. `AuthContext` `SIGNED_IN` handler fetches profile. If `profile.is_active=false`:
   - dispatch `SET_PENDING_SETUP: true`
   - dispatch `SET_LOADING: false`
   - **do not** dispatch `LOGIN_SUCCESS`
5. `checkAuth()` (initial load / page refresh) also fetches session + profile. Same logic: if `profile.is_active=false`, dispatch `SET_PENDING_SETUP: true` and `SET_LOADING: false` without dispatching `LOGIN_SUCCESS`
6. With `isAuthenticated=false` and `loading=false`, `App.js` renders the unauthenticated `<Routes>` block. The `/accept-invite` route matches → `AcceptInvitePage` renders
7. `AcceptInvitePage` calls `supabase.auth.getSession()` to check for a valid session:
   - No session → show inline error: "This invite link is invalid or has expired. Contact your admin to resend."
   - Session exists → show the wizard
8. Wizard step 1: user sets password → calls `supabase.auth.updateUser({ password })`
9. Wizard step 2: user confirms name + enters phone → calls `supabaseService.completeInviteProfile({ name, phone })`
10. On completion: dispatch `SET_PENDING_SETUP: false`, dispatch `LOGIN_SUCCESS` with updated profile, navigate to `/`

---

## Auth State Changes

### `initialState` addition
```js
pendingSetup: false
```

### New reducer case
```js
case 'SET_PENDING_SETUP':
  return { ...state, pendingSetup: action.payload, loading: false };
```

### `onAuthStateChange` SIGNED_IN handler patch
```js
// After fetching profile:
if (!profile.is_active) {
  dispatch({ type: 'SET_PENDING_SETUP', payload: true });
  // Do NOT dispatch LOGIN_SUCCESS
} else {
  dispatch({ type: 'LOGIN_SUCCESS', payload: { user, profile, session } });
}
```

### `checkAuth()` patch (initial load / page refresh)
```js
// After fetching session + profile:
if (profile && !profile.is_active) {
  dispatch({ type: 'SET_PENDING_SETUP', payload: true });
  // SET_LOADING: false is handled by the SET_PENDING_SETUP reducer case
} else if (profile) {
  dispatch({ type: 'LOGIN_SUCCESS', payload: { user, profile, session } });
} else {
  dispatch({ type: 'SET_LOADING', payload: false });
}
```

---

## Components

### New: `src/components/AcceptInvitePage.js`

Added to the **unauthenticated** `<Routes>` block in `App.js`:
```jsx
<Route path="/accept-invite" element={<AcceptInvitePage />} />
```

No changes needed to `AppContent` or the authenticated shell — the unauthenticated branch handles this correctly since `isAuthenticated=false` when `pendingSetup=true`.

**On mount, `AcceptInvitePage`:**
1. Calls `supabase.auth.getSession()` (not `useAuth().isAuthenticated`)
2. No session → show inline error message (no redirect)
3. Session exists + `profile.is_active=true` → navigate to `/` (user already completed setup)
4. Session exists + `profile.is_active=false` → show wizard

**Step 1 — Set Password**
- Password input (min 8 characters)
- Confirm password input
- Inline validation: must match, must meet min length
- "Next" button disabled until both fields are valid
- On Next: call `supabase.auth.updateUser({ password })`; advance to step 2 on success

**Step 2 — Your Details**
- Name input — pre-filled from `profile.name` (set by admin via invite), editable, required
- Phone input — empty by default, required
- "Complete Setup" button
- On submit: call `supabaseService.completeInviteProfile({ name, phone })`
- On success: dispatch `SET_PENDING_SETUP: false` + `LOGIN_SUCCESS` with updated profile → navigate to `/`
- On failure: show inline error; user can retry step 2 without re-entering password

**Progress indicator** — "Step 1 of 2" / "Step 2 of 2" above the form

**Note:** `AcceptInvitePage` reads the pre-filled name from `useAuth().profile` (which is set by the `SET_PENDING_SETUP` dispatch path that also stores the fetched profile). The profile fetch happens in `AuthContext` before `SET_PENDING_SETUP` is dispatched — add `profile` to that dispatch payload.

---

### Modified: `src/services/supabaseService.js`

Add `completeInviteProfile` (name chosen to avoid collision with existing `AuthContext.updateProfile`):

```js
async completeInviteProfile({ name, phone }) {
  const { data: { user } } = await supabase.auth.getUser();

  const profileUpdates = { name, phone, is_active: true, is_approved: true };
  const { data, error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;

  // Sync to engineers table — only include defined fields
  const engineerUpdates = { is_active: true, is_approved: true };
  if (name) engineerUpdates.name = name;
  if (phone) engineerUpdates.phone = phone;
  await supabase.from('engineers').update(engineerUpdates).eq('id', user.id);

  return data;
}
```

Note: `is_active` and `is_approved` are synced to `engineers` as well — the invite-user function sets both to `false` on that row, so we must update them here.

---

### Modified: `supabase/functions/invite-user/index.ts`

Add `redirectTo` to **both** `inviteUserByEmail` calls (new invite and resend paths):

```ts
const redirectTo = `${Deno.env.get('APP_URL')}/accept-invite`;

// New invite path:
await adminClient.auth.admin.inviteUserByEmail(email, {
  redirectTo,
  data: { name, role, location_id }
});

// Resend path:
await adminClient.auth.admin.inviteUserByEmail(existingEmail, {
  redirectTo
});
```

`APP_URL` must be set as a Supabase Edge Function secret (e.g. `http://localhost:3000` for dev, production URL for prod).

---

### Modified: `src/context/AuthContext.js`

Summary of changes:
1. Add `pendingSetup: false` to `initialState`
2. Add `SET_PENDING_SETUP` reducer case (sets `pendingSetup` + `loading: false`)
3. Update `SET_PENDING_SETUP` dispatch in `onAuthStateChange` to include `profile` in payload so `AcceptInvitePage` can read pre-filled name
4. Patch `SIGNED_IN` handler and `checkAuth()` as described in "Auth State Changes" section above

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Expired/invalid invite token | No session established → `AcceptInvitePage` shows inline error: "This invite link is invalid or has expired. Contact your admin to resend." |
| Password mismatch | Inline error under confirm field, Next button disabled |
| Password too short | Inline error, Next button disabled |
| Profile update fails (step 2) | Show inline error, let user retry — password from step 1 already saved in Supabase Auth |
| Hard refresh mid-wizard | User is at `/accept-invite`; `checkAuth()` runs, detects `is_active=false`, dispatches `SET_PENDING_SETUP: true` (no `LOGIN_SUCCESS`); `isAuthenticated=false`; unauthenticated `<Routes>` matches `/accept-invite` → wizard renders again |
| User already active visits `/accept-invite` | `AcceptInvitePage` mount check: session exists + `is_active=true` → navigate to `/` |
| Network drop between steps | Step 1 (password) persists in Supabase Auth; step 2 retryable |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/AcceptInvitePage.js` | **New** — 2-step wizard UI |
| `src/services/supabaseService.js` | Add `completeInviteProfile()` |
| `src/context/AuthContext.js` | Add `pendingSetup` state + reducer case; patch `SIGNED_IN` handler and `checkAuth()` |
| `src/App.js` | Add `/accept-invite` to unauthenticated `<Routes>` |
| `supabase/functions/invite-user/index.ts` | Add `redirectTo` (with `APP_URL` env var) to both `inviteUserByEmail` calls |

---

## Testing

- E2E (Playwright): admin invites user → user clicks link → wizard at `/accept-invite` → complete both steps → lands on dashboard → profile `is_active=true, is_approved=true`
- Hard refresh mid-wizard (after step 1): page at `/accept-invite` → wizard re-renders at step 1 (password not pre-filled for security, user re-enters) → submits → continues to step 2
- Expired token: navigate to `/accept-invite` with no session → inline error shown, no redirect
- Already-active user visits `/accept-invite` → immediate redirect to `/`
- Resend invite: resend path also uses correct `redirectTo`
