// src/components/CaseCalendarView.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { STATUS_COLORS } from './dashboard/dashboardUtils';

const localizer = momentLocalizer(moment);
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

// engineers prop passed through for future use (showing assignee names on event chips)
export default function CaseCalendarView({ cases, engineers = [], currentUserId, isEngineer, onSelectCase }) {
  const [calView, setCalView] = useState('week');

  const events = useMemo(() => {
    return cases
      .filter(c => c.scheduled_start)
      .map(c => ({
        id: c.id,
        title: `${c.case_number || c.id.slice(0, 8)} — ${c.title || c.description?.slice(0, 30) || 'Case'}`,
        start: new Date(c.scheduled_start),
        end: c.scheduled_end
          ? new Date(c.scheduled_end)
          : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
        resource: c,
      }));
  }, [cases]);

  const unscheduledCount = cases.filter(c => !c.scheduled_start).length;

  const eventPropGetter = (event) => {
    const isOwn = event.resource.assigned_engineer_id === currentUserId;
    const dimmed = isEngineer && !isOwn;
    // STATUS_COLORS values are objects with a .border hex color
    const colorObj = STATUS_COLORS[event.resource.status];
    const color = colorObj ? colorObj.border : '#6b7280';
    return {
      style: {
        backgroundColor: color,
        opacity: dimmed ? 0.45 : 1,
        border: dimmed ? '1px dashed rgba(255,255,255,0.3)' : 'none',
        borderRadius: 6,
        color: '#fff',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: FONT,
        padding: '2px 6px',
        cursor: 'pointer',
      },
    };
  };

  const views = ['day', 'week', 'month'];

  return (
    <div style={{ fontFamily: FONT }}>
      {/* View switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {views.map(v => (
          <button
            key={v}
            onClick={() => setCalView(v)}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: calView === v ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)',
              background: calView === v ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
              color: calView === v ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontFamily: FONT,
              transition: 'all 0.15s',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Unscheduled banner */}
      {unscheduledCount > 0 && (
        <div style={{ marginBottom: 14, padding: '8px 14px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, fontSize: 12, color: '#fbbf24' }}>
          {unscheduledCount} case{unscheduledCount > 1 ? 's have' : ' has'} no scheduled date and {unscheduledCount > 1 ? 'are' : 'is'} not shown in calendar view. Switch to List view to see {unscheduledCount > 1 ? 'them' : 'it'}.
        </div>
      )}

      {/* Legend for engineer role */}
      {isEngineer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#a78bfa' }} />
            Your cases (full opacity)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#6b7280', opacity: 0.45, border: '1px dashed rgba(255,255,255,0.3)' }} />
            Other cases (dimmed)
          </div>
        </div>
      )}

      {/* Calendar — toolbar=false, we render our own view switcher above */}
      <div style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={calView}
          onView={setCalView}
          onSelectEvent={event => onSelectCase?.(event.resource)}
          eventPropGetter={eventPropGetter}
          style={{ height: '100%' }}
          toolbar={false}
          popup
        />
      </div>
    </div>
  );
}
