import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import scheduleCaseSyncService from '../services/scheduleCaseSync';
import toast from 'react-hot-toast';
import { getEngineerStatus, ENGINEER_STATUS_CONFIG, STATUS_COLORS } from './dashboard/dashboardUtils';
// import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

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

const ScheduleCalendar = () => {
  const {
    schedules,
    engineers,
    cases,
    clients,
    addClient,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getEngineerById,
    locations,
    locationObjects,
    isEngineerOnLeave,
    leaves
  } = useEngineerContext();
  const { user, profile } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '', contact_person: '', mobile: '', address: '', location: ''
  });
  const [savingClient, setSavingClient] = useState(false);
  const [currentView, setCurrentView] = useState('week');
  const [formData, setFormData] = useState({
    title: '',
    engineerId: '',
    location: '',
    client_id: null,
    start: new Date(),
    end: new Date(),
    description: '',
    priority: 'normal'
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelectedEvent(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // locations is now coming from context
  const priorities = [
    { value: 'low',    label: 'Low',    color: '#22c55e' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'high',   label: 'High',   color: '#f59e0b' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444' }
  ];

  const PRIORITY_COLORS = {
    urgent: '#ef4444',
    high:   '#f59e0b',
    normal: '#3b82f6',
    low:    '#22c55e',
  };

  // Convert schedules and leaves to calendar events
  const scheduleEvents = schedules.map(schedule => {
    const engineer = getEngineerById(schedule.engineer_id);
    const engineerStatus = engineer ? getEngineerStatus(engineer, schedules) : null;
    const linkedCase = cases?.find(c => c.id === schedule.case_id) || null;
    return {
      id: schedule.id,
      title: schedule.title,
      start: new Date(schedule.start_time || schedule.start),
      end: new Date(schedule.end_time || schedule.end),
      resource: {
        schedule,       // full source object
        engineer,
        engineerStatus,
        linkedCase,
      }
    };
  });

  const leaveEvents = (leaves || []).map(leave => {
    const engineer = getEngineerById(leave.engineer_id);
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    end.setHours(23,59,59,999);
    return {
      id: `leave-${leave.id}`,
      title: `Leave - ${engineer?.name || 'Unknown'}`,
      start,
      end,
      allDay: true,
      resource: {
        engineer,
        location: engineer?.location,
        priority: 'low',
        description: leave.reason || 'Leave',
        priorityColor: '#6c757d'
      }
    };
  });

  const events = [...scheduleEvents, ...leaveEvents];

  const handleSelectSlot = ({ start, end }) => {
    setFormData(prev => ({
      ...prev,
      start: start,
      end: end
    }));
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    // Leave events: do nothing
    if (typeof event.id === 'string' && event.id.startsWith('leave-')) return;

    // Open popup
    setSelectedEvent(event);
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Block if engineer is on leave during the selected time range
      if (formData.engineerId && isEngineerOnLeave({ start: formData.start, end: formData.end }, formData.engineerId)) {
        toast.error('Selected engineer is on leave for the chosen time range');
        return;
      }

      const locationObj = (locationObjects || []).find(l => l.name === formData.location);
      const scheduleData = {
        title: formData.title,
        engineer_id: formData.engineerId || null,
        location_id: locationObj?.id || null,
        client_id: formData.client_id || null,
        start_time: formData.start.toISOString(),
        end_time: formData.end.toISOString(),
        description: formData.description || '',
        priority: formData.priority,
        status: 'scheduled',
        created_by: user?.id
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData);
      } else {
        await addSchedule(scheduleData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDelete = async () => {
    if (editingSchedule) {
      try {
        await deleteSchedule(editingSchedule.id);
        resetForm();
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      engineerId: '',
      location: '',
      client_id: null,
      start: new Date(),
      end: new Date(),
      description: '',
      priority: 'normal'
    });
    setEditingSchedule(null);
    setShowModal(false);
  };

  const handleSyncWithCases = async () => {
    setIsSyncing(true);
    try {
      const result = await scheduleCaseSyncService.syncAllSchedulesWithCases();
      if (result.success) {
        toast.success(`Successfully synced ${result.data.syncedSchedules}/${result.data.totalSchedules} schedules with cases!`);
      } else {
        toast.error('Failed to sync schedules with cases');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Error syncing schedules with cases');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNewClient = async (e) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const locationObj = (locationObjects || []).find(l => l.name === newClientForm.location);
      const created = await addClient({
        name: newClientForm.name,
        contact_person: newClientForm.contact_person || null,
        mobile: newClientForm.mobile || null,
        address: newClientForm.address || null,
        location_id: locationObj?.id || null,
        created_by: user?.id,
        is_disclosed: true
      });
      setFormData(prev => ({ ...prev, client_id: created.id }));
      setShowInlineAdd(false);
      setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' });
      toast.success('Client added');
    } catch (err) {
      toast.error('Failed to add client');
    } finally {
      setSavingClient(false);
    }
  };

  const handleEditFromPopup = () => {
    const schedule = selectedEvent?.resource?.schedule;
    if (!schedule) return;
    setSelectedEvent(null);
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      engineerId: schedule.engineer_id || '',
      location: (locationObjects || []).find(l => l.id === schedule.location_id)?.name || '',
      client_id: schedule.client_id || null,
      start: new Date(schedule.start_time || schedule.start),
      end: new Date(schedule.end_time || schedule.end),
      description: schedule.description || '',
      priority: schedule.priority || 'normal'
    });
    setShowModal(true);
  };

  const handleDeleteFromPopup = async () => {
    const schedule = selectedEvent?.resource?.schedule;
    if (!schedule) return;
    try {
      await deleteSchedule(schedule.id);
      setSelectedEvent(null);
      toast.success('Schedule deleted');
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  const isEngineerRole = profile?.role === 'engineer';

  const eventPropGetter = (event) => {
    if (typeof event.id === 'string' && event.id.startsWith('leave-')) {
      return {
        style: {
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px dashed rgba(255,255,255,0.25)',
          color: 'rgba(255,255,255,0.45)',
          borderRadius: 4,
          opacity: 0.7,
          fontSize: 11,
        }
      };
    }
    const { schedule, linkedCase } = event.resource || {};
    const priority = schedule?.priority || 'normal';
    const isOwn = schedule?.engineer_id === user?.id;
    const dim = isEngineerRole && !isOwn;
    const caseAccent = linkedCase ? STATUS_COLORS[linkedCase.status]?.border : null;

    return {
      style: {
        backgroundColor: PRIORITY_COLORS[priority] || '#6b7280',
        border: 'none',
        borderLeft: caseAccent ? `3px solid ${caseAccent}` : undefined,
        borderRadius: 4,
        opacity: dim ? 0.5 : 1,
        fontSize: 11,
        color: '#fff',
      }
    };
  };

  const CustomEvent = ({ event }) => {
    const { engineer, engineerStatus } = event.resource || {};
    const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
    const isLeave = typeof event.id === 'string' && event.id.startsWith('leave-');

    // Compact in all views except agenda (and always compact for leave blocks)
    if (isLeave || currentView !== 'agenda') {
      // Compact: status dot + title
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', padding: '1px 2px' }}>
          {statusCfg && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
            {event.title}{engineer ? ` — ${engineer.name}` : ''}
          </span>
        </div>
      );
    }

    // Agenda: verbose
    const { schedule, linkedCase } = event.resource || {};
    const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '';
    return (
      <div style={{ padding: '2px 4px' }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{event.title}</div>
        {locationName && <div style={{ fontSize: 10, opacity: 0.8 }}>📍 {locationName}</div>}
        {engineer && (
          <div style={{ fontSize: 10, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
            👤 {engineer.name}
            {statusCfg && <span style={{ color: statusCfg.color }}>· {statusCfg.label}</span>}
          </div>
        )}
        {linkedCase && (
          <div style={{ fontSize: 10, opacity: 0.8 }}>🔗 Case #{linkedCase.id}</div>
        )}
        <div style={{ marginTop: 3 }}>
          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280' }}>
            {schedule?.priority || 'normal'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700 }}>Schedule Calendar</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="glass-btn-secondary"
            onClick={handleSyncWithCases}
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={16} />
            {isSyncing ? 'Syncing...' : 'Sync with Cases'}
          </button>
          <button
            className="glass-btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            Add Schedule
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'clamp(400px, 65vh, 700px)' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventPropGetter}
          components={{
            event: CustomEvent
          }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
          onView={v => setCurrentView(v)}
        />
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.125rem', fontWeight: 700 }}>
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button
                onClick={resetForm}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Title *</div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="glass-input"
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Engineer *</div>
                <select
                  value={formData.engineerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, engineerId: e.target.value }))}
                  className="glass-select"
                >
                  <option value="">Select Engineer</option>
                  {engineers.map(engineer => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name} - {engineer.location}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Location</div>
                <LocationCombobox
                  value={formData.location}
                  onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                  locations={locations}
                />
              </div>

              {/* Client field */}
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Client</div>
                <select
                  value={formData.client_id || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, client_id: e.target.value ? parseInt(e.target.value) : null }));
                    setShowInlineAdd(false);
                  }}
                  className="glass-select"
                >
                  <option value="">Select Client (optional)</option>
                  {(clients || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Inline add toggle */}
                {!showInlineAdd && (
                  <button
                    type="button"
                    onClick={() => setShowInlineAdd(true)}
                    style={{ marginTop: 8, background: 'none', border: 'none', color: '#a78bfa', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    + Add new client
                  </button>
                )}

                {/* Inline expansion */}
                {showInlineAdd && (
                  <div style={{ marginTop: 12, padding: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10 }}>
                    <div>
                      <div style={{ marginBottom: 10 }}>
                        <div className="section-label">Name *</div>
                        <input type="text" required value={newClientForm.name}
                          onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))}
                          className="glass-input" placeholder="Hospital / Clinic name" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div className="section-label">Contact person</div>
                          <input type="text" value={newClientForm.contact_person}
                            onChange={e => setNewClientForm(p => ({ ...p, contact_person: e.target.value }))}
                            className="glass-input" placeholder="Dr. Name" />
                        </div>
                        <div>
                          <div className="section-label">Mobile</div>
                          <input type="tel" value={newClientForm.mobile}
                            onChange={e => setNewClientForm(p => ({ ...p, mobile: e.target.value }))}
                            className="glass-input" placeholder="10-digit" />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div className="section-label">Address</div>
                        <input type="text" value={newClientForm.address}
                          onChange={e => setNewClientForm(p => ({ ...p, address: e.target.value }))}
                          className="glass-input" placeholder="Hospital address" />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div className="section-label">Location</div>
                        <LocationCombobox
                          value={newClientForm.location}
                          onChange={val => setNewClientForm(p => ({ ...p, location: val }))}
                          locations={locations}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="glass-btn-secondary"
                          onClick={() => { setShowInlineAdd(false); setNewClientForm({ name: '', contact_person: '', mobile: '', address: '', location: '' }); }}
                          style={{ fontSize: 12, padding: '6px 12px' }}>Cancel</button>
                        <button type="button" className="glass-btn-primary" disabled={savingClient}
                          onClick={handleSaveNewClient}
                          style={{ fontSize: 12, padding: '6px 12px' }}>
                          {savingClient ? 'Saving...' : 'Save & Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Start Time *</div>
                  <input
                    type="datetime-local"
                    value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      start: new Date(e.target.value)
                    }))}
                    required
                    className="glass-input"
                  />
                </div>

                <div>
                  <div className="section-label">End Time *</div>
                  <input
                    type="datetime-local"
                    value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      end: new Date(e.target.value)
                    }))}
                    required
                    className="glass-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Priority</div>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="glass-select"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Description</div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="glass-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                {editingSchedule && (
                  <button
                    type="button"
                    className="glass-btn-danger"
                    onClick={handleDelete}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="glass-btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="glass-btn-primary">
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event detail popup */}
      {selectedEvent && (() => {
        const { schedule, engineer, engineerStatus, linkedCase } = selectedEvent.resource || {};
        const statusCfg = engineerStatus ? ENGINEER_STATUS_CONFIG[engineerStatus] : null;
        const locationName = (locationObjects || []).find(l => l.id === schedule?.location_id)?.name || schedule?.location || '—';
        const client = schedule?.client_id ? (clients || []).find(c => c.id === schedule.client_id) : null;
        const caseSC = linkedCase ? STATUS_COLORS[linkedCase.status] : null;
        const startD = new Date(schedule?.start_time || schedule?.start);
        const endD = new Date(schedule?.end_time || schedule?.end);
        const fmt = (d) => d.toLocaleString('en-GB', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSelectedEvent(null)}
              style={{ position:'fixed', inset:0, background:'rgba(15,12,41,0.7)', zIndex:200 }}
            />
            {/* Panel */}
            <div className="event-popup-panel">
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>{selectedEvent.title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{fmt(startD)} – {endD.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <button onClick={() => setSelectedEvent(null)}
                  style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:20, lineHeight:1, padding:0 }}>×</button>
              </div>

              {/* Priority + status badges */}
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background: PRIORITY_COLORS[schedule?.priority] || '#6b7280', color:'#fff' }}>
                  {schedule?.priority || 'normal'}
                </span>
                {caseSC && (
                  <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, border:`1px solid ${caseSC.border}`, color:caseSC.border }}>
                    {caseSC.label}
                  </span>
                )}
              </div>

              {/* Location */}
              <div style={{ display:'flex', gap:8, marginBottom:10, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
                <span>📍</span><span>{locationName}</span>
              </div>

              {/* Engineer */}
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, padding:'10px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10 }}>
                {engineer ? (
                  <>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {engineer.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{engineer.name}</div>
                      {statusCfg && (
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:statusCfg.color, display:'inline-block' }} />
                          {statusCfg.label}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.3)' }}>Unassigned</span>
                )}
              </div>

              {/* Linked case */}
              {linkedCase && (
                <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10, borderLeft: caseSC ? `3px solid ${caseSC.border}` : 'none' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>LINKED CASE</div>
                  <div style={{ fontSize:13, color:'#fff' }}>#{linkedCase.id} — {linkedCase.title || linkedCase.description?.slice(0,40) || 'Case'}</div>
                </div>
              )}

              {/* Client */}
              {client && (
                <div style={{ display:'flex', gap:8, marginBottom:10, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
                  <span>🏢</span><span>{client.name}</span>
                </div>
              )}

              {/* Description */}
              {schedule?.description && (
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:12, lineHeight:1.6 }}>
                  {schedule.description}
                </div>
              )}

              {/* Actions */}
              <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'12px 0' }} />
              {showDeleteConfirm ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', flex:1 }}>Delete this schedule?</span>
                  <button className="glass-btn-secondary" style={{ fontSize:12, padding:'6px 12px' }}
                    onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="glass-btn-danger" style={{ fontSize:12, padding:'6px 12px' }}
                    onClick={handleDeleteFromPopup}>Confirm</button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                  <button className="glass-btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}
                    onClick={handleEditFromPopup}>Edit</button>
                  <button className="glass-btn-danger" style={{ fontSize:12, padding:'6px 14px' }}
                    onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                </div>
              )}
            </div>
          </>
        );
      })()}

      <style jsx>{`
        .custom-event {
          padding: 2px 4px;
        }

        .event-title {
          font-weight: 600;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .event-details {
          font-size: 10px;
          opacity: 0.9;
        }

        .event-location,
        .event-engineer {
          display: block;
          margin: 1px 0;
        }

        @media (max-width: 768px) {
          .glass-modal {
            width: 95vw !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ScheduleCalendar;
