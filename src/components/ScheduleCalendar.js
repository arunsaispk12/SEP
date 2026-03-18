import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import scheduleCaseSyncService from '../services/scheduleCaseSync';
import toast from 'react-hot-toast';
// import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const ScheduleCalendar = () => {
  const {
    schedules,
    engineers,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getEngineerById,
    locations,
    locationObjects,
    isEngineerOnLeave,
    leaves
  } = useEngineerContext();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    engineerId: '',
    location: '',
    start: new Date(),
    end: new Date(),
    description: '',
    priority: 'normal'
  });

  // locations is now coming from context
  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'normal', label: 'Normal', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' },
    { value: 'urgent', label: 'Urgent', color: '#7B61FF' }
  ];

  // Convert schedules and leaves to calendar events
  const scheduleEvents = schedules.map(schedule => {
    const engineer = getEngineerById(schedule.engineer_id);
    const priority = priorities.find(p => p.value === schedule.priority);

    return {
      id: schedule.id,
      title: `${schedule.title} - ${engineer?.name || 'Unknown'}`,
      start: new Date(schedule.start),
      end: new Date(schedule.end),
      resource: {
        engineer: engineer,
        location: schedule.location,
        priority: schedule.priority,
        description: schedule.description,
        priorityColor: priority?.color || '#6c757d'
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
    const schedule = schedules.find(s => s.id === event.id);
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        title: schedule.title,
        engineerId: schedule.engineer_id || '',
        location: schedule.location || '',
        start: new Date(schedule.start || schedule.start_time),
        end: new Date(schedule.end || schedule.end_time),
        description: schedule.description || '',
        priority: schedule.priority || 'normal'
      });
      setShowModal(true);
    }
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

  const eventStyleGetter = (event) => {
    const priorityColor = event.resource?.priorityColor || '#6c757d';
    return {
      style: {
        backgroundColor: priorityColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        fontSize: '12px'
      }
    };
  };

  const CustomEvent = ({ event }) => {
    const engineer = event.resource?.engineer;
    const location = event.resource?.location;

    return (
      <div className="custom-event">
        <div className="event-title">{event.title}</div>
        <div className="event-details">
          <span className="event-location">📍 {location}</span>
          {engineer && (
            <span className="event-engineer">👤 {engineer.name}</span>
          )}
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
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent
          }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
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
                <div className="section-label">Location *</div>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                  className="glass-select"
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
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
