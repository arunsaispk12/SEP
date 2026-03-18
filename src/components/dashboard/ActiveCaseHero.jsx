// src/components/dashboard/ActiveCaseHero.jsx
import React, { useState } from 'react';
import GlassPanel from './GlassPanel';
import CaseCompletionModal from '../CaseCompletionModal';
import { STATUS_COLORS, formatTime } from './dashboardUtils';

const NEXT_STATUSES = {
  assigned:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'on_hold', 'cancelled'],
};

export default function ActiveCaseHero({ activeCase, onUpdateCase }) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  if (!activeCase) {
    return (
      <GlassPanel glow="green" topStripe="linear-gradient(90deg,#34d399,#06b6d4)" style={{ padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>✓</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>All clear</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>No active cases today. Enjoy your day.</div>
          </div>
        </div>
      </GlassPanel>
    );
  }

  const sc = STATUS_COLORS[activeCase.status] || STATUS_COLORS.open;
  const nextStatuses = NEXT_STATUSES[activeCase.status] || [];
  const locationName = activeCase.location?.name || activeCase.client_address || '';
  const timeRange = activeCase.scheduled_start
    ? `${formatTime(activeCase.scheduled_start)}${activeCase.scheduled_end ? ` – ${formatTime(activeCase.scheduled_end)}` : ''}`
    : '';

  const handleCompletionSave = async (completionData) => {
    await onUpdateCase(activeCase.id, {
      status: 'completed',
      completion_details: completionData,
      actual_end: new Date().toISOString(),
    });
    setShowCompletion(false);
  };

  return (
    <>
      <GlassPanel glow="amber" topStripe="linear-gradient(90deg,#fbbf24,#f59e0b)" style={{ padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 4 }}>
              Active Case · Today
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Case #{activeCase.id} — {activeCase.client_name || activeCase.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {locationName && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>📍 {locationName}</span>}
              {timeRange && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>🕐 {timeRange}</span>}
              <span style={{ fontSize: 7, padding: '2px 8px', borderRadius: 8, background: sc.bar, color: sc.border, border: `1px solid ${sc.border}`, fontWeight: 600 }}>
                {sc.label}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setShowCompletion(true)}
              style={{ padding: '6px 16px', background: 'rgba(52,211,153,0.25)', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 6, color: '#6ee7b7', cursor: 'pointer', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}
            >✓ Mark Complete</button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowStatusPicker(p => !p)}
                style={{ width: '100%', padding: '6px 16px', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fde68a', cursor: 'pointer', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}
              >⟳ Update Status</button>
              {showStatusPicker && nextStatuses.length > 0 && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: 8, padding: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                  {nextStatuses.map(s => {
                    const nsc = STATUS_COLORS[s] || STATUS_COLORS.open;
                    return (
                      <button
                        key={s}
                        onClick={async () => {
                          await onUpdateCase(activeCase.id, { status: s });
                          setShowStatusPicker(false);
                        }}
                        style={{ padding: '4px 10px', background: nsc.bar, border: `1px solid ${nsc.border}`, borderRadius: 5, color: nsc.border, cursor: 'pointer', fontSize: 9, fontWeight: 600, textAlign: 'left' }}
                      >{nsc.label}</button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      {showCompletion && (
        <CaseCompletionModal
          caseData={activeCase}
          onClose={() => setShowCompletion(false)}
          onSave={handleCompletionSave}
        />
      )}
    </>
  );
}
