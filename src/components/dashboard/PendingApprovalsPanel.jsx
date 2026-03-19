// src/components/dashboard/PendingApprovalsPanel.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { formatShortDate } from './dashboardUtils';

export default function PendingApprovalsPanel({
  pendingLeaves,       // array from supabaseService.getLeavesByStatus('pending')
  unconfirmedCases,    // cases with status === 'assigned'
  engineers,
  onApproveLeave,      // (leaveId) => void
  onRejectLeave,       // (leaveId) => void
  onConfirmCase,       // (caseId) => void
  onReassignCase,      // (case) => void
}) {
  return (
    <GlassPanel style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* Leave Requests */}
      <div>
        <div className="section-label" style={{ marginBottom: 8 }}>
          Leave Requests
        </div>
        {pendingLeaves.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No pending leave requests</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingLeaves.slice(0, 3).map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.engineer?.name || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {formatShortDate(l.start_date)} – {formatShortDate(l.end_date)} · {l.leave_type}
                  </div>
                </div>
                <button
                  onClick={() => onApproveLeave(l.id)}
                  className="glass-btn-primary"
                  style={{ width: 26, height: 26, borderRadius: 6, padding: 0, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Approve"
                >✓</button>
                <button
                  onClick={() => onRejectLeave(l.id)}
                  className="glass-btn-danger"
                  style={{ width: 26, height: 26, borderRadius: 6, padding: 0, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Reject"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Unconfirmed Assignments */}
      <div>
        <div className="section-label" style={{ marginBottom: 8 }}>
          Unconfirmed Assignments
        </div>
        {unconfirmedCases.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>All assignments confirmed</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unconfirmedCases.slice(0, 3).map(c => {
              const eng = engineers.find(e => e.id === c.assigned_engineer_id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{c.id} · {eng?.name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      {c.scheduled_start ? formatShortDate(c.scheduled_start) : 'No date'}
                    </div>
                  </div>
                  <button
                    onClick={() => onConfirmCase(c.id)}
                    className="glass-btn-primary"
                    style={{ width: 26, height: 26, borderRadius: 6, padding: 0, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Confirm (start)"
                  >✓</button>
                  <button
                    onClick={() => onReassignCase(c)}
                    className="glass-btn-secondary"
                    style={{ width: 26, height: 26, borderRadius: 6, padding: 0, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Reassign"
                  >↻</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
