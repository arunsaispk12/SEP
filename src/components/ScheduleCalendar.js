import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEngineerContext } from '../context/EngineerContext';
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
    isEngineerOnLeave,
    leaves
  } = useEngineerContext();
  
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
    priority: 'medium'
  });

  // locations is now coming from context
  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' }
  ];

  // Convert schedules and leaves to calendar events
  const scheduleEvents = schedules.map(schedule => {
    const engineer = getEngineerById(schedule.engineerId);
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
        engineerId: schedule.engineerId,
        location: schedule.location,
        start: new Date(schedule.start),
        end: new Date(schedule.end),
        description: schedule.description,
        priority: schedule.priority
      });
      setShowModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const locationId = locations.findIndex(loc => loc === formData.location) + 1;
      const scheduleData = {
        ...formData,
        engineer_id: formData.engineerId,
        location_id: locationId,
        start_time: formData.start.toISOString(),
        end_time: formData.end.toISOString()
      };

      // Block if engineer is on leave during the selected time range
      if (isEngineerOnLeave({ start: formData.start, end: formData.end }, formData.engineerId)) {
        toast.error('Selected engineer is on leave for the chosen time range');
        return;
      }

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
      priority: 'medium'
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
      <div className="calendar-header">
        <h2>Schedule Calendar</h2>
        <div className="header-actions">
          <button
            className="btn secondary"
            onClick={handleSyncWithCases}
            disabled={isSyncing}
          >
            <RotateCcw size={16} />
            {isSyncing ? 'Syncing...' : 'Sync with Cases'}
          </button>
          <button
            className="btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add Schedule
          </button>
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
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
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h2>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Engineer *</label>
                <select
                  value={formData.engineerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, engineerId: parseInt(e.target.value) }))}
                  required
                >
                  <option value="">Select Engineer</option>
                  {engineers.map(engineer => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name} - {engineer.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      start: new Date(e.target.value) 
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="datetime-local"
                    value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      end: new Date(e.target.value) 
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                {editingSchedule && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn">
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .calendar-header h2 {
          margin: 0;
          color: #333;
        }

        .calendar-wrapper {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .modal-actions .btn {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ScheduleCalendar;
