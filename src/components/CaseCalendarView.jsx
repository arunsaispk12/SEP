// src/components/CaseCalendarView.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';

const localizer = momentLocalizer(moment);

const STATUS_FILTERS = [
  { key: null,          label: 'All Cases',   color: '#a78bfa' },
  { key: 'open',        label: 'Open',        color: '#f87171' },
  { key: 'assigned',    label: 'Assigned',    color: '#60a5fa' },
  { key: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'completed',   label: 'Completed',   color: '#34d399' },
  { key: 'on_hold',     label: 'On Hold',     color: '#fbbf24' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#6b7280' },
];

export default function CaseCalendarView({ cases, engineers = [], currentUserId, isEngineer, onSelectCase }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [activeStatus, setActiveStatus] = useState(null); // null = all

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { null: cases.length };
    STATUS_FILTERS.forEach(f => {
      if (f.key) counts[f.key] = cases.filter(c => c.status === f.key).length;
    });
    return counts;
  }, [cases]);

  // Events
  const events = useMemo(() => {
    const filtered = activeStatus ? cases.filter(c => c.status === activeStatus) : cases;
    return filtered
      .filter(c => c.scheduled_start)
      .map(c => ({
        id: c.id,
        title: `${c.case_number || '#' + c.id.slice(0, 6)} — ${c.client_name || c.title || 'Case'}`,
        start: new Date(c.scheduled_start),
        end: c.scheduled_end
          ? new Date(c.scheduled_end)
          : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
        resource: c,
      }));
  }, [cases, activeStatus]);

  // Date label
  const dateLabel = useMemo(() => {
    if (currentView === 'week') {
      const s = moment(currentDate).startOf('week');
      const e = moment(currentDate).endOf('week');
      return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
    }
    if (currentView === 'day') return moment(currentDate).format('dddd, MMMM D, YYYY');
    return moment(currentDate).format('MMMM YYYY');
  }, [currentDate, currentView]);

  function navigate(direction) {
    const unit = currentView === 'month' ? 'month' : currentView === 'week' ? 'week' : 'day';
    setCurrentDate(moment(currentDate)[direction === 'PREV' ? 'subtract' : 'add'](1, unit).toDate());
  }

  const eventPropGetter = (event) => {
    const colorObj = STATUS_COLORS[event.resource?.status];
    const color = colorObj ? colorObj.border : '#6b7280';
    const barColor = colorObj ? colorObj.bar : 'rgba(107,114,128,0.3)';
    const isOwn = event.resource?.assigned_engineer_id === currentUserId;
    const dimmed = isEngineer && !isOwn;
    return {
      style: {
        backgroundColor: barColor,
        borderLeft: `3px solid ${color}`,
        opacity: dimmed ? 0.45 : 1,
        borderRadius: 4,
        color: '#fff',
        fontSize: 11,
      }
    };
  };

  const CustomEvent = ({ event }) => (
    <div style={{ overflow: 'hidden', padding: '1px 2px', fontSize: 11, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
      {event.title}
    </div>
  );

  return (
    <div className="gcal-layout" style={{ height: 'calc(100vh - 180px)' }}>

      {/* ── TOP BAR ── */}
      <div className="gcal-topbar">
        <button className="gcal-today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
        <button className="gcal-nav-btn" onClick={() => navigate('PREV')}>‹</button>
        <button className="gcal-nav-btn" onClick={() => navigate('NEXT')}>›</button>
        <span className="gcal-date-label">{dateLabel}</span>
        <div className="gcal-view-switcher">
          {['month', 'week', 'day', 'agenda'].map(v => (
            <button key={v} className={`gcal-view-btn${currentView === v ? ' active' : ''}`} onClick={() => setCurrentView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="gcal-body">

        {/* Sidebar */}
        <div className="gcal-sidebar">
          <MiniCalendar currentDate={currentDate} onDateClick={setCurrentDate} currentView={currentView} />
          <div>
            <div className="gcal-filter-label">Status</div>
            {STATUS_FILTERS.map(f => {
              const isActive = activeStatus === f.key;
              return (
                <div key={String(f.key)} className="gcal-filter-row" onClick={() => setActiveStatus(f.key)}
                  style={{ background: isActive ? 'rgba(167,139,250,0.1)' : undefined }}>
                  <div className="gcal-filter-color" style={{ background: f.color }} />
                  <span className="gcal-filter-name" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isActive ? 600 : 400 }}>
                    {f.label}
                  </span>
                  <span className="gcal-filter-count">{statusCounts[f.key] ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main calendar */}
        <div className="gcal-main">
          <Calendar
            localizer={localizer}
            events={events}
            view={currentView}
            date={currentDate}
            onView={setCurrentView}
            onNavigate={setCurrentDate}
            onSelectEvent={event => onSelectCase?.(event.resource)}
            eventPropGetter={eventPropGetter}
            components={{ toolbar: () => null, event: CustomEvent }}
            scrollToTime={new Date(2000, 0, 1, 8, 0, 0)}
            style={{ flex: 1, minHeight: 0 }}
            popup
          />
        </div>
      </div>
    </div>
  );
}
