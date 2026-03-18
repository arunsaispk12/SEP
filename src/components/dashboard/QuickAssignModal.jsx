// src/components/dashboard/QuickAssignModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function QuickAssignModal({ caseToAssign, engineers, onSave, onClose }) {
  const availableEngineers = engineers.filter(e => e.is_available);
  const [engineerId, setEngineerId] = useState('');
  const [scheduledStart, setScheduledStart] = useState(
    caseToAssign?.scheduled_start
      ? new Date(caseToAssign.scheduled_start).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const handleSave = () => {
    if (!engineerId) return;
    onSave({
      caseId: caseToAssign.id,
      assigned_engineer_id: engineerId,
      scheduled_start: new Date(scheduledStart).toISOString(),
      status: 'assigned',
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 0 24px rgba(167,139,250,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>
            Assign Case #{caseToAssign?.id}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Engineer</div>
        <select
          value={engineerId}
          onChange={e => setEngineerId(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 12 }}
        >
          <option value="">Select available engineer…</option>
          {availableEngineers.map(e => (
            <option key={e.id} value={e.id}>
              {e.name} — {e.current_location?.name || e.location?.name || e.location || ''}
            </option>
          ))}
        </select>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Scheduled Start</div>
        <input
          type="datetime-local"
          value={scheduledStart}
          onChange={e => setScheduledStart(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!engineerId}
            style={{ padding: '6px 14px', background: engineerId ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.05)', border: `1px solid ${engineerId ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: engineerId ? '#60a5fa' : 'rgba(255,255,255,0.3)', cursor: engineerId ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
