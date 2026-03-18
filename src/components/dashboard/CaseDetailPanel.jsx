// src/components/dashboard/CaseDetailPanel.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from './GlassPanel';
import { STATUS_COLORS, getInitials, avatarGradient, formatShortDate } from './dashboardUtils';

const NEXT_STATUSES = {
  open:        ['assigned', 'cancelled'],
  assigned:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'on_hold', 'cancelled'],
  on_hold:     ['in_progress', 'cancelled'],
  completed:   [],
  cancelled:   [],
};

export default function CaseDetailPanel({ selectedCase, engineers, onClose, onUpdateStatus, isAdmin }) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const eng = selectedCase ? engineers.find(e => e.id === selectedCase.assigned_engineer_id) : null;
  const engIdx = engineers.indexOf(eng);
  const sc = selectedCase ? (STATUS_COLORS[selectedCase.status] || STATUS_COLORS.open) : null;
  const nextStatuses = selectedCase ? (NEXT_STATUSES[selectedCase.status] || []) : [];

  return (
    <GlassPanel glow="purple" style={{ padding: '10px 12px', height: '100%', position: 'relative' }}>
      <AnimatePresence mode="wait">
        {!selectedCase ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ fontSize: 24, opacity: 0.2 }}>📋</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Click a case bar<br/>to view details</div>
          </motion.div>
        ) : (
          <motion.div
            key={selectedCase.id}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 2 }}>
                  Case #{selectedCase.id}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                  {selectedCase.client_name || selectedCase.title}
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', paddingLeft: 8 }}><X size={14} /></button>
            </div>

            {/* Status tag */}
            <span style={{ fontSize: 7, padding: '2px 8px', borderRadius: 8, background: sc.bar, color: sc.border, border: `1px solid ${sc.border}`, fontWeight: 600 }}>
              {sc.label}
            </span>

            {/* Details */}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {eng && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: avatarGradient(engIdx), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700 }}>
                    {getInitials(eng.name)}
                  </div>
                  <div style={{ fontSize: 9, color: '#fff' }}>{eng.name}</div>
                </div>
              )}
              {selectedCase.scheduled_start && (
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                  📅 {formatShortDate(selectedCase.scheduled_start)}
                  {selectedCase.scheduled_end && ` – ${formatShortDate(selectedCase.scheduled_end)}`}
                </div>
              )}
              {(selectedCase.location?.name || selectedCase.client_address) && (
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                  📍 {selectedCase.location?.name || selectedCase.client_address}
                </div>
              )}
              {selectedCase.description && (
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginTop: 2 }}>
                  {selectedCase.description.slice(0, 100)}{selectedCase.description.length > 100 ? '…' : ''}
                </div>
              )}
            </div>

            {/* Actions — only admins can update status */}
            {isAdmin && nextStatuses.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <button
                  onClick={() => setShowStatusPicker(p => !p)}
                  style={{ width: '100%', padding: '5px 10px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fbbf24', cursor: 'pointer', fontSize: 9, fontWeight: 600 }}
                >
                  ⟳ Update Status
                </button>
                {showStatusPicker && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {nextStatuses.map(s => {
                      const nsc = STATUS_COLORS[s] || STATUS_COLORS.open;
                      return (
                        <button
                          key={s}
                          onClick={() => { onUpdateStatus(selectedCase.id, s); setShowStatusPicker(false); }}
                          style={{ padding: '3px 8px', background: nsc.bar, border: `1px solid ${nsc.border}`, borderRadius: 6, color: nsc.border, cursor: 'pointer', fontSize: 8, fontWeight: 600 }}
                        >
                          {nsc.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}
