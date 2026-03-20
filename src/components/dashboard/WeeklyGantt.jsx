// src/components/dashboard/WeeklyGantt.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { getWeekDays, formatDayLabel, isToday, STATUS_COLORS, getInitials, avatarGradient } from './dashboardUtils';

function dayIndex(date) {
  // Returns 0–4 for Mon–Fri, -1 for weekend
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  if (day === 0 || day === 6) return -1;
  return day - 1; // 0=Mon, 4=Fri
}

function barStyle(startTime, endTime, weekStart) {
  // Clamp: if startTime is before the week, treat as Monday (index 0)
  const startD = new Date(startTime);
  const endD   = new Date(endTime);
  const weekEndD = new Date(weekStart); weekEndD.setDate(weekEndD.getDate() + 5);

  // startIdx: 0 if before week, dayIndex otherwise
  const rawStart = startD < weekStart ? 0 : dayIndex(startTime);
  const rawEnd   = endD >= weekEndD   ? 4 : dayIndex(endTime);

  const clampedStart = Math.max(0, rawStart === -1 ? 0 : rawStart);
  const clampedEnd   = Math.min(4, rawEnd   === -1 ? 4 : rawEnd);

  const left  = (clampedStart / 5) * 100;
  const width = ((clampedEnd - clampedStart + 1) / 5) * 100;

  return { left: `${left}%`, width: `${Math.max(width, 15)}%` };
}

export default function WeeklyGantt({ engineers, schedules, cases, leaves, weekStart, onWeekChange, onBarClick, activeFilter }) {
  const weekDays = getWeekDays(weekStart);

  return (
    <div style={{ overflowX: 'auto' }}>
      <GlassPanel style={{ padding: '14px 16px', minWidth: 320 }}>
      {/* Header: nav + day labels */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); onWeekChange(d); }}
          className="glass-btn-secondary"
          style={{ padding: '3px 10px', fontSize: 13 }}
        >‹</button>
        <div style={{ flex: 1, display: 'flex' }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: isToday(d) ? '#a78bfa' : 'rgba(255,255,255,0.3)', fontWeight: isToday(d) ? 700 : 400, borderBottom: `1px solid ${isToday(d) ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: 4 }}>
              {formatDayLabel(d)}{isToday(d) ? ' ●' : ''}
            </div>
          ))}
        </div>
        <button
          onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); onWeekChange(d); }}
          className="glass-btn-secondary"
          style={{ padding: '3px 10px', fontSize: 13 }}
        >›</button>
      </div>

      {/* Engineer rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {engineers.map((eng, i) => {
          const engSchedules = schedules.filter(s =>
            s.engineer_id === eng.id &&
            getWeekDays(weekStart).some(d => {
              const sd = new Date(s.start_time);
              return sd.toDateString() === d.toDateString();
            })
          );

          // Leave bars for this engineer this week
          const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 5);
          const engLeaves = leaves.filter(l =>
            l.engineer_id === eng.id &&
            l.status === 'approved' &&
            new Date(l.start_date) < weekEnd &&
            new Date(l.end_date) >= weekStart
          );

          const dimmed = activeFilter === 'available' && !eng.is_available;

          return (
            <div key={eng.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: dimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}>
              {/* Avatar */}
              <div style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', background: avatarGradient(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                {getInitials(eng.name)}
              </div>

              {/* Track */}
              <div style={{ flex: 1, height: 26, background: 'rgba(255,255,255,0.04)', borderRadius: 5, position: 'relative', overflow: 'hidden' }}>
                {/* Case bars */}
                {engSchedules.map(s => {
                  const relCase = cases.find(c => c.id === s.case_id);
                  const sc = STATUS_COLORS[relCase?.status] || STATUS_COLORS.open;
                  const pos = barStyle(s.start_time, s.end_time, weekStart);
                  return (
                    <div
                      key={s.id}
                      onClick={() => relCase && onBarClick(relCase)}
                      style={{
                        position: 'absolute', top: 2, bottom: 2,
                        ...pos,
                        background: sc.bar,
                        borderRadius: 3,
                        borderLeft: `2px solid ${sc.border}`,
                        display: 'flex', alignItems: 'center', paddingLeft: 4,
                        cursor: relCase ? 'pointer' : 'default',
                        overflow: 'hidden',
                      }}
                      title={relCase?.title}
                    >
                      <span style={{ fontSize: 10, color: sc.border, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {relCase ? `#${relCase.id} ${relCase.client_name || relCase.title || ''}` : s.title}
                      </span>
                    </div>
                  );
                })}

                {/* Leave hatching overlay */}
                {engLeaves.map(l => {
                  // Convert leave dates to day indices within this week
                  const leaveStart = new Date(l.start_date);
                  const leaveEnd   = new Date(l.end_date);
                  const startIdx = Math.max(0, dayIndex(leaveStart) === -1 ? 0 : dayIndex(leaveStart));
                  const endIdx   = Math.min(4, dayIndex(leaveEnd) === -1 ? 4 : dayIndex(leaveEnd));
                  const left  = (startIdx / 5) * 100;
                  const width = ((endIdx - startIdx + 1) / 5) * 100;
                  return (
                    <div
                      key={l.id}
                      style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `${left}%`, width: `${width}%`,
                        background: 'repeating-linear-gradient(45deg, rgba(251,191,36,0.15) 0px, rgba(251,191,36,0.15) 3px, transparent 3px, transparent 7px)',
                        borderLeft: '2px solid rgba(251,191,36,0.4)',
                      }}
                      title={`Leave: ${l.leave_type}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </GlassPanel>
    </div>
  );
}
