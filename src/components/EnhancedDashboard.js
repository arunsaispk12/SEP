import React, { useState, useMemo } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import WeeklyCalendar from './WeeklyCalendar';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  Grid,
  User,
  Edit
} from 'lucide-react';

// Cases View Component
const CasesView = ({ 
  viewMode, 
  selectedDate, 
  selectedLocation, 
  selectedEngineer, 
  filteredData, 
  engineers, 
  locations 
}) => {
  const { addSchedule } = useEngineerContext();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Group cases by date for different view modes
  const groupedCases = useMemo(() => {
    const { cases } = filteredData;
    
    if (viewMode === 'daily') {
      const dateStr = selectedDate.toDateString();
      return { [dateStr]: cases };
    }
    
    if (viewMode === 'weekly') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const grouped = {};
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayStr = day.toDateString();
        grouped[dayStr] = cases.filter(case_ => {
          const caseDate = new Date(case_.created_at);
          return caseDate.toDateString() === dayStr;
        });
      }
      return grouped;
    }
    
    if (viewMode === 'monthly') {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      const grouped = {};
      
      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toDateString();
        grouped[dayStr] = cases.filter(case_ => {
          const caseDate = new Date(case_.created_at);
          return caseDate.toDateString() === dayStr;
        });
      }
      return grouped;
    }
    
    return {};
  }, [filteredData, viewMode, selectedDate]);

  const handleScheduleCase = (case_) => {
    setSelectedCase(case_);
    setShowScheduleModal(true);
  };

  const handleCreateSchedule = (scheduleData) => {
    if (selectedCase) {
      addSchedule({
        ...scheduleData,
        title: `Case: ${selectedCase.title}`,
        description: `Scheduled case: ${selectedCase.description}`,
        engineer_id: selectedCase.assigned_engineer_id,
        location_id: selectedCase.location_id
      });
      setShowScheduleModal(false);
      setSelectedCase(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="cases-view">
      <div className="cases-header">
        <h2>Cases View - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</h2>
        <div className="cases-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredData.cases.length}</span>
            <span className="stat-label">Total Cases</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredData.cases.filter(c => c.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredData.cases.filter(c => c.status === 'in-progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredData.cases.filter(c => c.status === 'pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <div className="cases-content">
        {Object.entries(groupedCases).map(([dateStr, dayCases]) => (
          <div key={dateStr} className="cases-day-group">
            <div className="day-header">
              <h3>{new Date(dateStr).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</h3>
              <span className="case-count">{dayCases.length} cases</span>
            </div>
            
            <div className="cases-grid">
              {dayCases.map(case_ => {
                const engineer = engineers.find(e => e.id === case_.assigned_engineer_id);
                const location = locations.find(l => l.id === case_.location_id);
                
                return (
                  <div key={case_.id} className="case-card">
                    <div className="case-card-header">
                      <h4>{case_.title}</h4>
                      <div className="case-badges">
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(case_.priority) }}
                        >
                          {case_.priority}
                        </span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(case_.status) }}
                        >
                          {case_.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="case-card-body">
                      <p className="case-description">{case_.description}</p>
                      
                      <div className="case-details">
                        {engineer && (
                          <div className="case-detail-item">
                            <User size={14} />
                            <span>{engineer.name}</span>
                          </div>
                        )}
                        {location && (
                          <div className="case-detail-item">
                            <MapPin size={14} />
                            <span>{location.name}</span>
                          </div>
                        )}
                        <div className="case-detail-item">
                          <Clock size={14} />
                          <span>{new Date(case_.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="case-card-actions">
                      <button 
                        className="action-btn schedule-btn"
                        onClick={() => handleScheduleCase(case_)}
                        title="Schedule this case"
                      >
                        <Calendar size={14} />
                        Schedule
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => {/* Handle edit */}}
                        title="Edit case"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedCase && (
        <ScheduleModal
          case_={selectedCase}
          engineers={engineers}
          locations={locations}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedCase(null);
          }}
          onSchedule={handleCreateSchedule}
        />
      )}

      <style jsx>{`
        .cases-view {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .cases-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .cases-stats {
          display: flex;
          gap: 30px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cases-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .cases-day-group {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .day-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
        }

        .case-count {
          background: #3b82f6;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        .case-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: white;
          transition: all 0.2s;
        }

        .case-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .case-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .case-card-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 16px;
          flex: 1;
          margin-right: 12px;
        }

        .case-badges {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .priority-badge, .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .case-card-body {
          margin-bottom: 16px;
        }

        .case-description {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .case-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .case-detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 12px;
        }

        .case-card-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .schedule-btn {
          background: #3b82f6;
          color: white;
        }

        .schedule-btn:hover {
          background: #2563eb;
        }

        .edit-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .edit-btn:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

// Schedule Modal Component
const ScheduleModal = ({ case_, engineers, locations, onClose, onSchedule }) => {
  const [scheduleData, setScheduleData] = useState({
    start_time: '',
    end_time: '',
    priority: 'medium',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSchedule(scheduleData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Schedule Case: {case_.title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={scheduleData.start_time}
              onChange={(e) => setScheduleData({...scheduleData, start_time: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>End Time</label>
            <input
              type="datetime-local"
              value={scheduleData.end_time}
              onChange={(e) => setScheduleData({...scheduleData, end_time: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Priority</label>
            <select
              value={scheduleData.priority}
              onChange={(e) => setScheduleData({...scheduleData, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={scheduleData.description}
              onChange={(e) => setScheduleData({...scheduleData, description: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Schedule
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

const EnhancedDashboard = () => {
  const { 
    engineers, 
    cases, 
    schedules, 
    locations 
  } = useEngineerContext();
  
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [displayMode, setDisplayMode] = useState('overview'); // overview, calendar, cases
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedEngineer, setSelectedEngineer] = useState('all');

  // Get date range based on view mode
  const getDateRange = () => {
    const date = new Date(selectedDate);
    
    switch (viewMode) {
      case 'weekly':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { start: startOfWeek, end: endOfWeek };
      
      case 'monthly':
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return { start: startOfMonth, end: endOfMonth };
      
      default:
        return { start: date, end: date };
    }
  };

  // Filter data based on selected criteria
  const filteredData = useMemo(() => {
    const { start, end } = getDateRange();
    
    let filteredSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start || schedule.start_time);
      return scheduleDate >= start && scheduleDate <= end;
    });

    let filteredCases = cases.filter(case_ => {
      const caseDate = new Date(case_.created_at);
      return caseDate >= start && caseDate <= end;
    });

    // Apply location filter
    if (selectedLocation !== 'all') {
      filteredSchedules = filteredSchedules.filter(s => s.location === selectedLocation);
      filteredCases = filteredCases.filter(c => c.location === selectedLocation);
    }

    // Apply engineer filter
    if (selectedEngineer !== 'all') {
      const engineerId = parseInt(selectedEngineer);
      filteredSchedules = filteredSchedules.filter(s => s.engineer_id === engineerId);
      filteredCases = filteredCases.filter(c => c.assigned_engineer_id === engineerId);
    }

    return { schedules: filteredSchedules, cases: filteredCases };
  }, [schedules, cases, selectedDate, viewMode, selectedLocation, selectedEngineer]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const { schedules, cases } = filteredData;
    
    const totalCases = cases.length;
    const completedCases = cases.filter(c => c.status === 'completed').length;
    const inProgressCases = cases.filter(c => c.status === 'in-progress').length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;
    
    const totalSchedules = schedules.length;
    const highPriorityCases = cases.filter(c => c.priority === 'high').length;
    
    // Engineer utilization
    const engineerUtilization = engineers.map(engineer => {
      const engineerCases = cases.filter(c => c.assigned_engineer_id === engineer.id);
      const engineerSchedules = schedules.filter(s => s.engineer_id === engineer.id);
      return {
        ...engineer,
        caseCount: engineerCases.length,
        scheduleCount: engineerSchedules.length,
        utilization: engineerCases.length + engineerSchedules.length
      };
    });

    return {
      totalCases,
      completedCases,
      inProgressCases,
      pendingCases,
      totalSchedules,
      highPriorityCases,
      engineerUtilization,
      completionRate: totalCases > 0 ? (completedCases / totalCases * 100).toFixed(1) : 0
    };
  }, [filteredData, engineers]);

  // Get engineer location summary
  const getLocationSummary = () => {
    const locationMap = {};
    
    engineers.forEach(engineer => {
      const location = engineer.currentLocation || engineer.location;
      if (!locationMap[location]) {
        locationMap[location] = {
          engineers: [],
          cases: 0,
          schedules: 0
        };
      }
      locationMap[location].engineers.push(engineer);
    });

    // Add case and schedule counts per location
    filteredData.cases.forEach(case_ => {
      if (locationMap[case_.location]) {
        locationMap[case_.location].cases++;
      }
    });

    filteredData.schedules.forEach(schedule => {
      if (locationMap[schedule.location]) {
        locationMap[schedule.location].schedules++;
      }
    });

    return locationMap;
  };

  const locationSummary = getLocationSummary();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon completed" />;
      case 'in-progress':
        return <Clock className="status-icon in-progress" />;
      case 'pending':
        return <AlertCircle className="status-icon pending" />;
      default:
        return <XCircle className="status-icon" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'in-progress':
        return '#17a2b8';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const formatDateRange = () => {
    const { start, end } = getDateRange();
    
    switch (viewMode) {
      case 'weekly':
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      case 'monthly':
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return start.toLocaleDateString();
    }
  };

  return (
    <div className="enhanced-dashboard">
      {/* Header Controls */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Manager Dashboard</h1>
          <p className="date-range">{formatDateRange()}</p>
        </div>
        
        <div className="header-controls">
          <div className="view-mode-selector">
            <button 
              className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              <Calendar size={16} />
              Daily
            </button>
            <button 
              className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              <Calendar size={16} />
              Weekly
            </button>
            <button 
              className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              <Calendar size={16} />
              Monthly
            </button>
          </div>

          <div className="display-mode-selector">
            <button 
              className={`display-btn ${displayMode === 'overview' ? 'active' : ''}`}
              onClick={() => setDisplayMode('overview')}
            >
              <Grid size={16} />
              Overview
            </button>
            <button 
              className={`display-btn ${displayMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setDisplayMode('calendar')}
            >
              <Calendar size={16} />
              Calendar
            </button>
            <button 
              className={`display-btn ${displayMode === 'cases' ? 'active' : ''}`}
              onClick={() => setDisplayMode('cases')}
            >
              <AlertCircle size={16} />
              Cases
            </button>
          </div>
          
          <div className="date-picker">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <Users size={16} />
          <select
            value={selectedEngineer}
            onChange={(e) => setSelectedEngineer(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Engineers</option>
            {engineers.map(engineer => (
              <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{summaryStats.totalCases}</div>
            <div className="stat-label">Total Cases</div>
          </div>
        </div>
        
        <div className="stat-card completed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{summaryStats.completedCases}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        <div className="stat-card in-progress">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{summaryStats.inProgressCases}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{summaryStats.pendingCases}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{summaryStats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{summaryStats.totalSchedules}</div>
            <div className="stat-label">Schedules</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {displayMode === 'calendar' && viewMode === 'weekly' ? (
        <WeeklyCalendar />
      ) : displayMode === 'cases' ? (
        <CasesView 
          viewMode={viewMode}
          selectedDate={selectedDate}
          selectedLocation={selectedLocation}
          selectedEngineer={selectedEngineer}
          filteredData={filteredData}
          engineers={engineers}
          locations={locations}
        />
      ) : (
        <div className="dashboard-content">
        {/* Location Overview */}
        <div className="location-overview">
          <h2>Location Overview</h2>
          <div className="location-grid">
            {Object.entries(locationSummary).map(([location, data]) => (
              <div key={location} className="location-card">
                <div className="location-header">
                  <MapPin size={20} />
                  <h3>{location}</h3>
                </div>
                <div className="location-stats">
                  <div className="stat-item">
                    <Users size={16} />
                    <span>{data.engineers.length} Engineers</span>
                  </div>
                  <div className="stat-item">
                    <Activity size={16} />
                    <span>{data.cases} Cases</span>
                  </div>
                  <div className="stat-item">
                    <Calendar size={16} />
                    <span>{data.schedules} Schedules</span>
                  </div>
                </div>
                <div className="engineers-list">
                  {data.engineers.map(engineer => (
                    <div key={engineer.id} className="engineer-item">
                      <div className={`status-dot ${engineer.is_available ? 'available' : 'busy'}`}></div>
                      <span>{engineer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engineer Utilization */}
        <div className="engineer-utilization">
          <h2>Engineer Utilization</h2>
          <div className="utilization-grid">
            {summaryStats.engineerUtilization.map(engineer => (
              <div key={engineer.id} className="utilization-card">
                <div className="engineer-info">
                  <h4>{engineer.name}</h4>
                  <p>{engineer.currentLocation || engineer.location}</p>
                </div>
                <div className="utilization-stats">
                  <div className="util-stat">
                    <span className="label">Cases:</span>
                    <span className="value">{engineer.caseCount}</span>
                  </div>
                  <div className="util-stat">
                    <span className="label">Schedules:</span>
                    <span className="value">{engineer.scheduleCount}</span>
                  </div>
                  <div className="util-stat">
                    <span className="label">Total:</span>
                    <span className="value">{engineer.utilization}</span>
                  </div>
                </div>
                <div className={`utilization-bar ${engineer.utilization > 5 ? 'high' : engineer.utilization > 2 ? 'medium' : 'low'}`}>
                  <div 
                    className="utilization-fill" 
                    style={{ width: `${Math.min(engineer.utilization * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        <div className="recent-cases">
          <h2>Recent Cases</h2>
          <div className="cases-list">
            {filteredData.cases.slice(0, 10).map(case_ => (
              <div key={case_.id} className="case-item">
                <div className="case-header">
                  <h4>{case_.title}</h4>
                  <div className="case-meta">
                    <span className="case-location">{case_.location}</span>
                    <span className={`priority-badge ${case_.priority}`}>
                      {case_.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="case-details">
                  <p>{case_.description}</p>
                  <div className="case-status">
                    {getStatusIcon(case_.status)}
                    <span style={{ color: getStatusColor(case_.status) }}>
                      {case_.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-dashboard {
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 25px 30px;
          border-radius: 16px;
          margin-bottom: 25px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-left h1 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .date-range {
          color: #64748b;
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
        }

        .header-controls {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .view-mode-selector {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #64748b;
        }

        .view-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }

        .view-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.3);
          color: #334155;
        }

        .display-mode-selector {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .display-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #64748b;
        }

        .display-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }

        .display-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.3);
          color: #334155;
        }

        .date-picker input {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.1);
          color: #334155;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .date-picker input:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .dashboard-filters {
          display: flex;
          gap: 20px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(15px);
          padding: 20px 25px;
          border-radius: 14px;
          margin-bottom: 25px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-select {
          padding: 10px 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 35px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .stat-card.completed::before {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .stat-card.in-progress::before {
          background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%);
        }

        .stat-card.pending::before {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-icon {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          padding: 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card.completed .stat-icon {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .stat-card.in-progress .stat-icon {
          color: #06b6d4;
          background: rgba(6, 182, 212, 0.1);
        }

        .stat-card.pending .stat-icon {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2.2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 6px;
          letter-spacing: -0.025em;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .dashboard-content {
          display: grid;
          gap: 30px;
        }

        .location-overview h2,
        .engineer-utilization h2,
        .recent-cases h2 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .location-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .location-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .location-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .location-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .location-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .location-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #666;
          font-size: 0.9rem;
        }

        .engineers-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .engineer-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: #f8f9fa;
          border-radius: 15px;
          font-size: 0.8rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.available {
          background: #28a745;
        }

        .status-dot.busy {
          background: #dc3545;
        }

        .utilization-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .utilization-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .utilization-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .engineer-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .engineer-info p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .utilization-stats {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
        }

        .util-stat {
          text-align: center;
        }

        .util-stat .label {
          display: block;
          font-size: 0.8rem;
          color: #666;
        }

        .util-stat .value {
          display: block;
          font-size: 1.2rem;
          font-weight: bold;
          color: #333;
        }

        .utilization-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .utilization-fill {
          height: 100%;
          background: #667eea;
          transition: width 0.3s ease;
        }

        .utilization-bar.high .utilization-fill {
          background: #dc3545;
        }

        .utilization-bar.medium .utilization-fill {
          background: #ffc107;
        }

        .utilization-bar.low .utilization-fill {
          background: #28a745;
        }

        .cases-list {
          display: grid;
          gap: 15px;
        }

        .case-item {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .case-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .case-header h4 {
          margin: 0;
          color: #333;
        }

        .case-meta {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .case-location {
          color: #666;
          font-size: 0.9rem;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.high {
          background: #dc3545;
          color: white;
        }

        .priority-badge.medium {
          background: #ffc107;
          color: #856404;
        }

        .priority-badge.low {
          background: #28a745;
          color: white;
        }

        .case-details p {
          color: #666;
          margin: 10px 0;
          line-height: 1.5;
        }

        .case-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .status-icon {
          width: 16px;
          height: 16px;
        }

        @media (max-width: 768px) {
           .enhanced-dashboard {
             padding: 15px;
           }

           .dashboard-header {
             flex-direction: column;
             gap: 20px;
             padding: 20px;
             border-radius: 12px;
           }

           .header-controls {
             flex-direction: column;
             width: 100%;
             gap: 15px;
           }

           .view-mode-selector,
           .display-mode-selector {
             width: 100%;
             justify-content: center;
           }

           .dashboard-filters {
             flex-direction: column;
             gap: 15px;
             padding: 20px;
           }

           .summary-stats {
             grid-template-columns: 1fr;
             gap: 15px;
             margin-bottom: 25px;
           }

           .location-grid,
           .utilization-grid {
             grid-template-columns: 1fr;
             gap: 15px;
           }

           .stat-card {
             padding: 20px;
           }

           .location-card,
           .utilization-card,
           .case-item {
             padding: 20px;
           }
         }
      `}</style>
    </div>
  );
};

export default EnhancedDashboard;
