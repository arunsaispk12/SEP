# Automation Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only Automation tab that configures email-to-case parsing, WhatsApp notification triggers, and a public shareable client request form.

**Architecture:** Three UI sections in `AutomationPanel.js` backed by a singleton `automation_config` Supabase table. Two new Edge Functions handle inbound email parsing and outbound form-submission email. A public `/client-request` route provides a branded form for clients.

**Tech Stack:** React, Supabase (Postgres + Edge Functions), Resend API (outbound email), `qrcode` npm package (QR generation), Playwright (E2E verification)

**Spec:** `docs/superpowers/specs/2026-03-20-automation-tab-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/database/schema.sql` | Modify | Add `automation_config` + `automation_logs` tables, RLS, seed |
| `src/context/EngineerContext.js` | Modify | Add `automationConfig` state, reducer case, `loadAutomationConfig`, `saveAutomationConfig` |
| `src/components/AutomationPanel.js` | Create | 3-section admin UI: email config, WhatsApp triggers, client form link |
| `src/components/ClientRequestForm.js` | Create | Public form at `/client-request` — no auth |
| `src/App.js` | Modify | Add `automation` tab (admin only), `/client-request` public route |
| `src/components/CaseManager.js` | Modify | WhatsApp trigger after `addCase` success |
| `src/components/CaseCompletionModal.js` | Modify | Use configured WhatsApp template when trigger is on |
| `supabase/functions/parse-email-case/index.ts` | Create | Inbound email parser — called by Mailgun/Postmark webhook |
| `supabase/functions/submit-client-request/index.ts` | Create | Form submission → outbound email via Resend |
| `src/index.css` | Modify | Styles for AutomationPanel and ClientRequestForm |

---

## Task 1: Database Schema

**Files:**
- Modify: `src/database/schema.sql`

- [ ] **Step 1: Add automation_config and automation_logs to schema.sql**

Append to the end of `src/database/schema.sql`:

```sql
-- ============================================================
-- Automation Config (singleton row, id always = 1)
-- ============================================================
create table if not exists public.automation_config (
  id integer primary key default 1 check (id = 1),
  inbound_email text default '',
  allowed_senders text[] default '{}',
  default_priority text default 'medium',
  whatsapp_triggers jsonb default '{"case_created":false,"schedule_added":false,"case_completed":false}',
  whatsapp_templates jsonb default '{"case_created":"🆕 *New Case*\n🏥 {{client}}\n📍 {{location}}\n⚡ Priority: {{priority}}\n\n_via SEP_","schedule_added":"📅 *Schedule Added*\n👨‍🔧 {{engineer}}\n📍 {{location}}\n🗓 {{date}}\n\n_via SEP_","case_completed":"✅ *Case Completed*\n🏥 {{client}}\n📍 {{location}}\n📅 {{date}}\n👨‍🔬 Embryologist: {{embryologist}}\n\n_via SEP_"}',
  updated_at timestamptz default now()
);

insert into public.automation_config (id) values (1) on conflict do nothing;

alter table public.automation_config enable row level security;

drop policy if exists "admins_read_automation_config" on public.automation_config;
drop policy if exists "admins_update_automation_config" on public.automation_config;

create policy "admins_read_automation_config" on public.automation_config
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "admins_update_automation_config" on public.automation_config
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- Automation Logs
-- ============================================================
create table if not exists public.automation_logs (
  id bigserial primary key,
  type text not null,
  source text,
  payload jsonb,
  result text,
  error text,
  created_at timestamptz default now()
);

alter table public.automation_logs enable row level security;

drop policy if exists "admins_read_automation_logs" on public.automation_logs;

create policy "admins_read_automation_logs" on public.automation_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Run this SQL in the Supabase dashboard SQL editor or via MCP:
```
mcp__supabase__execute_sql with the SQL above
```
Expected: tables created with no errors.

- [ ] **Step 3: Verify singleton row exists**

```sql
select * from public.automation_config;
```
Expected: one row with `id = 1`, default values.

- [ ] **Step 4: Commit**

```bash
git add src/database/schema.sql
git commit -m "feat: add automation_config and automation_logs tables"
```

---

## Task 2: EngineerContext Additions

**Files:**
- Modify: `src/context/EngineerContext.js`

- [ ] **Step 1: Add `automationConfig: null` to `initialState`**

In `initialState` object, add:
```js
automationConfig: null,
```

- [ ] **Step 2: Add `SET_AUTOMATION_CONFIG` reducer case**

In `engineerReducer` switch, before `default:`:
```js
case 'SET_AUTOMATION_CONFIG':
  return { ...state, automationConfig: action.payload };
```

- [ ] **Step 3: Add `loadAutomationConfig` and `saveAutomationConfig` callbacks**

Add after the existing `loadData` useCallback (around line 280):
```js
const loadAutomationConfig = useCallback(async () => {
  if (!isSupabaseConfigured()) return;
  try {
    const { data, error } = await supabase
      .from('automation_config')
      .select('*')
      .eq('id', 1)
      .single();
    if (!error && data) {
      dispatch({ type: 'SET_AUTOMATION_CONFIG', payload: data });
    }
  } catch (err) {
    console.error('Failed to load automation config:', err);
  }
}, []);

const saveAutomationConfig = useCallback(async (updates) => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('automation_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  dispatch({ type: 'SET_AUTOMATION_CONFIG', payload: data });
  return data;
}, []);
```

- [ ] **Step 4: Expose in context value**

In the large `useMemo` context value object (near end of file), add:
```js
automationConfig: state.automationConfig,
loadAutomationConfig,
saveAutomationConfig,
```

- [ ] **Step 5: Build check**

```bash
npm run build --silent
```
Expected: `Compiled successfully.`

- [ ] **Step 6: Commit**

```bash
git add src/context/EngineerContext.js
git commit -m "feat: add automationConfig state and callbacks to EngineerContext"
```

---

## Task 3: AutomationPanel — Email Section

**Files:**
- Create: `src/components/AutomationPanel.js`

- [ ] **Step 1: Create AutomationPanel with Email Automation section**

Create `src/components/AutomationPanel.js`:

```jsx
import React, { useEffect, useState } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { Copy, Check, Plus, X, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

// ── Utility ──────────────────────────────────────────────────────────────────
const WEBHOOK_URL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/parse-email-case`;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={styles.copyBtn} title="Copy">
      {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
    </button>
  );
}

// ── Email Section ─────────────────────────────────────────────────────────────
function EmailSection({ config, onSave }) {
  const [inboundEmail, setInboundEmail] = useState(config?.inbound_email || '');
  const [allowedSenders, setAllowedSenders] = useState(config?.allowed_senders || []);
  const [newSender, setNewSender] = useState('');
  const [defaultPriority, setDefaultPriority] = useState(config?.default_priority || 'medium');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setInboundEmail(config.inbound_email || '');
      setAllowedSenders(config.allowed_senders || []);
      setDefaultPriority(config.default_priority || 'medium');
    }
  }, [config]);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('type', 'email_case')
        .order('created_at', { ascending: false })
        .limit(20);
      setLogs(data || []);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleAddSender = () => {
    const trimmed = newSender.trim();
    if (!trimmed || allowedSenders.includes(trimmed)) return;
    setAllowedSenders(prev => [...prev, trimmed]);
    setNewSender('');
  };

  const handleRemoveSender = (s) => setAllowedSenders(prev => prev.filter(x => x !== s));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ inbound_email: inboundEmail, allowed_senders: allowedSenders, default_priority: defaultPriority });
      toast.success('Email settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>📧 Email Automation</h2>
      <p style={styles.sectionDesc}>Configure an inbound email webhook to auto-create cases from client emails.</p>

      <div style={styles.field}>
        <label style={styles.label}>Webhook URL</label>
        <div style={styles.copyRow}>
          <input readOnly value={WEBHOOK_URL} style={{ ...styles.input, color: '#94a3b8', fontSize: 13 }} />
          <CopyButton text={WEBHOOK_URL} />
        </div>
        <p style={styles.hint}>Paste this URL into Mailgun or Postmark as the inbound parse webhook.</p>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Inbound Email Address</label>
        <div style={styles.copyRow}>
          <input
            value={inboundEmail}
            onChange={e => setInboundEmail(e.target.value)}
            placeholder="cases@mg.yourdomain.com"
            style={styles.input}
          />
          <CopyButton text={inboundEmail} />
        </div>
        <p style={styles.hint}>The email address clients send requests to. Comes from your Mailgun/Postmark setup.</p>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Allowed Senders</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={newSender}
            onChange={e => setNewSender(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSender()}
            placeholder="email@domain.com or @domain.com"
            style={{ ...styles.input, flex: 1 }}
          />
          <button onClick={handleAddSender} style={styles.addBtn}><Plus size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allowedSenders.map(s => (
            <span key={s} style={styles.tag}>
              {s}
              <button onClick={() => handleRemoveSender(s)} style={styles.tagRemove}><X size={12} /></button>
            </span>
          ))}
        </div>
        <p style={styles.hint}>Only emails from these addresses/domains will create cases. Leave empty to allow all.</p>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Default Priority</label>
        <select value={defaultPriority} onChange={e => setDefaultPriority(e.target.value)} style={styles.select}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
        {saving ? 'Saving…' : 'Save Email Settings'}
      </button>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={styles.subTitle}>Automation Log</h3>
          <button onClick={loadLogs} style={styles.iconBtn} title="Refresh"><RefreshCw size={15} /></button>
        </div>
        {logsLoading ? <p style={styles.hint}>Loading…</p> : (
          <div style={styles.logTable}>
            {logs.length === 0 ? <p style={styles.hint}>No email cases yet.</p> : logs.map(log => (
              <div key={log.id} style={styles.logRow}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</span>
                <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{log.source}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                  background: log.result === 'created' ? 'rgba(34,197,94,0.1)' : log.result === 'rejected' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                  color: log.result === 'created' ? '#4ade80' : log.result === 'rejected' ? '#fbbf24' : '#f87171'
                }}>{log.result}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { EmailSection };
export default function AutomationPanel() {
  const { automationConfig, loadAutomationConfig, saveAutomationConfig } = useEngineerContext();

  useEffect(() => { loadAutomationConfig(); }, [loadAutomationConfig]);

  return (
    <div style={{ padding: 24, color: '#f1f5f9' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px', background: 'linear-gradient(135deg,#fff,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Automation
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Configure automated workflows for cases, schedules, and notifications</p>
      </div>

      <EmailSection config={automationConfig} onSave={saveAutomationConfig} />
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const styles = {
  section: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 24 },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  sectionDesc: { color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 24px' },
  subTitle: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 },
  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  input: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  copyRow: { display: 'flex', gap: 8, alignItems: 'center' },
  copyBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px', color: '#94a3b8', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' },
  hint: { color: '#64748b', fontSize: 12, margin: '6px 0 0' },
  addBtn: { background: 'rgba(123,97,255,0.2)', border: '1px solid rgba(123,97,255,0.3)', borderRadius: 10, padding: '10px 14px', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  tag: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(123,97,255,0.1)', border: '1px solid rgba(123,97,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#c4b5fd' },
  tagRemove: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  saveBtn: { background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
  logTable: { display: 'flex', flexDirection: 'column', gap: 8 },
  logRow: { display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' },
};
```

- [ ] **Step 2: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 3: Commit**

```bash
git add src/components/AutomationPanel.js
git commit -m "feat: add AutomationPanel with email automation section"
```

---

## Task 4: AutomationPanel — WhatsApp Section

**Files:**
- Modify: `src/components/AutomationPanel.js`

- [ ] **Step 1: Add WhatsApp section component**

Add before the `export default function AutomationPanel()` line:

```jsx
const SAMPLE_VARS = { client: 'City Hospital', location: 'Bangalore', engineer: 'Kavin', date: '20/03/2026', priority: 'high', status: 'open', embryologist: 'Dr. Ravi' };

function applyTemplate(template, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{{${k}}}`, v), template || '');
}

const DEFAULT_TEMPLATES = {
  case_created: '🆕 *New Case*\n🏥 {{client}}\n📍 {{location}}\n⚡ Priority: {{priority}}\n\n_via SEP_',
  schedule_added: '📅 *Schedule Added*\n👨‍🔧 {{engineer}}\n📍 {{location}}\n🗓 {{date}}\n\n_via SEP_',
  case_completed: '✅ *Case Completed*\n🏥 {{client}}\n📍 {{location}}\n📅 {{date}}\n👨‍🔬 Embryologist: {{embryologist}}\n\n_via SEP_',
};

const TRIGGER_LABELS = {
  case_created: { label: 'Case Created', icon: '🆕' },
  schedule_added: { label: 'Schedule Added', icon: '📅' },
  case_completed: { label: 'Case Completed', icon: '✅' },
};

function WhatsAppSection({ config, onSave }) {
  const triggers = config?.whatsapp_triggers || { case_created: false, schedule_added: false, case_completed: false };
  const templates = config?.whatsapp_templates || DEFAULT_TEMPLATES;

  const [localTriggers, setLocalTriggers] = useState(triggers);
  const [localTemplates, setLocalTemplates] = useState({ ...DEFAULT_TEMPLATES, ...templates });
  const [editingKey, setEditingKey] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalTriggers(config.whatsapp_triggers || { case_created: false, schedule_added: false, case_completed: false });
      setLocalTemplates({ ...DEFAULT_TEMPLATES, ...(config.whatsapp_templates || {}) });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ whatsapp_triggers: localTriggers, whatsapp_templates: localTemplates });
      toast.success('WhatsApp settings saved');
      setEditingKey(null);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>💬 WhatsApp Notifications</h2>
      <p style={styles.sectionDesc}>Auto-prompt WhatsApp shares when key events occur. Uses your device's WhatsApp — one tap to send.</p>

      {Object.keys(TRIGGER_LABELS).map(key => (
        <div key={key} style={{ marginBottom: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingKey === key ? 16 : 0 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>
              {TRIGGER_LABELS[key].icon} {TRIGGER_LABELS[key].label}
            </span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => setEditingKey(editingKey === key ? null : key)}
                style={{ ...styles.iconBtn, color: '#a78bfa', fontSize: 13, padding: '4px 10px', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8 }}
              >
                {editingKey === key ? 'Close' : 'Edit Template'}
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={localTriggers[key] || false}
                  onChange={e => setLocalTriggers(prev => ({ ...prev, [key]: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#7B61FF', cursor: 'pointer' }}
                />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{localTriggers[key] ? 'On' : 'Off'}</span>
              </label>
            </div>
          </div>

          {editingKey === key && (
            <div>
              <textarea
                value={localTemplates[key]}
                onChange={e => setLocalTemplates(prev => ({ ...prev, [key]: e.target.value }))}
                rows={5}
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13, resize: 'vertical', marginBottom: 12 }}
              />
              <p style={styles.hint}>Variables: {'{{client}} {{location}} {{engineer}} {{date}} {{priority}} {{status}} {{embryologist}}'}</p>
              <div style={{ marginTop: 12, background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 10, padding: 14 }}>
                <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 8px' }}>Preview</p>
                <pre style={{ color: '#e2e8f0', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {applyTemplate(localTemplates[key], SAMPLE_VARS)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
        {saving ? 'Saving…' : 'Save WhatsApp Settings'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add WhatsAppSection to AutomationPanel render**

In the `AutomationPanel` return JSX, after `<EmailSection .../>`:
```jsx
<WhatsAppSection config={automationConfig} onSave={saveAutomationConfig} />
```

- [ ] **Step 3: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 4: Commit**

```bash
git add src/components/AutomationPanel.js
git commit -m "feat: add WhatsApp notifications section to AutomationPanel"
```

---

## Task 5: AutomationPanel — Client Request Form Section

**Files:**
- Modify: `src/components/AutomationPanel.js`

- [ ] **Step 1: Install qrcode package**

```bash
npm install qrcode
```

Expected: package added to `node_modules` and `package.json`.

- [ ] **Step 2: Add ClientFormSection component**

Add import at top of `AutomationPanel.js`:
```js
import QRCode from 'qrcode';
```

Add the component before `export default function AutomationPanel()`:

```jsx
function ClientFormSection({ config }) {
  const formUrl = `${window.location.origin}/client-request`;
  const inboundEmail = config?.inbound_email || '';
  const [qrSrc, setQrSrc] = useState('');
  const [templateCopied, setTemplateCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(formUrl, { width: 160, margin: 1, color: { dark: '#ffffff', light: '#00000000' } })
      .then(url => setQrSrc(url))
      .catch(() => {});
  }, [formUrl]);

  const emailTemplate = `To: ${inboundEmail || 'cases@yourdomain.com'}
Subject: [SEP Request] Your Hospital Name

Hospital: City Hospital
Location: Bangalore
Priority: medium
Date: DD/MM/YYYY

Please describe the service request in detail here.

---
Contact: Dr. Name
Phone: 98765 43210`;

  const copyTemplate = () => {
    navigator.clipboard.writeText(emailTemplate);
    setTemplateCopied(true);
    setTimeout(() => setTemplateCopied(false), 2000);
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>🔗 Client Request Form</h2>
      <p style={styles.sectionDesc}>Share this link or QR code with clients. Submissions auto-create cases via the email pipeline.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={styles.field}>
            <label style={styles.label}>Shareable Link</label>
            <div style={styles.copyRow}>
              <input readOnly value={formUrl} style={{ ...styles.input, fontSize: 13 }} />
              <CopyButton text={formUrl} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Use this link to submit a service request: ${formUrl}`)}`, '_blank')}
              style={{ ...styles.saveBtn, background: 'linear-gradient(135deg,#128c7e,#25d366)', fontSize: 13, padding: '9px 18px' }}
            >
              💬 Share via WhatsApp
            </button>
          </div>
        </div>

        {qrSrc && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <img src={qrSrc} alt="QR Code" style={{ width: 128, height: 128 }} />
            <p style={{ color: '#64748b', fontSize: 11, margin: '8px 0 0' }}>Scan to open form</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={styles.label}>Email Template for Clients</label>
          <button onClick={copyTemplate} style={{ ...styles.copyBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}>
            {templateCopied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
            {templateCopied ? 'Copied!' : 'Copy Template'}
          </button>
        </div>
        <pre style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, color: '#94a3b8', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {emailTemplate}
        </pre>
        <p style={styles.hint}>Share this template with clients who prefer email. Emails matching this format are auto-parsed.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add ClientFormSection to AutomationPanel render**

After `<WhatsAppSection .../>`:
```jsx
<ClientFormSection config={automationConfig} />
```

- [ ] **Step 4: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 5: Commit**

```bash
git add src/components/AutomationPanel.js package.json package-lock.json
git commit -m "feat: add client request form section with QR code and email template"
```

---

## Task 6: ClientRequestForm (Public Page)

**Files:**
- Create: `src/components/ClientRequestForm.js`

- [ ] **Step 1: Create the public client request form**

Create `src/components/ClientRequestForm.js`:

```jsx
import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const ClientRequestForm = () => {
  const [form, setForm] = useState({
    hospital: '', contact: '', phone: '', description: '', preferredDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-client-request', {
        body: form
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.screen}>
      <Toaster position="top-center" />
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>⚙️</div>
          <h1 style={s.title}>Service Request</h1>
          <p style={s.subtitle}>Submit a service request and our team will get back to you shortly.</p>
        </div>

        {submitted ? (
          <div style={s.success}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2 style={{ color: '#4ade80', margin: '16px 0 8px' }}>Request Submitted</h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>We'll be in touch soon. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {[
              { name: 'hospital', label: 'Hospital / Clinic Name', type: 'text', placeholder: 'City IVF Centre', required: true },
              { name: 'contact', label: 'Contact Person', type: 'text', placeholder: 'Dr. Name', required: true },
              { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', required: true },
            ].map(f => (
              <div key={f.name} style={s.field}>
                <label style={s.label}>{f.label} {f.required && <span style={{ color: '#f87171' }}>*</span>}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required={f.required}
                  style={s.input}
                />
              </div>
            ))}

            <div style={s.field}>
              <label style={s.label}>Request Description <span style={{ color: '#f87171' }}>*</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the service needed..."
                required
                rows={4}
                style={{ ...s.input, resize: 'vertical' }}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Preferred Date <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="date"
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                style={s.input}
              />
            </div>

            <button type="submit" disabled={submitting} style={s.btn}>
              {submitting ? 'Submitting…' : 'Submit Request →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const s = {
  screen: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 480 },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: { fontSize: 40, marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  input: { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 13, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  success: { textAlign: 'center', padding: '20px 0' },
};

export default ClientRequestForm;
```

- [ ] **Step 2: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 3: Commit**

```bash
git add src/components/ClientRequestForm.js
git commit -m "feat: add public ClientRequestForm component"
```

---

## Task 7: App.js Wiring

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Import new components**

In `src/App.js`, add imports:
```js
import AutomationPanel from './components/AutomationPanel';
import ClientRequestForm from './components/ClientRequestForm';
```

- [ ] **Step 2: Add `/client-request` public route**

In the unauthenticated `<Routes>` block, **before** `<Route path="*" element={<LoginPage />} />`:
```jsx
<Route path="/client-request" element={<ClientRequestForm />} />
```
Final order must be:
```jsx
<Route path="/signup" element={<SignupPage />} />
<Route path="/accept-invite" element={<AcceptInvitePage />} />
<Route path="/client-request" element={<ClientRequestForm />} />
<Route path="*" element={<LoginPage />} />
```

- [ ] **Step 3: Add automation tab for admin**

In `getTabsForUser()`, in the `profile.role === 'admin'` array, add:
```js
{ id: 'automation', label: 'Automation', icon: '⚡' },
```
Place it after the `sync` entry.

- [ ] **Step 4: Add tab render**

In the `AnimatePresence` content block, add alongside other tab renders:
```jsx
{activeTab === 'automation' && <AutomationPanel />}
```

- [ ] **Step 5: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 6: Verify via Playwright**

```bash
node -e "
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  await p.goto('http://localhost:3000/client-request', {waitUntil:'networkidle'});
  const t = await p.locator('body').innerText();
  console.log('Client form visible:', t.includes('Service Request'));
  await b.close();
})();
"
```
Expected: `Client form visible: true`

- [ ] **Step 7: Commit**

```bash
git add src/App.js
git commit -m "feat: wire automation tab and /client-request route in App.js"
```

---

## Task 8: CaseManager WhatsApp Trigger

**Files:**
- Modify: `src/components/CaseManager.js`

- [ ] **Step 1: Pull automationConfig and engineers from context**

In `CaseManager`, add `automationConfig` and `engineers` to the destructured context:
```js
const {
  cases, engineers, clients, addClient, addCase, updateCase,
  getEngineerById, locationObjects, checkLocationConflict,
  checkScheduleOverlap, isEngineerOnLeave, automationConfig
} = useEngineerContext();
```
(`engineers` is already destructured — verify it's there; `automationConfig` is the new addition.)

- [ ] **Step 2: Add WhatsApp trigger after addCase in handleSubmit**

In `handleSubmit`, after `await addCase(caseData)` and `toast.success(...)`, before `resetForm()`:

```js
// WhatsApp trigger
const waTrigger = automationConfig?.whatsapp_triggers?.case_created;
const waTemplate = automationConfig?.whatsapp_templates?.case_created;
if (waTrigger && waTemplate) {
  const assignedEngineer = engineers.find(e => e.id === formData.assignedEngineer);
  const msg = waTemplate
    .replace('{{client}}', formData.clientName || '')
    .replace('{{location}}', formData.location || '')
    .replace('{{engineer}}', assignedEngineer?.name || 'Unassigned')
    .replace('{{date}}', new Date().toLocaleDateString('en-IN'))
    .replace('{{priority}}', formData.priority || 'medium')
    .replace('{{status}}', 'open');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
```

- [ ] **Step 3: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 4: Commit**

```bash
git add src/components/CaseManager.js
git commit -m "feat: add WhatsApp trigger on case creation"
```

---

## Task 9: CaseCompletionModal Template Integration

**Files:**
- Modify: `src/components/CaseCompletionModal.js`

- [ ] **Step 1: Accept automationConfig prop**

The modal is rendered in `CaseManager`. Pass `automationConfig` as a prop:

In `CaseManager.js`, update the `CaseCompletionModal` render:
```jsx
<CaseCompletionModal
  caseData={completingCase}
  automationConfig={automationConfig}
  onClose={() => { setShowCompletionModal(false); setCompletingCase(null); }}
  onSave={handleCaseCompletion}
/>
```

In `CaseCompletionModal.js`, accept the prop:
```js
const CaseCompletionModal = ({ caseData, onClose, onSave, automationConfig }) => {
```

- [ ] **Step 2: Replace hardcoded WhatsApp message with configured template**

Replace the existing `handleWhatsApp` function:
```js
const handleWhatsApp = () => {
  const configTemplate = automationConfig?.whatsapp_triggers?.case_completed
    ? automationConfig?.whatsapp_templates?.case_completed
    : null;

  let text;
  if (configTemplate) {
    text = configTemplate
      .replace('{{client}}', formData.clientName || '')
      .replace('{{location}}', formData.location || '')
      .replace('{{date}}', formData.date || '')
      .replace('{{embryologist}}', formData.embryologistName || '');
  } else {
    text = buildTextReport(); // fallback to existing format
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
};
```

- [ ] **Step 3: Build check**

```bash
npm run build --silent 2>&1 | tail -5
```
Expected: `Compiled successfully.`

- [ ] **Step 4: Commit**

```bash
git add src/components/CaseCompletionModal.js src/components/CaseManager.js
git commit -m "feat: use configured WhatsApp template in CaseCompletionModal"
```

---

## Task 10: Edge Function — parse-email-case

**Files:**
- Create: `supabase/functions/parse-email-case/index.ts`

- [ ] **Step 1: Create the edge function**

Create `supabase/functions/parse-email-case/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Parse email payload (supports Mailgun form-data and Postmark JSON)
    let sender = '', subject = '', bodyPlain = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json();
      sender = json.From || json.from || '';
      subject = json.Subject || json.subject || '';
      bodyPlain = json.TextBody || json.body_plain || json.text || '';
    } else {
      const formData = await req.formData();
      sender = formData.get('sender') as string || formData.get('from') as string || '';
      subject = formData.get('subject') as string || '';
      bodyPlain = formData.get('body-plain') as string || formData.get('stripped-text') as string || '';
    }

    // Fetch config
    const { data: config } = await adminClient
      .from('automation_config').select('*').eq('id', 1).single();

    // Check allowed senders
    const allowed: string[] = config?.allowed_senders || [];
    if (allowed.length > 0) {
      const senderLower = sender.toLowerCase();
      const isAllowed = allowed.some(rule =>
        rule.startsWith('@')
          ? senderLower.endsWith(rule.toLowerCase())
          : senderLower === rule.toLowerCase()
      );
      if (!isAllowed) {
        await adminClient.from('automation_logs').insert({
          type: 'email_case', source: sender, result: 'rejected',
          payload: { subject }, error: 'Sender not in allowlist'
        });
        return new Response(JSON.stringify({ ok: true, result: 'rejected' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Parse body fields
    const getField = (body: string, field: string) => {
      const regex = new RegExp(`^${field}:\\s*(.+)$`, 'mi');
      return body.match(regex)?.[1]?.trim() || null;
    };

    const hospitalName = getField(bodyPlain, 'Hospital');
    const locationName = getField(bodyPlain, 'Location');
    const priorityRaw = getField(bodyPlain, 'Priority');
    const dateRaw = getField(bodyPlain, 'Date');
    const caseTitle = subject.replace(/^\[SEP Request\]\s*/i, '').trim() || 'New Service Request';

    // Resolve client_id
    let client_id = null;
    if (hospitalName) {
      const { data: client } = await adminClient
        .from('clients').select('id').ilike('name', hospitalName).limit(1).single();
      client_id = client?.id || null;
    }

    // Resolve location_id
    let location_id = null;
    if (locationName) {
      const { data: loc } = await adminClient
        .from('locations').select('id').ilike('name', `%${locationName}%`).limit(1).single();
      location_id = loc?.id || null;
    }

    const priority = ['low', 'medium', 'high'].includes(priorityRaw?.toLowerCase() || '')
      ? priorityRaw!.toLowerCase()
      : (config?.default_priority || 'medium');

    // Insert case
    const { data: newCase, error: caseError } = await adminClient
      .from('cases')
      .insert({
        title: caseTitle,
        description: bodyPlain,
        client_id,
        location_id,
        priority,
        status: 'open',
        scheduled_start: dateRaw ? new Date(dateRaw).toISOString() : null,
        created_by: null,
      })
      .select().single();

    if (caseError) throw caseError;

    await adminClient.from('automation_logs').insert({
      type: 'email_case', source: sender, result: 'created',
      payload: { subject, case_id: newCase.id }
    });

    return new Response(JSON.stringify({ ok: true, case_id: newCase.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('parse-email-case error:', err);
    await adminClient.from('automation_logs').insert({
      type: 'email_case', result: 'failed', error: err.message
    }).catch(() => {});
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

- [ ] **Step 2: Deploy edge function**

```bash
supabase functions deploy parse-email-case --no-verify-jwt
```
Expected: `Deployed parse-email-case`

`--no-verify-jwt` because this is called by Mailgun/Postmark, not a user browser.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/parse-email-case/index.ts
git commit -m "feat: add parse-email-case edge function"
```

---

## Task 11: Edge Function — submit-client-request

**Files:**
- Create: `supabase/functions/submit-client-request/index.ts`

- [ ] **Step 1: Set Resend API key as Supabase secret**

```bash
supabase secrets set RESEND_API_KEY=<your-resend-api-key>
```

Get the key from https://resend.com (free tier supports 100 emails/day).

- [ ] **Step 2: Create the edge function**

Create `supabase/functions/submit-client-request/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { hospital, contact, phone, description, preferredDate } = await req.json();

    if (!hospital || !contact || !phone || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: config } = await adminClient
      .from('automation_config').select('inbound_email').eq('id', 1).single();

    const inboundEmail = config?.inbound_email;
    if (!inboundEmail) {
      return new Response(JSON.stringify({ error: 'Automation not configured. Contact your administrator.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailBody = `Hospital: ${hospital}
Location: (not specified)
Priority: medium
Date: ${preferredDate || 'Not specified'}

${description}

---
Contact: ${contact}
Phone: ${phone}`;

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@resend.dev',
        to: inboundEmail,
        subject: `[SEP Request] ${hospital}`,
        text: emailBody,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    await adminClient.from('automation_logs').insert({
      type: 'form_submission',
      source: 'form',
      payload: { hospital, contact, phone },
      result: 'created',
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('submit-client-request error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

- [ ] **Step 3: Deploy edge function**

```bash
supabase functions deploy submit-client-request --no-verify-jwt
```
Expected: `Deployed submit-client-request`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/submit-client-request/index.ts
git commit -m "feat: add submit-client-request edge function with Resend"
```

---

## Task 12: Final E2E Verification

- [ ] **Step 1: Verify Automation tab is admin-only**

```bash
node -e "
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  await p.goto('http://localhost:3000', {waitUntil:'networkidle'});
  await p.locator('input[type=email]').fill('saispk12@gmail.com');
  await p.locator('input[type=password]').fill('ASPKPlanner@321');
  await p.locator('button[type=submit]').click();
  await p.waitForTimeout(4000);
  const navText = await p.locator('body').innerText();
  console.log('Automation tab visible:', navText.includes('Automation'));
  await b.close();
})();
"
```
Expected: `Automation tab visible: true`

- [ ] **Step 2: Verify /client-request is public**

```bash
node -e "
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  await p.goto('http://localhost:3000/client-request', {waitUntil:'networkidle'});
  const t = await p.locator('body').innerText();
  console.log('Public form visible:', t.includes('Service Request'));
  await b.close();
})();
"
```
Expected: `Public form visible: true`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete automation tab implementation"
```
