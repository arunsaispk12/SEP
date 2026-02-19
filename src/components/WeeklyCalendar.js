import React, { useState, useMemo } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { ChevronLeft, ChevronRight, MapPin, Clock, User } from 'lucide-react';

const WeeklyCalendar = () => {
  const { engineers, cases, schedules } = useEngineerContext();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get start and end of current week
  const getWeekDates = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    
    return weekDates;
  };

  const weekDates = getWeekDates(currentWeek);

  // Get data for the current week
  const weekData = useMemo(() => {
    const startOfWeek = weekDates[0];
    const endOfWeek = new Date(weekDates[6]);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start || schedule.start_time);
      return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
    });

    const weekCases = cases.filter(case_ => {
      const caseDate = new Date(case_.created_at);
      return caseDate >= startOfWeek && caseDate <= endOfWeek;
    });

    return { schedules: weekSchedules, cases: weekCases };
  }, [schedules, cases, weekDates]);

  // Group data by day
  const getDayData = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const daySchedules = weekData.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start || schedule.start_time);
      return scheduleDate >= dayStart && scheduleDate <= dayEnd;
    });

    const dayCases = weekData.cases.filter(case_ => {
      const caseDate = new Date(case_.created_at);
      return caseDate >= dayStart && caseDate <= dayEnd;
    });

    return { schedules: daySchedules, cases: dayCases };
  };

  // Get engineer location for a specific day
  const getEngineerLocation = (engineer, date) => {
    // Check if engineer has any schedules on this day
    const daySchedules = getDayData(date).schedules;
    const engineerSchedule = daySchedules.find(s => s.engineer_id === engineer.id);
    
    if (engineerSchedule) {
      return engineerSchedule.location;
    }
    
    // Check if engineer is traveling
    if (engineer.travel_start_time) {
      const travelDate = new Date(engineer.travel_start_time);
      if (travelDate <= date) {
        return engineer.currentLocation;
      }
    }
    
    return engineer.location;
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="weekly-calendar">
      <div className="calendar-header">
        <div className="header-left">
          <h2>Weekly Overview</h2>
          <p>{weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}</p>
        </div>
        
        <div className="header-controls">
          <button 
            className="nav-btn"
            onClick={() => navigateWeek(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            className="current-week-btn"
            onClick={goToCurrentWeek}
          >
            This Week
          </button>
          
          <button 
            className="nav-btn"
            onClick={() => navigateWeek(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekDates.map((date, index) => {
          const dayData = getDayData(date);
          const isCurrentDay = isToday(date);
          
          return (
            <div key={index} className={`day-column ${isCurrentDay ? 'today' : ''}`}>
              <div className="day-header">
                <h3>{formatDate(date)}</h3>
                <div className="day-stats">
                  <span className="schedule-count">{dayData.schedules.length} schedules</span>
                  <span className="case-count">{dayData.cases.length} cases</span>
                </div>
              </div>

              <div className="engineers-section">
                <h4>Engineers</h4>
                <div className="engineers-list">
                  {engineers.map(engineer => {
                    const location = getEngineerLocation(engineer, date);
                    const engineerSchedules = dayData.schedules.filter(s => s.engineer_id === engineer.id);
                    const engineerCases = dayData.cases.filter(c => c.assigned_engineer_id === engineer.id);
                    
                    return (
                      <div key={engineer.id} className="engineer-card">
                        <div className="engineer-header">
                          <div className="engineer-name">
                            <User size={14} />
                            <span>{engineer.name}</span>
                          </div>
                          <div className={`status-dot ${engineer.is_available ? 'available' : 'busy'}`}></div>
                        </div>
                        
                        <div className="engineer-location">
                          <MapPin size={12} />
                          <span>{location}</span>
                        </div>
                        
                        <div className="engineer-stats">
                          <div className="stat">
                            <Clock size={12} />
                            <span>{engineerSchedules.length}</span>
                          </div>
                          <div className="stat">
                            <span>📋</span>
                            <span>{engineerCases.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="schedules-section">
                <h4>Schedules</h4>
                <div className="schedules-list">
                  {dayData.schedules.map(schedule => {
                    const engineer = engineers.find(e => e.id === schedule.engineer_id);
                    return (
                      <div key={schedule.id} className="schedule-item">
                        <div className="schedule-header">
                          <span className="schedule-title">{schedule.title}</span>
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(schedule.priority) }}
                          >
                            {schedule.priority}
                          </span>
                        </div>
                        <div className="schedule-details">
                          <div className="schedule-engineer">
                            <User size={12} />
                            <span>{engineer?.name || 'Unknown'}</span>
                          </div>
                          <div className="schedule-location">
                            <MapPin size={12} />
                            <span>{schedule.location}</span>
                          </div>
                          <div className="schedule-time">
                            <Clock size={12} />
                            <span>
                              {new Date(schedule.start || schedule.start_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cases-section">
                <h4>Cases</h4>
                <div className="cases-list">
                  {dayData.cases.slice(0, 3).map(case_ => {
                    const engineer = engineers.find(e => e.id === case_.assigned_engineer_id);
                    return (
                      <div key={case_.id} className="case-item">
                        <div className="case-header">
                          <span className="case-title">{case_.title}</span>
                          <span className={`status-badge ${case_.status}`}>
                            {case_.status}
                          </span>
                        </div>
                        <div className="case-details">
                          {engineer && (
                            <div className="case-engineer">
                              <User size={12} />
                              <span>{engineer.name}</span>
                            </div>
                          )}
                          <div className="case-location">
                            <MapPin size={12} />
                            <span>{case_.location}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {dayData.cases.length > 3 && (
                    <div className="more-cases">
                      +{dayData.cases.length - 3} more cases
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .weekly-calendar {
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header-left h2 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .header-left p {
          margin: 0;
          color: #666;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background: #f8f9fa;
          border-color: #667eea;
        }

        .current-week-btn {
          padding: 8px 16px;
          border: 1px solid #667eea;
          background: #667eea;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .current-week-btn:hover {
          background: #5a6fd8;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 15px;
        }

        .day-column {
          background: white;
          border-radius: 10px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          min-height: 600px;
        }

        .day-column.today {
          border: 2px solid #667eea;
          background: #f8f9ff;
        }

        .day-header {
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .day-header h3 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .day-stats {
          display: flex;
          gap: 10px;
          font-size: 0.8rem;
          color: #666;
        }

        .engineers-section,
        .schedules-section,
        .cases-section {
          margin-bottom: 20px;
        }

        .engineers-section h4,
        .schedules-section h4,
        .cases-section h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .engineers-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .engineer-card {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }

        .engineer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .engineer-name {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
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

        .engineer-location {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 5px;
        }

        .engineer-stats {
          display: flex;
          gap: 10px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.8rem;
          color: #666;
        }

        .schedules-list,
        .cases-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .schedule-item,
        .case-item {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .schedule-header,
        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .schedule-title,
        .case-title {
          font-weight: 600;
          color: #333;
        }

        .priority-badge,
        .status-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
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

        .schedule-details,
        .case-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .schedule-engineer,
        .schedule-location,
        .schedule-time,
        .case-engineer,
        .case-location {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #666;
        }

        .more-cases {
          text-align: center;
          color: #667eea;
          font-size: 0.8rem;
          font-style: italic;
          padding: 5px;
        }

        @media (max-width: 1200px) {
          .calendar-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 900px) {
          .calendar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .calendar-grid {
            grid-template-columns: 1fr;
          }
          
          .calendar-header {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default WeeklyCalendar;
