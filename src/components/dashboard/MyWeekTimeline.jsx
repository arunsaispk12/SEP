// src/components/dashboard/MyWeekTimeline.jsx
import React, { useState } from 'react';
import GlassPanel from './GlassPanel';
import { getWeekDays, formatDayLabel, isToday, STATUS_COLORS } from './dashboardUtils';

export default function MyWeekTimeline({ schedules, cases, engineerId, weekStart, onWeekChange, onGoToCase }) {
  const [popover, setPopover] = useState(null); // { caseObj, dayIdx }

  const weekDays = getWeekDays(weekStart);

  return (
    <GlassPanel style={{ padding: '10px 14px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <div style={{ flex: 1, fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px' }}>
          This Week — My Schedule
        </div>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); onWeekChange(d); }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
        >‹</button>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); onWeekChange(d); }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
        >›</button>
      </div>

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {weekDays.map((day, i) => {
          const daySchedules = schedules.filter(s => {
            if (s.engineer_id !== engineerId) return false;
            const sd = new Date(s.start_time);
            return sd.toDateString() === day.toDateString();
          });
          const dayCase = daySchedules.length > 0 ? cases.find(c => c.id === daySchedules[0].case_id) : null;
          const sc = dayCase ? (STATUS_COLORS[dayCase.status] || STATUS_COLORS.open) : null;
          const today = isToday(day);

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Day label */}
              <div style={{ width: 36, fontSize: 8, color: today ? '#a78bfa' : 'rgba(255,255,255,0.3)', fontWeight: today ? 700 : 400, flexShrink: 0 }}>
                {formatDayLabel(day)}{today ? ' ●' : ''}
              </div>

              {/* Bar track */}
              <div
                style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4, position: 'relative', cursor: dayCase ? 'pointer' : 'default' }}
                onClick={() => dayCase && setPopover(prev => prev?.id === dayCase.id ? null : { ...dayCase, dayIdx: i })}
              >
                {dayCase ? (
                  <div style={{
                    position: 'absolute', inset: '2px',
                    background: sc.bar, borderRadius: 3, borderLeft: `2px solid ${sc.border}`,
                    display: 'flex', alignItems: 'center', paddingLeft: 6, overflow: 'hidden'
                  }}>
                    <span style={{ fontSize: 7, color: sc.border, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{dayCase.id} {dayCase.location?.name || dayCase.client_address || dayCase.client_name || ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)' }}>No cases</span>
                  </div>
                )}
              </div>

              {/* Status tag */}
              <div style={{ width: 48, flexShrink: 0 }}>
                {sc && (
                  <span style={{ fontSize: 6, padding: '2px 5px', borderRadius: 6, background: sc.bar, color: sc.border, border: `1px solid ${sc.border}`, fontWeight: 600 }}>
                    {sc.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover */}
      {popover && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '0 0 10px 10px',
          padding: '10px 14px', zIndex: 10
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
            Case #{popover.id} — {popover.client_name || popover.title}
          </div>
          {popover.scheduled_start && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
              📅 {new Date(popover.scheduled_start).toLocaleString()}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
            {onGoToCase && (
              <button
                onClick={() => { onGoToCase(); setPopover(null); }}
                style={{ fontSize: 8, padding: '3px 10px', background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 5, color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}
              >Go to Case →</button>
            )}
            <button onClick={() => setPopover(null)} style={{ fontSize: 8, padding: '3px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
