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
    <div className="glass-modal-backdrop">
      <div className="glass-modal">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>
            Assign Case #{caseToAssign?.id}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div className="section-label" style={{ marginBottom: 4 }}>Engineer</div>
        <select
          value={engineerId}
          onChange={e => setEngineerId(e.target.value)}
          className="glass-select"
          style={{ marginBottom: 12 }}
        >
          <option value="">Select available engineer…</option>
          {availableEngineers.map(e => (
            <option key={e.id} value={e.id}>
              {e.name} — {e.current_location?.name || e.location?.name || e.location || ''}
            </option>
          ))}
        </select>

        <div className="section-label" style={{ marginBottom: 4 }}>Scheduled Start</div>
        <input
          type="datetime-local"
          value={scheduledStart}
          onChange={e => setScheduledStart(e.target.value)}
          className="glass-input"
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="glass-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!engineerId}
            className="glass-btn-primary"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
