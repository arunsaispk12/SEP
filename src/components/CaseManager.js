import React, { useState } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { Plus, Search, User, MapPin, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import scheduleCaseSyncService from '../services/scheduleCaseSync';
import toast from 'react-hot-toast';

const CaseManager = () => {
  const { 
    cases, 
    engineers, 
    addCase, 
    updateCase,
    getEngineerById 
  } = useEngineerContext();
  
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    assignedEngineer: '',
    status: 'pending'
  });

  const locations = ['Hyderabad', 'Bangalore', 'Coimbatore', 'Chennai'];
  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' }
  ];
  const statuses = ['pending', 'in-progress', 'completed'];

  // Filter cases based on search and filters
  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addCase(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      priority: 'medium',
      assignedEngineer: '',
      status: 'pending'
    });
    setShowModal(false);
  };

  const handleSyncWithSchedules = async () => {
    setIsSyncing(true);
    try {
      const result = await scheduleCaseSyncService.syncAllCasesWithSchedules();
      if (result.success) {
        toast.success(`Successfully synced ${result.data.syncedCases}/${result.data.totalCases} cases with schedules!`);
      } else {
        toast.error('Failed to sync cases with schedules');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Error syncing cases with schedules');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAssignCase = async (caseId, engineerId) => {
    try {
      await updateCase(caseId, { 
        assigned_engineer_id: engineerId,
        status: 'in-progress'
      });
    } catch (error) {
      console.error('Error assigning case:', error);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await updateCase(caseId, { status: newStatus });
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Clock className="status-icon completed" />;
      case 'in-progress':
        return <AlertCircle className="status-icon in-progress" />;
      case 'pending':
        return <Clock className="status-icon pending" />;
      default:
        return <Clock className="status-icon" />;
    }
  };


  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || '#6c757d';
  };

  const getCaseStats = () => {
    const total = cases.length;
    const pending = cases.filter(c => c.status === 'pending').length;
    const inProgress = cases.filter(c => c.status === 'in-progress').length;
    const completed = cases.filter(c => c.status === 'completed').length;
    
    return { total, pending, inProgress, completed };
  };

  const stats = getCaseStats();

  return (
    <div className="case-manager">
      <div className="case-manager-header">
        <h2>Case Manager</h2>
        <div className="header-actions">
          <button
            className="btn secondary"
            onClick={handleSyncWithSchedules}
            disabled={isSyncing}
          >
            <RotateCcw size={16} />
            {isSyncing ? 'Syncing...' : 'Sync with Schedules'}
          </button>
          <button
            className="btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add New Case
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Cases</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      <div className="cases-list">
        {filteredCases.length === 0 ? (
          <div className="no-cases">
            <p>No cases found matching your criteria</p>
          </div>
        ) : (
          filteredCases.map(case_ => {
            const assignedEngineer = case_.assigned_engineer_id ? 
              getEngineerById(case_.assigned_engineer_id) : null;
            
            return (
              <div key={case_.id} className="case-card">
                <div className="case-header">
                  <div className="case-title-section">
                    <h3>{case_.title}</h3>
                    <div className="case-meta">
                      <span className="case-id">#{case_.id}</span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(case_.priority) }}
                      >
                        {case_.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="case-status">
                    {getStatusIcon(case_.status)}
                    <select
                      value={case_.status}
                      onChange={(e) => handleStatusChange(case_.id, e.target.value)}
                      className="status-select"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status.replace('-', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="case-details">
                  <p className="case-description">{case_.description}</p>
                  
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

                <div className="case-assignment">
                  {assignedEngineer ? (
                    <div className="assigned-engineer">
                      <User size={14} />
                      <span>Assigned to: {assignedEngineer.name}</span>
                    </div>
                  ) : (
                    <div className="assignment-controls">
                      <select
                        value=""
                        onChange={(e) => handleAssignCase(case_.id, parseInt(e.target.value))}
                        className="assign-select"
                      >
                        <option value="">Assign to Engineer</option>
                        {engineers.map(engineer => (
                          <option key={engineer.id} value={engineer.id}>
                            {engineer.name} - {engineer.location}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Case Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Case</h2>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Case Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-group">
                <label>Assign to Engineer (Optional)</label>
                <select
                  value={formData.assignedEngineer}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedEngineer: e.target.value }))}
                >
                  <option value="">Select Engineer</option>
                  {engineers.map(engineer => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name} - {engineer.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .case-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .case-manager-header h2 {
          margin: 0;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .stat-card.pending {
          border-left: 4px solid #ffc107;
        }

        .stat-card.in-progress {
          border-left: 4px solid #17a2b8;
        }

        .stat-card.completed {
          border-left: 4px solid #28a745;
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

        .filters-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-width: 250px;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
        }

        .filter-controls {
          display: flex;
          gap: 10px;
        }

        .filter-select {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-size: 14px;
        }

        .cases-list {
          display: grid;
          gap: 15px;
        }

        .case-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #667eea;
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .case-title-section h3 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .case-meta {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .case-id {
          color: #666;
          font-size: 0.8rem;
        }

        .priority-badge {
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .case-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-icon {
          width: 16px;
          height: 16px;
        }

        .status-select {
          padding: 5px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .case-description {
          color: #666;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .case-info {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #666;
          font-size: 0.9rem;
        }

        .case-assignment {
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .assigned-engineer {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #28a745;
          font-weight: 500;
        }

        .assign-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          width: 100%;
        }

        .no-cases {
          text-align: center;
          padding: 40px;
          color: #666;
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

        @media (max-width: 768px) {
          .filters-section {
            flex-direction: column;
          }
          
          .filter-controls {
            flex-direction: column;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .case-header {
            flex-direction: column;
            gap: 10px;
          }
          
          .case-info {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default CaseManager;
