// src/components/ScheduleCalendar.js
import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import scheduleCaseSyncService from '../services/scheduleCaseSync';
import toast from 'react-hot-toast';
import { getEngineerStatus, ENGINEER_STATUS_CONFIG, STATUS_COLORS } from './dashboard/dashboardUtils';
import MiniCalendar from './MiniCalendar';

const ENGINEER_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#f97316',
];

// ── LocationCombobox (unchanged) ──────────────────────────────────────────────
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

// ── Main component ─────────────────────────────────────────────────────────────
const ScheduleCalendar = () => {
  const {
    schedules, engineers, cases, clients, addClient,
    addSchedule, updateSchedule, deleteSchedule,
    getEngineerById, locations, locationObjects,
    isEngineerOnLeave, leaves
  } = useEngineerContext();
  const { user, profile } = useAuth();

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [hiddenEngineers, setHiddenEngineers] = useState(new Set());

  // ── Modal / form state ──────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', contact_person: '', mobile: '', address: '', location: '' });
  const [savingClient, setSavingClient] = useState(false);
  const [formData, setFormData] = useState({
    title: '', engineerId: '', location: '', client_id: null,
    start: new Date(), end: new Date(), description: '', priority: 'normal'
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const calendarRef = useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelectedEvent(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const priorities = [
    { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
  ];

  const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#22c55e' };

  const isEngineerRole = profile?.role === 'engineer';

  // ── Engineer color map ──────────────────────────────────────────────────────
  const engineerColorMap = useMemo(() => {
    const map = {};
    engineers.forEach((eng, i) => { map[eng.id] = ENGINEER_COLORS[i % ENGINEER_COLORS.length]; });
    return map;
  }, [engineers]);

  // ── Events ──────────────────────────────────────────────────────────────────
  const scheduleEvents = useMemo(() => schedules.map(schedule => {
    const engineer = getEngineerById(schedule.engineer_id);
    const engineerStatus = engineer ? getEngineerStatus(engineer, schedules) : null;
    const linkedCase = cases?.find(c => c.id === schedule.case_id) || null;
    return {
      id: schedule.id,
      title: schedule.title,
      start: new Date(schedule.start_time || schedule.start),
      end: new Date(schedule.end_time || schedule.end),
      resource: { schedule, engineer, engineerStatus, linkedCase },
    };
  }), [schedules, cases, getEngineerById]);

  const leaveEvents = useMemo(() => (leaves || []).map(leave => {
    const engineer = getEngineerById(leave.engineer_id);
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    end.setHours(23, 59, 59, 999);
    return {
      id: `leave-${leave.id}`,
      title: `Leave — ${engineer?.name || 'Unknown'}`,
      start, end, allDay: true,
      resource: { engineer, priority: 'low', description: leave.reason || 'Leave' },
    };
  }), [leaves, getEngineerById]);

  const filteredEvents = useMemo(() => {
    const filtered = scheduleEvents.filter(ev => {
      const engId = ev.resource?.engineer?.id;
      return !engId || !hiddenEngineers.has(engId);
    });
    return [...filtered, ...leaveEvents];
  }, [scheduleEvents, leaveEvents, hiddenEngineers]);

  const fcEvents = useMemo(() => filteredEvents.map(ev => {
    if (typeof ev.id === 'string' && ev.id.startsWith('leave-')) {
      return {
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        allDay: ev.allDay,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.2)',
        textColor: 'rgba(255,255,255,0.4)',
        extendedProps: { ...ev.resource, dim: false },
      };
    }
    const { schedule, engineer, linkedCase } = ev.resource || {};
    const engColor = engineerColorMap[engineer?.id] || '#6b7280';
    const caseAccent = linkedCase ? STATUS_COLORS[linkedCase.status]?.border : null;
    const isOwn = schedule?.engineer_id === user?.id;
    const dim = isEngineerRole && !isOwn;
    return {
      id: String(ev.id),
      title: ev.title,
      start: ev.start,
      end: ev.end,
      backgroundColor: engColor,
      borderColor: caseAccent || engColor,
      textColor: dim ? 'rgba(255,255,255,0.45)' : '#fff',
      extendedProps: { ...ev.resource, dim },
    };
  }), [filteredEvents, engineerColorMap, user?.id, isEngineerRole]);

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.engineerId && isEngineerOnLeave({ start: formData.start, end: formData.end }, formData.engineerId)) {
        toast.error('Selected engineer is on leave for the chosen time range');
        return;
      }
      const locationObj = (locationObjects || []).find(l => l.name === formData.location);
      const scheduleData = {
        title: formData.title, engineer_id: formData.engineerId || null,
        location_id: locationObj?.id || null, client_id: formData.client_id || null,
        start_time: formData.start.toISOString(), end_time: formData.end.toISOString(),
        description: formData.description || '', priority: formData.priority,
        status: 'scheduled', created_by: user?.id,
      };
      editingSchedule ? await updateSchedule(editingSchedule.id, scheduleData) : await addSchedule(scheduleData);
      resetForm();
    } catch (error) { console.error('Error saving schedule:', error); }
  };

  const handleDelete = async () => {
    if (editingSchedule) {
      try { await deleteSchedule(editingSchedule.id); resetForm(); }
      catch (error) { console.error('Error deleting schedule:', error); }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', engineerId: '', location: '', client_id: null, start: new Date(), end: new Date(), description: '', priority: 'normal' });
    setEditingSchedule(null);
    setShowModal(false);
  };

  const handleSyncWithCases = async () => {
    setIsSyncing(true);
    try {
      const result = await scheduleCaseSyncService.syncAllSchedulesWithCases();
      result.success
        ? toast.success(`Synced ${result.data.syncedSchedules}/${result.data.totalSchedules} schedules`)
        : toast.error('Failed to sync schedules with cases');
    } catch { toast.error('Error syncing schedules with cases'); }
    finally { setIsSyncing(false); }
  };

  const handleSaveNewClient = async (e) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const locationObj = (locationObjects || []).find(l => l.name === newClientForm.location);
      const created = await addClient({
        name: newClientForm.name, contact_person: newClientForm.contact_person || null,
        mobile: newClientForm.mobile || null, address: newClientForm.address || null,
        location_id: locationObj?.id || null, created_by: user?.id, is_disclosed: true,
      });
      setFormData(prev => ({ ...prev, client_id: created.id }));
      setShowInlineAdd(false);
      setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' });
      toast.success('Client added');
    } catch { toast.error('Failed to add client'); }
    finally { setSavingClient(false); }
  };

  const handleEditFromPopup = () => {
    const schedule = selectedEvent?.resource?.schedule;
    if (!schedule) return;
    setSelectedEvent(null);
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title, engineerId: schedule.engineer_id || '',
      location: (locationObjects || []).find(l => l.id === schedule.location_id)?.name || '',
      client_id: schedule.client_id || null,
      start: new Date(schedule.start_time || schedule.start),
      end: new Date(schedule.end_time || schedule.end),
      description: schedule.description || '', priority: schedule.priority || 'normal',
    });
    setShowModal(true);
  };

  const handleDeleteFromPopup = async () => {
    const schedule = selectedEvent?.resource?.schedule;
    if (!schedule) return;
    try { await deleteSchedule(schedule.id); setSelectedEvent(null); toast.success('Schedule deleted'); }
    catch { toast.error('Failed to delete schedule'); }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="gcal-layout" style={{ height: '100vh' }}>

      {/* ── TOP BAR ── */}
      <div className="gcal-topbar">
        <span className="gcal-title">Schedule Calendar</span>
        <div className="gcal-divider" />
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
        <div className="gcal-divider" />
        <button className="glass-btn-secondary" onClick={handleSyncWithCases} disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RotateCcw size={13} /> {isSyncing ? 'Syncing…' : 'Sync'}
        </button>
        <button className="glass-btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Plus size={13} /> Add Schedule
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="gcal-body">

        {/* Sidebar */}
        <div className="gcal-sidebar">
          <MiniCalendar currentDate={currentDate} onDateClick={setCurrentDate} currentView={currentView} />
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
            selectable
            selectMirror
            scrollTime="08:00:00"
            nowIndicator
            height="100%"
            select={({ start, end }) => {
              setFormData(prev => ({ ...prev, start, end }));
              setShowModal(true);
            }}
            eventClick={({ event }) => {
              const resource = event.extendedProps;
              if (typeof event.id === 'string' && event.id.startsWith('leave-')) return;
              setSelectedEvent({ id: event.id, title: event.title, start: event.start, end: event.end, resource });
              setShowDeleteConfirm(false);
            }}
            datesSet={({ start, view }) => {
              setCurrentDate(start);
              setCurrentView(view.type);
            }}
            eventContent={({ event }) => {
              const resource = event.extendedProps || {};
              const { engineer, engineerStatus } = resource;
              const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', padding: '1px 2px' }}>
                  {statusCfg && <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {event.title}{engineer ? ` — ${engineer.name}` : ''}
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* ── ADD / EDIT SCHEDULE MODAL ── */}
      {showModal && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.125rem', fontWeight: 700 }}>
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Title *</div>
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required className="glass-input" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Engineer *</div>
                <select value={formData.engineerId} onChange={e => setFormData(p => ({ ...p, engineerId: e.target.value }))} className="glass-select">
                  <option value="">Select Engineer</option>
                  {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name} — {eng.location}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Location</div>
                <LocationCombobox value={formData.location} onChange={val => setFormData(p => ({ ...p, location: val }))} locations={locations} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Client</div>
                <select value={formData.client_id || ''} onChange={e => { setFormData(p => ({ ...p, client_id: e.target.value ? parseInt(e.target.value) : null })); setShowInlineAdd(false); }} className="glass-select">
                  <option value="">Select Client (optional)</option>
                  {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!showInlineAdd && (
                  <button type="button" onClick={() => setShowInlineAdd(true)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#a78bfa', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    + Add new client
                  </button>
                )}
                {showInlineAdd && (
                  <div style={{ marginTop: 12, padding: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10 }}>
                    <div style={{ marginBottom: 10 }}>
                      <div className="section-label">Name *</div>
                      <input type="text" required value={newClientForm.name} onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))} className="glass-input" placeholder="Hospital / Clinic name" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div className="section-label">Contact person</div>
                        <input type="text" value={newClientForm.contact_person} onChange={e => setNewClientForm(p => ({ ...p, contact_person: e.target.value }))} className="glass-input" placeholder="Dr. Name" />
                      </div>
                      <div>
                        <div className="section-label">Mobile</div>
                        <input type="tel" value={newClientForm.mobile} onChange={e => setNewClientForm(p => ({ ...p, mobile: e.target.value }))} className="glass-input" placeholder="10-digit" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div className="section-label">Address</div>
                      <input type="text" value={newClientForm.address} onChange={e => setNewClientForm(p => ({ ...p, address: e.target.value }))} className="glass-input" placeholder="Hospital address" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div className="section-label">Location</div>
                      <LocationCombobox value={newClientForm.location} onChange={val => setNewClientForm(p => ({ ...p, location: val }))} locations={locations} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="glass-btn-secondary" onClick={() => { setShowInlineAdd(false); setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' }); }} style={{ fontSize: 12, padding: '6px 12px' }}>Cancel</button>
                      <button type="button" className="glass-btn-primary" disabled={savingClient} onClick={handleSaveNewClient} style={{ fontSize: 12, padding: '6px 12px' }}>{savingClient ? 'Saving...' : 'Save & Select'}</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Start Time *</div>
                  <input type="datetime-local" value={moment(formData.start).format('YYYY-MM-DDTHH:mm')} onChange={e => setFormData(p => ({ ...p, start: new Date(e.target.value) }))} required className="glass-input" />
                </div>
                <div>
                  <div className="section-label">End Time *</div>
                  <input type="datetime-local" value={moment(formData.end).format('YYYY-MM-DDTHH:mm')} onChange={e => setFormData(p => ({ ...p, end: new Date(e.target.value) }))} required className="glass-input" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Priority</div>
                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} className="glass-select">
                  {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Description</div>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows="3" className="glass-textarea" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                {editingSchedule && (
                  <button type="button" className="glass-btn-danger" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button type="button" className="glass-btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="glass-btn-primary">{editingSchedule ? 'Update' : 'Create'} Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL POPUP ── */}
      {selectedEvent && (() => {
        const { schedule, engineer, engineerStatus, linkedCase } = selectedEvent.resource || {};
        const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
        const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '—';
        const client = schedule?.client_id ? (clients || []).find(c => c.id === schedule.client_id) : null;
        const caseSC = linkedCase ? STATUS_COLORS[linkedCase.status] : null;
        const startD = new Date(schedule?.start_time || schedule?.start);
        const endD = new Date(schedule?.end_time || schedule?.end);
        const fmt = d => d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <>
            <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,12,41,0.7)', zIndex: 200 }} />
            <div className="event-popup-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{selectedEvent.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{fmt(startD)} – {endD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280', color: '#fff' }}>{schedule?.priority || 'normal'}</span>
                {caseSC && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: `1px solid ${caseSC.border}`, color: caseSC.border }}>{caseSC.label}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}><span>📍</span><span>{locationName}</span></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                {engineer ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: engineerColorMap[engineer.id] || 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {engineer.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{engineer.name}</div>
                      {statusCfg && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />{statusCfg.label}</div>}
                    </div>
                  </>
                ) : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}
              </div>
              {linkedCase && (
                <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: caseSC ? `3px solid ${caseSC.border}` : 'none' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>LINKED CASE</div>
                  <div style={{ fontSize: 13, color: '#fff' }}>#{linkedCase.id} — {linkedCase.title || linkedCase.description?.slice(0, 40) || 'Case'}</div>
                </div>
              )}
              {client && <div style={{ display: 'flex', gap: 8, marginBottom: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}><span>🏢</span><span>{client.name}</span></div>}
              {schedule?.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>{schedule.description}</div>}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
              {showDeleteConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>Delete this schedule?</span>
                  <button className="glass-btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="glass-btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleDeleteFromPopup}>Confirm</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="glass-btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={handleEditFromPopup}>Edit</button>
                  <button className="glass-btn-danger" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default ScheduleCalendar;
