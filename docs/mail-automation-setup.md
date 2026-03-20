# Mail Automation Setup Guide — SEP

## Overview

The automation system has two email flows:

| Flow | Direction | Purpose |
|------|-----------|---------|
| **Email → Case** | Inbound | Client sends email → case auto-created |
| **Form → Email → Case** | Outbound then inbound | Client fills `/client-request` form → email sent to inbound address → case auto-created |

The edge functions are already deployed. This guide covers external service configuration only.

**Edge function URLs:**
- Inbound webhook: `https://vrwmijknkujmmjwiedks.supabase.co/functions/v1/parse-email-case`
- Form submission: `https://vrwmijknkujmmjwiedks.supabase.co/functions/v1/submit-client-request`

---

## Part 1 — Inbound Email (Email → Case)

Any provider that can POST to a webhook URL works with no code changes.

### Option A: Brevo (recommended — 300/day free forever)

1. Sign up at **brevo.com**
2. Go to **Transactional** → **Inbound Parsing**
3. Add your inbound domain (e.g. `inbound.yourdomain.com`)
4. Set the webhook URL:
   ```
   https://vrwmijknkujmmjwiedks.supabase.co/functions/v1/parse-email-case
   ```
5. Your inbound address will be: `anything@inbound.yourdomain.com`

### Option B: Mailgun (1,000/mo for 3 months)

1. Sign up at **mailgun.com** → add your domain
2. Go to **Send** → **Receiving** → **Create Route**
3. Filter: **Catch All**
4. Action: **Forward** →
   ```
   https://vrwmijknkujmmjwiedks.supabase.co/functions/v1/parse-email-case
   ```
5. Your inbound address will be: `cases@mg.yourdomain.com`

### Option C: Postmark (100/mo free forever)

1. Sign up at **postmarkapp.com** → create a Server
2. Go to **Inbound** tab → enable inbound
3. Set the webhook URL:
   ```
   https://vrwmijknkujmmjwiedks.supabase.co/functions/v1/parse-email-case
   ```
4. Your inbound address will be: `<hash>@inbound.postmarkapp.com`

### Option D: Cloudflare Email Workers (free forever, requires domain on Cloudflare)

1. Go to **Cloudflare Dashboard** → your domain → **Email** → **Email Routing**
2. Enable Email Routing
3. Go to **Email Workers** → create a worker:
   ```js
   export default {
     async email(message, env) {
       const body = new FormData();
       body.append('from', message.from);
       body.append('subject', message.headers.get('subject') || '');
       // forward to edge function
       await fetch('https://vrwmijknkujmmjwiedks.supabase.co/functions/v1/parse-email-case', {
         method: 'POST',
         body,
       });
     }
   }
   ```
4. Route all inbound email to this worker

### Option E: Self-Hosted — Postal

Full mail server with REST API and built-in webhooks. Best for no external dependencies.

```bash
git clone https://github.com/postalserver/postal
cd postal
docker-compose up -d
```

- Go to Postal dashboard → **Incoming Routes** → set webhook to the edge function URL above
- Postal sends Mailgun-compatible multipart form-data — works with `parse-email-case` as-is

---

## Part 2 — Configure the Automation Tab

After setting up your email provider:

1. Open the app → **Automation** tab (admin login required)
2. Under **Email Automation**:
   - **Inbound Email Address** — paste the address from your provider (e.g. `cases@mg.yourdomain.com`)
   - **Allowed Senders** — add trusted emails or domains (e.g. `@hospital.com`). Leave empty to accept all
   - **Default Priority** — case priority when not specified in the email
3. Click **Save Email Settings**

---

## Part 3 — Outbound Email (Client Request Form)

The `/client-request` public form emails submissions to your inbound address, which then auto-creates a case.

### Option A: Resend (100/day free)

1. Sign up at **resend.com** → **API Keys** → create a key
2. Set the Supabase secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_key_here
   ```
   Or via dashboard: **Supabase** → **Project Settings** → **Edge Functions** → **Secrets**

No code changes needed — the edge function already uses Resend.

### Option B: Brevo (300/day free — same account as inbound)

1. Sign up at **brevo.com** → **SMTP & API** → **API Keys** → create key
2. Set the secret:
   ```bash
   supabase secrets set BREVO_API_KEY=xkeysib-your_key_here
   ```
3. Edit `supabase/functions/submit-client-request/index.ts` — replace the Resend fetch block:

```typescript
const resendResp = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'api-key': Deno.env.get('BREVO_API_KEY')!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sender: { name: 'SEP Laser', email: 'noreply@yourdomain.com' },
    to: [{ email: inboundEmail }],
    subject: `[SEP Request] ${hospital}`,
    textContent: emailBody,
  }),
});
```

4. Redeploy:
   ```bash
   supabase functions deploy submit-client-request --no-verify-jwt
   ```

### Option C: SendGrid (100/day free forever)

1. Sign up at **sendgrid.com** → **API Keys** → create key
2. Set the secret:
   ```bash
   supabase secrets set SENDGRID_API_KEY=SG.your_key_here
   ```
3. Edit `supabase/functions/submit-client-request/index.ts` — replace the Resend fetch block:

```typescript
const resendResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: inboundEmail }] }],
    from: { email: 'noreply@yourdomain.com' },
    subject: `[SEP Request] ${hospital}`,
    content: [{ type: 'text/plain', value: emailBody }],
  }),
});
```

4. Redeploy:
   ```bash
   supabase functions deploy submit-client-request --no-verify-jwt
   ```

---

## Part 4 — Email Format for Clients

Share this template with clients who prefer to email directly instead of using the form. The parser reads the labelled fields to populate the case.

```
To: cases@yourdomain.com
Subject: [SEP Request] City Hospital

Hospital: City Hospital
Location: Bangalore
Address: 123 MG Road, Indiranagar
Date: 25/03/2026
Time: 10:00

Please describe the laser service request in detail here.

---
Contact: Dr. Name
Phone: 98765 43210
```

The email template is also available in the app — **Automation** tab → **Client Request Form** → copy button.

### How fields map to cases

| Email field | Case field | Notes |
|-------------|-----------|-------|
| Subject (after `[SEP Request]`) | Title | Prefix stripped automatically |
| `Hospital:` | Client | Matched by name — must exist in Clients |
| `Location:` | Location | Fuzzy matched — must exist in Locations |
| `Date:` | Scheduled start | Parsed as date |
| Body text | Description | Everything after the labelled fields |

> If `Hospital:` or `Location:` don't match an existing record, the case is still created — just without a linked client or location. Add the client first for clean linking.

---

## Part 5 — WhatsApp Notifications

1. **Automation** tab → **WhatsApp Notifications**
2. Set **Recipient WhatsApp Number** in international format: `+919876543210`
3. Toggle on: **Case Created**, **Schedule Added**, **Case Completed**
4. Click **Edit Template** to customise each message
5. Click **Save WhatsApp Settings**

When a trigger fires, WhatsApp opens pre-filled with the message and pre-addressed to your number — one tap to send.

**Available template variables:**

| Variable | Value |
|----------|-------|
| `{{client}}` | Hospital / client name |
| `{{location}}` | Location name |
| `{{engineer}}` | Assigned engineer name |
| `{{date}}` | Date of event |
| `{{priority}}` | Case priority |
| `{{status}}` | Case status |
| `{{embryologist}}` | Embryologist name (case completion) |

---

## Part 6 — Client Request Form

Share the public form link with clients — no login required.

- **Direct link:** `https://yourdomain.com/client-request`
- **QR code:** available in **Automation** tab → **Client Request Form**
- **WhatsApp share:** button in the same section sends the link to your configured number

The form collects: Hospital, Location, Address, Contact, Phone, Description, Preferred Date, Preferred Time.

---

## Recommended Setup by Situation

| Situation | Inbound | Outbound |
|-----------|---------|----------|
| Just starting out | **Brevo** | **Brevo** (same account) |
| Domain on Cloudflare | **CF Email Workers** | **Resend** |
| Want zero dependencies | **Postal** (self-hosted) | **Postal** (self-hosted) |
| Low volume, permanent free | **Postmark** | **SendGrid** |

**Simplest full-free setup:** Brevo for both — 300 emails/day, one account, no credit card, no expiry.

---

## Testing

### Test inbound email parsing

Send a test email from an allowed sender to your inbound address using the format in Part 4. Then:

1. **Automation** tab → **Automation Log** — should show a `created` entry
2. **Cases** tab — a new case should appear

### Test the client request form

1. Open `https://yourdomain.com/client-request` (no login)
2. Fill in all required fields and submit
3. **Automation Log** → should show a `form_submission` entry
4. Check your inbound email for the forwarded email
5. That email triggers the inbound webhook → case created

### Test sender rejection

Send from an address not in your Allowed Senders list. The Automation Log should show `rejected` — no case created.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No log entry after sending email | Webhook URL is wrong in your email provider — verify it matches the edge function URL above |
| Log shows `failed` | Check **Supabase** → **Edge Functions** → **parse-email-case** → **Logs** for the error |
| Form returns 503 | `Inbound Email Address` is empty in the Automation tab — set it first |
| Form returns 500 | `RESEND_API_KEY` (or equivalent) secret not set, or Resend domain not verified |
| Case created but no client linked | Hospital name in email doesn't exactly match a client record — create the client first or check spelling |
| Case created but no location linked | Location name partial match failed — check the location exists in the Locations tab |
| WhatsApp opens wrong number | Check the number saved in Automation → WhatsApp Notifications → Recipient Number |
| Email provider keeps retrying | The function returned a non-200 on rejection — this is fixed, rejected emails always return 200 |
