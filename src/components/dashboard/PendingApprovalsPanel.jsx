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
    <GlassPanel style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>

      {/* Leave Requests */}
      <div>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>
          Leave Requests
        </div>
        {pendingLeaves.length === 0 ? (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No pending leave requests</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingLeaves.slice(0, 3).map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.engineer?.name || '—'}
                  </div>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>
                    {formatShortDate(l.start_date)} – {formatShortDate(l.end_date)} · {l.leave_type}
                  </div>
                </div>
                <button
                  onClick={() => onApproveLeave(l.id)}
                  style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Approve"
                >✓</button>
                <button
                  onClick={() => onRejectLeave(l.id)}
                  style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>
          Unconfirmed Assignments
        </div>
        {unconfirmedCases.length === 0 ? (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>All assignments confirmed</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unconfirmedCases.slice(0, 3).map(c => {
              const eng = engineers.find(e => e.id === c.assigned_engineer_id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{c.id} · {eng?.name || '—'}
                    </div>
                    <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>
                      {c.scheduled_start ? formatShortDate(c.scheduled_start) : 'No date'}
                    </div>
                  </div>
                  <button
                    onClick={() => onConfirmCase(c.id)}
                    style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Confirm (start)"
                  >✓</button>
                  <button
                    onClick={() => onReassignCase(c)}
                    style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
