// src/components/dashboard/CasesPanel.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { formatShortDate, getInitials, avatarGradient, STATUS_COLORS } from './dashboardUtils';

export default function CasesPanel({ upcomingCases, unassignedCases, engineers, activeFilter, onQuickAssign }) {
  const highlightUpcoming   = activeFilter === 'upcoming';
  const highlightUnassigned = activeFilter === 'unassigned';

  return (
    <GlassPanel glow="purple" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Upcoming Cases */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div
          className="section-label"
          style={{ marginBottom: 6, ...(highlightUpcoming ? { color: '#fbbf24' } : {}) }}
        >
          Upcoming Cases
        </div>
        {upcomingCases.length === 0 ? (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No upcoming cases</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {upcomingCases.slice(0, 4).map((c, i) => {
              const assignedEng = engineers.find(e => e.id === c.assigned_engineer_id);
              const engIdx = engineers.indexOf(assignedEng);
              const sc = STATUS_COLORS[c.status] || STATUS_COLORS.open;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', minWidth: 52 }}>#{c.id}</div>
                  <div style={{ flex: 1, fontSize: 8, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {c.client_name || c.title}
                  </div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                    {c.scheduled_start ? formatShortDate(c.scheduled_start) : '—'}
                  </div>
                  {assignedEng && (
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: avatarGradient(engIdx),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700
                    }}>{getInitials(assignedEng.name)}</div>
                  )}
                  <span style={{
                    fontSize: 6, padding: '1px 5px', borderRadius: 8, fontWeight: 600,
                    background: `${sc.bar}`, color: sc.border, border: `1px solid ${sc.border}`,
                    whiteSpace: 'nowrap'
                  }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Unassigned Cases */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div
          className="section-label"
          style={{ marginBottom: 6, color: highlightUnassigned ? '#f87171' : 'rgba(248,113,113,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>⚠</span> Unassigned Cases
        </div>
        {unassignedCases.length === 0 ? (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>All cases assigned</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {unassignedCases.slice(0, 4).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', minWidth: 52 }}>#{c.id}</div>
                <div style={{ flex: 1, fontSize: 8, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.client_name || c.title}
                </div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.location?.name || c.client_address || '—'}
                </div>
                <button
                  onClick={() => onQuickAssign(c)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(96,165,250,0.5)',
                    background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 12, lineHeight: '16px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}
                  title="Quick assign"
                >+</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
