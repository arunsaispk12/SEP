// src/components/UnifiedCalendar.jsx
import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import MiniCalendar from './MiniCalendar';
import { STATUS_COLORS } from './dashboard/dashboardUtils';

const ENGINEER_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#f97316',
];

const STATUS_FILTERS = [
  { key: null,          label: 'All Cases',   color: '#a78bfa' },
  { key: 'open',        label: 'Open',        color: '#f87171' },
  { key: 'assigned',    label: 'Assigned',    color: '#60a5fa' },
  { key: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'completed',   label: 'Completed',   color: '#34d399' },
  { key: 'on_hold',     label: 'On Hold',     color: '#fbbf24' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#6b7280' },
];

const FC_PLUGINS = [timeGridPlugin, dayGridPlugin, interactionPlugin, listPlugin];

// ── LocationCombobox ──────────────────────────────────────────────────────────
const LocationCombobox = ({ value, onChange, locations }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const filtered = (locations || [])
    .filter(l => l.toLowerCase().includes((value || '').toLowerCase()))
    .slice(0, 8);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Type or select location..."
        className="glass-input"
      />
      {open && filtered.length > 0 && (
        <div className="location-combobox-dropdown">
          {filtered.map(loc => (
            <div
              key={loc}
              className="location-combobox-option"
              onMouseDown={() => { onChange(loc); setOpen(false); }}
            >
              {loc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const UnifiedCalendar = () => {
  const {
    cases, engineers, locations, locationObjects,
    addCase, updateCase, deleteCase,
  } = useEngineerContext();
  const { user, profile } = useAuth();
  const isEngineerRole = profile?.role === 'engineer';

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [hiddenEngineers, setHiddenEngineers] = useState(new Set());
  const [activeStatus, setActiveStatus] = useState(null);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const calendarRef = useRef(null);

  // ── Modal / form state ──────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [formData, setFormData] = useState({
    case_type: 'client_work',
    title: '',
    client_name: '',
    engineerId: '',
    location: '',
    start: new Date(),
    end: new Date(),
    priority: 'normal',
    description: '',
  });

  // ── Event detail popup state ────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setSelectedEvent(null); setShowDeleteConfirm(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Engineer color map ──────────────────────────────────────────────────────
  const engineerColorMap = useMemo(() => {
    const map = {};
    engineers.forEach((eng, i) => { map[eng.id] = ENGINEER_COLORS[i % ENGINEER_COLORS.length]; });
    return map;
  }, [engineers]);

  // ── Split cases: scheduled vs unscheduled ───────────────────────────────────
  const scheduledCases = useMemo(
    () => cases.filter(c => c.scheduled_start),
    [cases]
  );
  const unscheduledCases = useMemo(
    () => cases.filter(c => !c.scheduled_start),
    [cases]
  );

  // ── Status counts ───────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { null: cases.length };
    STATUS_FILTERS.forEach(f => { if (f.key) counts[f.key] = cases.filter(c => c.status === f.key).length; });
    return counts;
  }, [cases]);

  // ── FC events ───────────────────────────────────────────────────────────────
  const fcEvents = useMemo(() => {
    let filtered = scheduledCases;
    if (activeStatus) filtered = filtered.filter(c => c.status === activeStatus);
    filtered = filtered.filter(c => !hiddenEngineers.has(c.assigned_engineer_id));

    return filtered.map(c => {
      const engColor = engineerColorMap[c.assigned_engineer_id] || '#6b7280';
      const statusColor = STATUS_COLORS[c.status]?.border || '#6b7280';
      const isOwn = c.assigned_engineer_id === user?.id;
      const dim = isEngineerRole && !isOwn;
      return {
        id: String(c.id),
        title: c.case_type === 'internal'
          ? `[Internal] ${c.title}`
          : `#${c.id.slice(0, 6)} — ${c.client_name || 'No client'}`,
        start: new Date(c.scheduled_start),
        end: c.scheduled_end
          ? new Date(c.scheduled_end)
          : new Date(new Date(c.scheduled_start).getTime() + 60 * 60 * 1000),
        backgroundColor: c.case_type === 'internal' ? 'rgba(100,116,139,0.35)' : engColor,
        borderColor: statusColor,
        textColor: dim ? 'rgba(255,255,255,0.4)' : '#fff',
        extendedProps: { case: c },
      };
    });
  }, [scheduledCases, activeStatus, hiddenEngineers, engineerColorMap, user?.id, isEngineerRole]);

  // ── Date label ──────────────────────────────────────────────────────────────
  const dateLabel = useMemo(() => {
    if (currentView === 'timeGridWeek') {
      const s = moment(currentDate).startOf('week');
      const e = moment(currentDate).endOf('week');
      return `${s.format('MMM D')} – ${e.format('D, YYYY')}`;
    }
    if (currentView === 'timeGridDay') return moment(currentDate).format('dddd, MMMM D, YYYY');
    return moment(currentDate).format('MMMM YYYY');
  }, [currentDate, currentView]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function navigate(direction) {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    direction === 'PREV' ? api.prev() : api.next();
    setCurrentDate(api.getDate());
  }

  function handleMiniCalendarDateClick(date) {
    setCurrentDate(date);
    calendarRef.current?.getApi().gotoDate(date);
  }

  function handleToday() {
    calendarRef.current?.getApi().today();
    setCurrentDate(new Date());
  }

  function toggleEngineer(id) {
    setHiddenEngineers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────
  function openNewForm(start, end) {
    setEditingCase(null);
    setFormData({
      case_type: 'client_work',
      title: '',
      client_name: '',
      engineerId: '',
      location: '',
      start: start || new Date(),
      end: end || new Date(Date.now() + 60 * 60 * 1000),
      priority: 'normal',
      description: '',
    });
    setShowModal(true);
  }

  function openEditForm(caseObj) {
    setEditingCase(caseObj);
    const locationObj = (locationObjects || []).find(l => l.id === caseObj.location_id);
    setFormData({
      case_type: caseObj.case_type || 'client_work',
      title: caseObj.title || '',
      client_name: caseObj.client_name || '',
      engineerId: caseObj.assigned_engineer_id || '',
      location: locationObj?.name || caseObj.location || '',
      start: caseObj.scheduled_start ? new Date(caseObj.scheduled_start) : new Date(),
      end: caseObj.scheduled_end ? new Date(caseObj.scheduled_end) : new Date(Date.now() + 60 * 60 * 1000),
      priority: caseObj.priority || 'normal',
      description: caseObj.description || '',
    });
    setShowModal(true);
  }

  function resetForm() {
    setEditingCase(null);
    setShowModal(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const locationObj = (locationObjects || []).find(l => l.name === formData.location);
    const data = {
      case_type: formData.case_type,
      title: formData.title,
      client_name: formData.case_type === 'client_work' ? formData.client_name : '',
      assigned_engineer_id: formData.engineerId || null,
      location_id: locationObj?.id || null,
      scheduled_start: formData.start.toISOString(),
      scheduled_end: formData.end.toISOString(),
      priority: formData.priority,
      description: formData.description || '',
      status: editingCase?.status || 'open',
    };
    if (editingCase) {
      await updateCase(editingCase.id, data);
    } else {
      await addCase(data);
    }
    resetForm();
  }

  async function handleDelete() {
    if (!editingCase) return;
    await deleteCase(editingCase.id);
    resetForm();
  }

  async function handleDeleteFromPopup() {
    const c = selectedEvent?.extendedProps?.case;
    if (!c) return;
    await deleteCase(c.id);
    setSelectedEvent(null);
  }

  async function handleStatusUpdate(caseObj, newStatus) {
    await updateCase(caseObj.id, { status: newStatus });
    setSelectedEvent(null);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="gcal-layout" style={{ height: '100vh' }}>

      {/* ── TOP BAR ── */}
      <div className="gcal-topbar">
        <span className="gcal-title">Calendar</span>
        <div className="gcal-divider" />
        <button className="gcal-today-btn" onClick={handleToday}>Today</button>
        <button className="gcal-nav-btn" onClick={() => navigate('PREV')}>‹</button>
        <button className="gcal-nav-btn" onClick={() => navigate('NEXT')}>›</button>
        <span className="gcal-date-label">{dateLabel}</span>
        <div className="gcal-view-switcher">
          {[
            { label: 'Month',  value: 'dayGridMonth' },
            { label: 'Week',   value: 'timeGridWeek' },
            { label: 'Day',    value: 'timeGridDay' },
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
        {!isEngineerRole && (
          <>
            <div className="gcal-divider" />
            <button
              className="glass-btn-primary"
              onClick={() => openNewForm()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              + New Case
            </button>
          </>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="gcal-body">

        {/* Sidebar */}
        <div className="gcal-sidebar">
          <MiniCalendar currentDate={currentDate} onDateClick={handleMiniCalendarDateClick} currentView={currentView} />

          {/* Engineer filters */}
          <div>
            <div className="gcal-filter-label">Engineers</div>
            {engineers.map((eng, i) => {
              const color = ENGINEER_COLORS[i % ENGINEER_COLORS.length];
              const hidden = hiddenEngineers.has(eng.id);
              return (
                <div key={eng.id} className="gcal-filter-row" onClick={() => toggleEngineer(eng.id)}>
                  <div className="gcal-filter-color" style={{ background: hidden ? 'transparent' : color, border: hidden ? `1.5px solid ${color}` : 'none' }} />
                  <span className="gcal-filter-name" style={{ color: hidden ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)' }}>{eng.name}</span>
                </div>
              );
            })}
          </div>

          {/* Status filters */}
          <div style={{ marginTop: 16 }}>
            <div className="gcal-filter-label">Status</div>
            {STATUS_FILTERS.map(f => {
              const isActive = activeStatus === f.key;
              return (
                <div
                  key={String(f.key)}
                  className="gcal-filter-row"
                  onClick={() => setActiveStatus(f.key)}
                  style={{ background: isActive ? 'rgba(167,139,250,0.1)' : undefined }}
                >
                  <div className="gcal-filter-color" style={{ background: f.color }} />
                  <span className="gcal-filter-name" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isActive ? 600 : 400 }}>
                    {f.label}
                  </span>
                  <span className="gcal-filter-count">{statusCounts[f.key] ?? 0}</span>
                </div>
              );
            })}
          </div>

          {/* Unscheduled section */}
          {unscheduledCases.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                className="gcal-filter-label"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setShowUnscheduled(v => !v)}
              >
                <span>Unscheduled</span>
                <span style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {unscheduledCases.length}
                </span>
              </div>
              {showUnscheduled && (
                <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 6 }}>
                  {unscheduledCases.map(c => (
                    <div
                      key={c.id}
                      className="gcal-filter-row"
                      onClick={() => !isEngineerRole && openEditForm(c)}
                      style={{ cursor: isEngineerRole ? 'default' : 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '5px 8px' }}
                    >
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                        {c.title}
                      </span>
                      {c.client_name && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{c.client_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main calendar */}
        <div className="gcal-main">
          <FullCalendar
            ref={calendarRef}
            plugins={FC_PLUGINS}
            initialView={currentView}
            initialDate={currentDate}
            headerToolbar={false}
            events={fcEvents}
            selectable={!isEngineerRole}
            selectMirror
            scrollTime="08:00:00"
            nowIndicator
            height="100%"
            select={!isEngineerRole ? ({ start, end }) => openNewForm(start, end) : undefined}
            eventClick={({ event }) => {
              setSelectedEvent(event);
              setShowDeleteConfirm(false);
            }}
            datesSet={({ start, view }) => {
              setCurrentDate(start);
              setCurrentView(view.type);
            }}
            eventContent={({ event }) => (
              <div style={{ overflow: 'hidden', padding: '1px 3px', fontSize: 11, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {event.title}
              </div>
            )}
          />
        </div>
      </div>

      {/* ── NEW / EDIT CASE MODAL ── */}
      {showModal && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.125rem', fontWeight: 700 }}>
                {editingCase ? 'Edit Case' : 'New Case'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Case type toggle */}
              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                {[
                  { value: 'client_work', label: 'Client Work' },
                  { value: 'internal', label: 'Internal' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, case_type: t.value }))}
                    style={{
                      padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: formData.case_type === t.value ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${formData.case_type === t.value ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: formData.case_type === t.value ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Title *</div>
                <input type="text" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="glass-input" />
              </div>

              {formData.case_type === 'client_work' && (
                <div style={{ marginBottom: 14 }}>
                  <div className="section-label">Client</div>
                  <input type="text" value={formData.client_name} onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))} className="glass-input" placeholder="Hospital / clinic name" />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Engineer <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 400 }}>(optional)</span></div>
                <select value={formData.engineerId} onChange={e => setFormData(p => ({ ...p, engineerId: e.target.value }))} className="glass-select">
                  <option value="">Unassigned</option>
                  {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name} — {eng.location}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Location</div>
                <LocationCombobox value={formData.location} onChange={val => setFormData(p => ({ ...p, location: val }))} locations={locations} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Start *</div>
                  <input type="datetime-local" required value={moment(formData.start).format('YYYY-MM-DDTHH:mm')} onChange={e => setFormData(p => ({ ...p, start: new Date(e.target.value) }))} className="glass-input" />
                </div>
                <div>
                  <div className="section-label">End *</div>
                  <input type="datetime-local" required value={moment(formData.end).format('YYYY-MM-DDTHH:mm')} onChange={e => setFormData(p => ({ ...p, end: new Date(e.target.value) }))} className="glass-input" />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Priority</div>
                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="glass-select">
                  {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Description</div>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows="3" className="glass-textarea" />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                {editingCase && (
                  <button type="button" className="glass-btn-danger" onClick={handleDelete} style={{ fontSize: 12, padding: '6px 14px' }}>
                    Delete
                  </button>
                )}
                <button type="button" className="glass-btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="glass-btn-primary">{editingCase ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL POPUP ── */}
      {selectedEvent && (() => {
        const c = selectedEvent.extendedProps?.case;
        if (!c) return null;
        const isOwn = c.assigned_engineer_id === user?.id;
        const canEdit = !isEngineerRole;
        const canStatusUpdate = isEngineerRole && isOwn;
        const engineer = engineers.find(e => e.id === c.assigned_engineer_id);
        const engColor = engineerColorMap[c.assigned_engineer_id] || '#6b7280';
        const statusCfg = STATUS_COLORS[c.status];
        const nextStatuses = c.status === 'open' || c.status === 'assigned'
          ? [{ value: 'in_progress', label: 'Start Work' }]
          : c.status === 'in_progress'
            ? [{ value: 'completed', label: 'Mark Completed' }]
            : [];
        const fmt = d => new Date(d).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <>
            <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,12,41,0.7)', zIndex: 200 }} />
            <div className="event-popup-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>#{c.id.slice(0, 6)}</div>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {statusCfg && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: `1px solid ${statusCfg.border}`, color: statusCfg.border }}>{c.status.replace('_', ' ')}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{c.priority}</span>
                {c.case_type === 'internal' && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}>Internal</span>}
              </div>

              {c.scheduled_start && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
                  {fmt(c.scheduled_start)}{c.scheduled_end ? ` – ${new Date(c.scheduled_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </div>
              )}

              {c.client_name && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <span>🏢</span><span>{c.client_name}</span>
                </div>
              )}

              {c.location && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <span>📍</span><span>{c.location?.name || c.location}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                {engineer ? (
                  <>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: engColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {engineer.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, color: '#fff' }}>{engineer.name}</span>
                  </>
                ) : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}
              </div>

              {c.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>{c.description}</div>}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

              {/* Admin/manager actions */}
              {canEdit && (
                showDeleteConfirm ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>Delete this case?</span>
                    <button className="glass-btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button className="glass-btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleDeleteFromPopup}>Confirm</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="glass-btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => { setSelectedEvent(null); openEditForm(c); }}>Edit</button>
                    <button className="glass-btn-danger" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                  </div>
                )
              )}

              {/* Engineer own-case status update */}
              {canStatusUpdate && nextStatuses.length > 0 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {nextStatuses.map(s => (
                    <button key={s.value} className="glass-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => handleStatusUpdate(c, s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default UnifiedCalendar;
