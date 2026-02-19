import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  LogOut,
  BarChart3,
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

// Personal Cases View Component
const PersonalCasesView = ({ viewMode, selectedDate, engineerCases, user }) => {
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

  // Group cases by date
  const groupedCases = useMemo(() => {
    if (viewMode === 'daily') {
      const dateStr = selectedDate.toDateString();
      return { [dateStr]: engineerCases };
    }
    
    if (viewMode === 'weekly') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const grouped = {};
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayStr = day.toDateString();
        grouped[dayStr] = engineerCases.filter(case_ => {
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
        grouped[dayStr] = engineerCases.filter(case_ => {
          const caseDate = new Date(case_.created_at);
          return caseDate.toDateString() === dayStr;
        });
      }
      return grouped;
    }
    
    return {};
  }, [engineerCases, viewMode, selectedDate]);

  return (
    <div className="personal-cases-view">
      <div className="cases-header">
        <h2>My Cases - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</h2>
        <div className="cases-stats">
          <div className="stat-item">
            <span className="stat-number">{engineerCases.length}</span>
            <span className="stat-label">Total Cases</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {engineerCases.filter(c => c.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {engineerCases.filter(c => c.status === 'in-progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {engineerCases.filter(c => c.status === 'pending').length}
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
              {dayCases.map(case_ => (
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
                      <div className="case-detail-item">
                        <MapPin size={14} />
                        <span>{case_.location}</span>
                      </div>
                      <div className="case-detail-item">
                        <Clock size={14} />
                        <span>{new Date(case_.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .personal-cases-view {
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
      `}</style>
    </div>
  );
};

// Personal Schedules View Component
const PersonalSchedulesView = ({ viewMode, selectedDate, engineerSchedules, user }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Group schedules by date
  const groupedSchedules = useMemo(() => {
    if (viewMode === 'daily') {
      const dateStr = selectedDate.toDateString();
      return { [dateStr]: engineerSchedules };
    }
    
    if (viewMode === 'weekly') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const grouped = {};
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayStr = day.toDateString();
        grouped[dayStr] = engineerSchedules.filter(schedule => {
          const scheduleDate = new Date(schedule.start || schedule.start_time);
          return scheduleDate.toDateString() === dayStr;
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
        grouped[dayStr] = engineerSchedules.filter(schedule => {
          const scheduleDate = new Date(schedule.start || schedule.start_time);
          return scheduleDate.toDateString() === dayStr;
        });
      }
      return grouped;
    }
    
    return {};
  }, [engineerSchedules, viewMode, selectedDate]);

  return (
    <div className="personal-schedules-view">
      <div className="schedules-header">
        <h2>My Schedules - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</h2>
        <div className="schedules-stats">
          <div className="stat-item">
            <span className="stat-number">{engineerSchedules.length}</span>
            <span className="stat-label">Total Schedules</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {engineerSchedules.filter(s => s.priority === 'high').length}
            </span>
            <span className="stat-label">High Priority</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {engineerSchedules.filter(s => s.priority === 'medium').length}
            </span>
            <span className="stat-label">Medium Priority</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {engineerSchedules.filter(s => s.priority === 'low').length}
            </span>
            <span className="stat-label">Low Priority</span>
          </div>
        </div>
      </div>

      <div className="schedules-content">
        {Object.entries(groupedSchedules).map(([dateStr, daySchedules]) => (
          <div key={dateStr} className="schedules-day-group">
            <div className="day-header">
              <h3>{new Date(dateStr).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</h3>
              <span className="schedule-count">{daySchedules.length} schedules</span>
            </div>
            
            <div className="schedules-grid">
              {daySchedules.map(schedule => (
                <div key={schedule.id} className="schedule-card">
                  <div className="schedule-card-header">
                    <h4>{schedule.title}</h4>
                    <div className="schedule-badges">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(schedule.priority) }}
                      >
                        {schedule.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="schedule-card-body">
                    <p className="schedule-description">{schedule.description}</p>
                    
                    <div className="schedule-details">
                      <div className="schedule-detail-item">
                        <MapPin size={14} />
                        <span>{schedule.location}</span>
                      </div>
                      <div className="schedule-detail-item">
                        <Clock size={14} />
                        <span>
                          {new Date(schedule.start || schedule.start_time).toLocaleTimeString()} - 
                          {new Date(schedule.end || schedule.end_time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .personal-schedules-view {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .schedules-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .schedules-stats {
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

        .schedules-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .schedules-day-group {
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

        .schedule-count {
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .schedules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        .schedule-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: white;
          transition: all 0.2s;
        }

        .schedule-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .schedule-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .schedule-card-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 16px;
          flex: 1;
          margin-right: 12px;
        }

        .schedule-badges {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .schedule-card-body {
          margin-bottom: 16px;
        }

        .schedule-description {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .schedule-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .schedule-detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

const EngineerPersonalDashboard = () => {
  const { user, logout } = useAuth();
  const { schedules, leaves, addLeave, updateLeave, deleteLeave, getCasesByEngineer } = useEngineerContext();
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [displayMode, setDisplayMode] = useState('overview'); // overview, cases, schedules
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Get engineer's data
  const engineerCases = getCasesByEngineer(user.id);
  const engineerSchedules = schedules.filter(schedule => schedule.engineer_id === user.id);

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

  // Filter data based on selected date range
  const filteredData = useMemo(() => {
    const { start, end } = getDateRange();
    
    const filteredSchedules = engineerSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start || schedule.start_time);
      return scheduleDate >= start && scheduleDate <= end;
    });

    const filteredCases = engineerCases.filter(case_ => {
      const caseDate = new Date(case_.created_at);
      return caseDate >= start && caseDate <= end;
    });

    return { schedules: filteredSchedules, cases: filteredCases };
  }, [engineerSchedules, engineerCases, getDateRange]);

  // Calculate personal statistics
  const personalStats = useMemo(() => {
    const { schedules, cases } = filteredData;
    
    const totalCases = cases.length;
    const completedCases = cases.filter(c => c.status === 'completed').length;
    const inProgressCases = cases.filter(c => c.status === 'in-progress').length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;
    
    const totalSchedules = schedules.length;
    const highPriorityCases = cases.filter(c => c.priority === 'high').length;
    
    return {
      totalCases,
      completedCases,
      inProgressCases,
      pendingCases,
      totalSchedules,
      highPriorityCases,
      completionRate: totalCases > 0 ? (completedCases / totalCases * 100).toFixed(1) : 0
    };
  }, [filteredData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon completed" />;
      case 'in-progress':
        return <Clock className="status-icon in-progress" />;
      case 'pending':
        return <AlertCircle className="status-icon pending" />;
      default:
        return <AlertCircle className="status-icon" />;
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

  const getUpcomingSchedules = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return engineerSchedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.start || schedule.start_time);
        return scheduleDate >= today;
      })
      .sort((a, b) => new Date(a.start || a.start_time) - new Date(b.start || b.start_time))
      .slice(0, 5);
  };

  const upcomingSchedules = getUpcomingSchedules();

  const myLeaves = leaves.filter(l => l.engineer_id === user.id).sort((a,b) => new Date(a.start_date) - new Date(b.start_date));

  const resetLeaveForm = () => {
    setLeaveForm({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setEditingLeave(null);
    setShowLeaveModal(false);
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    const payload = {
      engineer_id: user.id,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason,
      status: 'approved'
    };
    if (editingLeave) {
      await updateLeave(editingLeave.id, payload);
    } else {
      await addLeave(payload);
    }
    resetLeaveForm();
  };

  return (
    <div className="engineer-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="user-info">
            <div className="user-avatar">
              <span className="avatar-text">{user.avatar || '👨‍🔧'}</span>
            </div>
            <div className="user-details">
              <h1>Welcome back, {user.name}!</h1>
              <p>{user.location} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="view-controls">
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
                <Activity size={16} />
                Overview
              </button>
              <button 
                className={`display-btn ${displayMode === 'cases' ? 'active' : ''}`}
                onClick={() => setDisplayMode('cases')}
              >
                <AlertCircle size={16} />
                Cases
              </button>
              <button 
                className={`display-btn ${displayMode === 'schedules' ? 'active' : ''}`}
                onClick={() => setDisplayMode('schedules')}
              >
                <Calendar size={16} />
                Schedules
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
          
          <div className="user-actions">
            <button className="action-btn" onClick={() => setShowLeaveModal(true)}>
              <Plus size={20} />
            </button>
            <button className="action-btn">
              <Settings size={20} />
            </button>
            <button className="action-btn logout-btn" onClick={logout}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="date-range-display">
        <h2>{formatDateRange()}</h2>
      </div>

      {/* Personal Statistics */}
      <div className="personal-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{personalStats.totalCases}</div>
            <div className="stat-label">My Cases</div>
          </div>
        </div>
        
        <div className="stat-card completed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{personalStats.completedCases}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        <div className="stat-card in-progress">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{personalStats.inProgressCases}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{personalStats.pendingCases}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{personalStats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{personalStats.totalSchedules}</div>
            <div className="stat-label">Schedules</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {displayMode === 'overview' ? (
        <div className="dashboard-content">
        {/* My Cases */}
        <div className="my-cases">
          <h2>My Cases</h2>
          <div className="cases-list">
            {filteredData.cases.length === 0 ? (
              <div className="no-data">
                <p>No cases found for the selected period</p>
              </div>
            ) : (
              filteredData.cases.map(case_ => (
                <div key={case_.id} className="case-item">
                  <div className="case-header">
                    <h4>{case_.title}</h4>
                    <div className="case-meta">
                      <span className={`priority-badge ${case_.priority}`}>
                        {case_.priority.toUpperCase()}
                      </span>
                      <span className={`status-badge ${case_.status}`}>
                        {case_.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="case-details">
                    <p>{case_.description}</p>
                    <div className="case-info">
                      <div className="info-item">
                        <MapPin size={14} />
                        <span>{case_.location}</span>
                      </div>
                      <div className="info-item">
                        <Clock size={14} />
                        <span>{new Date(case_.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Schedules */}
        <div className="my-schedules">
          <h2>My Schedules</h2>
          <div className="schedules-list">
            {filteredData.schedules.length === 0 ? (
              <div className="no-data">
                <p>No schedules found for the selected period</p>
              </div>
            ) : (
              filteredData.schedules.map(schedule => (
                <div key={schedule.id} className="schedule-item">
                  <div className="schedule-header">
                    <h4>{schedule.title}</h4>
                    <span className={`priority-badge ${schedule.priority}`}>
                      {schedule.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="schedule-details">
                    <p>{schedule.description}</p>
                    <div className="schedule-info">
                      <div className="info-item">
                        <MapPin size={14} />
                        <span>{schedule.location}</span>
                      </div>
                      <div className="info-item">
                        <Clock size={14} />
                        <span>
                          {new Date(schedule.start || schedule.start_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Schedules */}
        <div className="upcoming-schedules">
          <h2>Upcoming Schedules</h2>
          <div className="upcoming-list">
            {upcomingSchedules.length === 0 ? (
              <div className="no-data">
                <p>No upcoming schedules</p>
              </div>
            ) : (
              upcomingSchedules.map(schedule => (
                <div key={schedule.id} className="upcoming-item">
                  <div className="upcoming-date">
                    <div className="date-day">
                      {new Date(schedule.start || schedule.start_time).getDate()}
                    </div>
                    <div className="date-month">
                      {new Date(schedule.start || schedule.start_time).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className="upcoming-details">
                    <h4>{schedule.title}</h4>
                    <p>{schedule.location}</p>
                    <span className="upcoming-time">
                      {new Date(schedule.start || schedule.start_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="my-leaves">
          <h2>My Leaves</h2>
          <div className="leaves-list">
            {myLeaves.length === 0 ? (
              <div className="no-data">
                <p>No leaves found</p>
              </div>
            ) : (
              myLeaves.map(leave => (
                <div key={leave.id} className="leave-item">
                  <div className="leave-details">
                    <h4>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</h4>
                    <p>{leave.reason || 'No reason provided'}</p>
                    <span className={`status-badge ${leave.status}`}>{leave.status.toUpperCase()}</span>
                  </div>
                  <div className="leave-actions">
                    <button className="action-btn" onClick={() => { setEditingLeave(leave); setLeaveForm({ start_date: leave.start_date, end_date: leave.end_date, reason: leave.reason || '' }); setShowLeaveModal(true); }}>
                      <Edit size={16} />
                    </button>
                    <button className="action-btn" onClick={() => deleteLeave(leave.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      ) : displayMode === 'cases' ? (
        <PersonalCasesView 
          viewMode={viewMode}
          selectedDate={selectedDate}
          engineerCases={engineerCases}
          user={user}
        />
      ) : displayMode === 'schedules' ? (
        <PersonalSchedulesView 
          viewMode={viewMode}
          selectedDate={selectedDate}
          engineerSchedules={engineerSchedules}
          user={user}
        />
      ) : null}

      {showLeaveModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingLeave ? 'Edit Leave' : 'Apply Leave'}</h2>
              <button className="close-btn" onClick={resetLeaveForm}>×</button>
            </div>
            <form onSubmit={submitLeave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetLeaveForm}>Cancel</button>
                <button type="submit" className="btn">{editingLeave ? 'Update' : 'Apply'} Leave</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .engineer-dashboard {
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .avatar-text {
          color: white;
        }

        .user-details h1 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 1.5rem;
        }

        .user-details p {
          margin: 0;
          color: #666;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .view-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .view-mode-selector {
          display: flex;
          gap: 5px;
          background: #f8f9fa;
          padding: 5px;
          border-radius: 8px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .view-btn.active {
          background: #667eea;
          color: white;
        }

        .view-btn:hover:not(.active) {
          background: #e9ecef;
        }

        .display-mode-selector {
          display: flex;
          gap: 5px;
          background: #f8f9fa;
          padding: 5px;
          border-radius: 8px;
        }

        .display-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .display-btn:hover {
          background: #e9ecef;
        }

        .display-btn.active {
          background: #28a745;
          color: white;
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
        }

        .date-picker input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .user-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: #f8f9fa;
          border-color: #667eea;
        }

        .logout-btn:hover {
          background: #dc3545;
          border-color: #dc3545;
          color: white;
        }

        .date-range-display {
          background: white;
          padding: 15px 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .date-range-display h2 {
          margin: 0;
          color: #333;
        }

        .personal-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .stat-card.completed {
          border-left: 4px solid #28a745;
        }

        .stat-card.in-progress {
          border-left: 4px solid #17a2b8;
        }

        .stat-card.pending {
          border-left: 4px solid #ffc107;
        }

        .stat-icon {
          color: #667eea;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .upcoming-schedules {
          grid-column: 1 / -1;
        }

        .my-leaves {
          grid-column: 1 / -1;
          margin-top: 20px;
        }

        .leaves-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .leave-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 16px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .leave-actions {
          display: flex;
          gap: 8px;
        }

        .my-cases h2,
        .my-schedules h2,
        .upcoming-schedules h2 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .cases-list,
        .schedules-list,
        .upcoming-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .case-item,
        .schedule-item {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .case-header,
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .case-header h4,
        .schedule-header h4 {
          margin: 0;
          color: #333;
        }

        .case-meta {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .priority-badge,
        .status-badge {
          padding: 4px 8px;
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

        .status-badge.completed {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.in-progress {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .case-details,
        .schedule-details {
          margin-top: 10px;
        }

        .case-details p,
        .schedule-details p {
          color: #666;
          margin: 10px 0;
          line-height: 1.5;
        }

        .case-info,
        .schedule-info {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #666;
          font-size: 0.9rem;
        }

        .upcoming-item {
          display: flex;
          align-items: center;
          gap: 15px;
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .upcoming-date {
          text-align: center;
          min-width: 60px;
        }

        .date-day {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .date-month {
          font-size: 0.8rem;
          color: #666;
          text-transform: uppercase;
        }

        .upcoming-details {
          flex: 1;
        }

        .upcoming-details h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .upcoming-details p {
          margin: 0 0 5px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .upcoming-time {
          color: #667eea;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 20px;
          }

          .header-right {
            flex-direction: column;
            width: 100%;
          }

          .view-controls {
            flex-direction: column;
            width: 100%;
          }

          .dashboard-content {
            grid-template-columns: 1fr;
          }

          .personal-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EngineerPersonalDashboard;
