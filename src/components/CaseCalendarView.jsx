// src/components/CaseCalendarView.jsx
import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import { STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';

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
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [activeStatus, setActiveStatus] = useState(null); // null = all
  const calendarRef = useRef(null);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { null: cases.length };
    STATUS_FILTERS.forEach(f => {
      if (f.key) counts[f.key] = cases.filter(c => c.status === f.key).length;
    });
    return counts;
  }, [cases]);

  // Events
  const fcEvents = useMemo(() => {
    const filtered = activeStatus ? cases.filter(c => c.status === activeStatus) : cases;
    return filtered
      .filter(c => c.scheduled_start)
      .map(c => {
        const colorObj = STATUS_COLORS[c.status];
        const bgColor = colorObj ? colorObj.bar : 'rgba(107,114,128,0.3)';
        const borderColor = colorObj ? colorObj.border : '#6b7280';
        const isOwn = c.assigned_engineer_id === currentUserId;
        const dimmed = isEngineer && !isOwn;
        return {
          id: String(c.id),
          title: `${c.case_number || '#' + c.id.slice(0, 6)} — ${c.client_name || c.title || 'Case'}`,
          start: new Date(c.scheduled_start),
          end: c.scheduled_end
            ? new Date(c.scheduled_end)
            : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
          backgroundColor: bgColor,
          borderColor,
          textColor: dimmed ? 'rgba(255,255,255,0.4)' : '#fff',
          extendedProps: { case: c },
        };
      });
  }, [cases, activeStatus, currentUserId, isEngineer]);

  // Date label
  const dateLabel = useMemo(() => {
    if (currentView === 'timeGridWeek') {
      const s = moment(currentDate).startOf('week');
      const e = moment(currentDate).endOf('week');
      return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
    }
    if (currentView === 'timeGridDay') return moment(currentDate).format('dddd, MMMM D, YYYY');
    return moment(currentDate).format('MMMM YYYY');
  }, [currentDate, currentView]);

  function navigate(direction) {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    direction === 'PREV' ? api.prev() : api.next();
  }

  function handleToday() {
    calendarRef.current?.getApi().today();
    setCurrentDate(new Date());
  }

  return (
    <div className="gcal-layout" style={{ height: 'calc(100vh - 180px)' }}>

      {/* ── TOP BAR ── */}
      <div className="gcal-topbar">
        <button className="gcal-today-btn" onClick={handleToday}>Today</button>
        <button className="gcal-nav-btn" onClick={() => navigate('PREV')}>‹</button>
        <button className="gcal-nav-btn" onClick={() => navigate('NEXT')}>›</button>
        <span className="gcal-date-label">{dateLabel}</span>
        <div className="gcal-view-switcher">
          {[
            { label: 'Month', value: 'dayGridMonth' },
            { label: 'Week',  value: 'timeGridWeek' },
            { label: 'Day',   value: 'timeGridDay' },
            { label: 'Agenda', value: 'listWeek' },
          ].map(({ label, value }) => (
            <button
              key={value}
              className={`gcal-view-btn${currentView === value ? ' active' : ''}`}
              onClick={() => {
                setCurrentView(value);
                calendarRef.current?.getApi().changeView(value);
              }}
            >
              {label}
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
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView={currentView}
            initialDate={currentDate}
            headerToolbar={false}
            events={fcEvents}
            scrollTime="08:00:00"
            nowIndicator
            height="100%"
            eventClick={({ event }) => {
              onSelectCase?.(event.extendedProps.case);
            }}
            datesSet={({ start, view }) => {
              setCurrentDate(start);
              setCurrentView(view.type);
            }}
            eventContent={({ event }) => (
              <div style={{ overflow: 'hidden', padding: '1px 2px', fontSize: 11, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {event.title}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
