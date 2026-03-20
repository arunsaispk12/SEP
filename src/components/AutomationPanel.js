import React, { useEffect, useState } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { Copy, Check, Plus, X, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

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

// ── WhatsApp Section ──────────────────────────────────────────────────────────
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

// ── Client Form Section ───────────────────────────────────────────────────────
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
Address: 123 MG Road, Indiranagar
Date: DD/MM/YYYY
Time: HH:MM

Please describe the laser service request in detail here.

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

// ── Main Panel ────────────────────────────────────────────────────────────────
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
      <WhatsAppSection config={automationConfig} onSave={saveAutomationConfig} />
      <ClientFormSection config={automationConfig} />
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
