import React, { useState } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { MapPin, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const EngineerDashboard = () => {
  const { 
    engineers, 
    getCasesByEngineer, 
    updateEngineer,
    updateCase 
  } = useEngineerContext();
  
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [travelDestination, setTravelDestination] = useState('');

  const locations = ['Hyderabad', 'Bangalore', 'Coimbatore', 'Chennai'];

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

  const handleTravel = async () => {
    if (travelDestination && selectedEngineer) {
      try {
        // Find the location ID for the destination
        const locationId = locations.findIndex(loc => loc === travelDestination) + 1;
        await updateEngineer(selectedEngineer.id, {
          current_location_id: locationId,
          is_available: false,
          travel_start_time: new Date().toISOString()
        });
        setShowTravelModal(false);
        setTravelDestination('');
        setSelectedEngineer(null);
      } catch (error) {
        console.error('Error updating engineer travel:', error);
      }
    }
  };

  const handleArrival = async (engineerId) => {
    try {
      await updateEngineer(engineerId, {
        is_available: true,
        travel_start_time: null
      });
    } catch (error) {
      console.error('Error updating engineer arrival:', error);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await updateCase(caseId, { status: newStatus });
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Engineer Dashboard</h2>
        <p>Monitor and manage your field service engineers</p>
      </div>

      <div className="engineer-grid">
        {engineers.map(engineer => {
          const engineerCases = getCasesByEngineer(engineer.id);
          const isTraveling = engineer.travel_start_time && !engineer.is_available;

          return (
            <div key={engineer.id} className="engineer-card">
              <div className="engineer-header">
                <div className="engineer-avatar">
                  {engineer.avatar || '👨‍🔧'}
                </div>
                <div className="engineer-info">
                  <h3>{engineer.name}</h3>
                  <div className="engineer-location">
                    <MapPin size={14} />
                    <span>{engineer.currentLocation}</span>
                    {isTraveling && (
                      <span className="travel-indicator">Traveling</span>
                    )}
                  </div>
                </div>
                <div className={`availability-status ${engineer.is_available ? 'available' : 'busy'}`}>
                  <div className="status-dot"></div>
                  <span className="status-text">{engineer.is_available ? 'Available' : 'Busy'}</span>
                </div>
              </div>

              <div className="cases-section">
                <div className="cases-header">
                  <h4>Current Cases</h4>
                  <span className="cases-count">{engineerCases.length}</span>
                </div>
                <div className="cases-list">
                  {engineerCases.length === 0 ? (
                    <div className="no-cases">
                      <div className="no-cases-icon">📋</div>
                      <p>No cases assigned</p>
                    </div>
                  ) : (
                    engineerCases.map(case_ => (
                      <div key={case_.id} className="case-item">
                        <div className="case-header">
                          <span className="case-title">{case_.title}</span>
                          <select
                            value={case_.status}
                            onChange={(e) => handleStatusChange(case_.id, e.target.value)}
                            className={`status-select status-${case_.status}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="case-details">
                          <div className="case-meta">
                            <span className="meta-item">
                              <MapPin size={12} />
                              {case_.location}
                            </span>
                            <span className={`priority-badge priority-${case_.priority?.toLowerCase()}`}>
                              {case_.priority}
                            </span>
                          </div>
                          <p className="case-description">{case_.description}</p>
                        </div>
                        <div className="case-status">
                          {getStatusIcon(case_.status)}
                          <span className="status-text">
                            {case_.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="engineer-actions">
                {engineer.is_available ? (
                  <button
                    className="action-btn action-travel"
                    onClick={() => {
                      setSelectedEngineer(engineer);
                      setShowTravelModal(true);
                    }}
                  >
                    <MapPin size={16} />
                    Send to Location
                  </button>
                ) : isTraveling ? (
                  <button
                    className="action-btn action-arrive"
                    onClick={() => handleArrival(engineer.id)}
                  >
                    <CheckCircle size={16} />
                    Mark as Arrived
                  </button>
                ) : (
                  <button
                    className="action-btn action-available"
                    onClick={() => handleArrival(engineer.id)}
                  >
                    <CheckCircle size={16} />
                    Mark Available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Travel Modal */}
      {showTravelModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Send {selectedEngineer?.name} to Another Location</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowTravelModal(false);
                  setSelectedEngineer(null);
                  setTravelDestination('');
                }}
              >
                ×
              </button>
            </div>
            <div className="form-group">
              <label>Select Destination:</label>
              <select
                value={travelDestination}
                onChange={(e) => setTravelDestination(e.target.value)}
              >
                <option value="">Choose location...</option>
                {locations
                  .filter(loc => loc !== selectedEngineer?.currentLocation)
                  .map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowTravelModal(false);
                  setSelectedEngineer(null);
                  setTravelDestination('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleTravel}
                disabled={!travelDestination}
              >
                Send Engineer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard {
          padding: 20px 0;
        }

        .dashboard-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .dashboard-header h2 {
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }

        .dashboard-header p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .engineer-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .engineer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .engineer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .engineer-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .engineer-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }

        .engineer-info {
          flex: 1;
          min-width: 0;
        }

        .engineer-info h3 {
          margin: 0 0 4px 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .engineer-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 0.875rem;
          margin-top: 2px;
        }

        .travel-indicator {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #92400e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          margin-left: 8px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .availability-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .availability-status.available {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .availability-status.busy {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .availability-status.available .status-dot {
          background: #16a34a;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
        }

        .availability-status.busy .status-dot {
          background: #dc2626;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }

        .cases-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .cases-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .cases-count {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .no-cases {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .no-cases-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .no-cases p {
          margin: 0;
          font-style: italic;
        }

        .case-item {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .case-item:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .case-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
          flex: 1;
          line-height: 1.4;
        }

        .status-select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .status-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .status-select.status-pending {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.05);
        }

        .status-select.status-in-progress {
          border-color: #06b6d4;
          background: rgba(6, 182, 212, 0.05);
        }

        .status-select.status-completed {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .case-details {
          margin-bottom: 12px;
        }

        .case-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #64748b;
          font-size: 0.8rem;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .priority-high {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .priority-medium {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .priority-low {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .case-description {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.4;
        }

        .case-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-text {
          color: #374151;
        }

        .status-icon.completed {
          color: #10b981;
        }

        .status-icon.in-progress {
          color: #06b6d4;
        }

        .status-icon.pending {
          color: #f59e0b;
        }

        .engineer-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          width: 100%;
        }

        .action-travel {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-travel:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .action-arrive {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .action-arrive:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }

        .action-available {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .action-available:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
};

export default EngineerDashboard;
