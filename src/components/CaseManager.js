import React, { useState } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, User, MapPin, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import CaseCompletionModal from './CaseCompletionModal';

const CaseManager = () => {
  const {
    cases,
    engineers,
    clients,
    addClient,
    addCase,
    updateCase,
    getEngineerById,
    locationObjects,
    checkLocationConflict,
    checkScheduleOverlap,
    isEngineerOnLeave
  } = useEngineerContext();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Case Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingCase, setCompletingCase] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    description: '',
    location: '',
    priority: 'medium',
    assignedEngineer: '',
    status: 'open'
  });

  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' }
  ];
  const statuses = [
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'travelling', label: 'In Transit' },
    { value: 'reached_centre', label: 'Reached Centre' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_installation', label: 'Waiting for Installation' },
    { value: 'installation_done', label: 'Installation Done' },
    { value: 'uninstallation_done', label: 'Uninstallation Done' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Filter cases based on search and filters
  const filteredCases = cases.filter(case_ => {
    const locationName = case_.location || '';
    const matchesSearch = (case_.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (case_.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         locationName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationObj = (locationObjects || []).find(l => l.name === formData.location);
      
      // Handle Client Logic: Find or Create
      let clientId = null;
      const existingClient = (clients || []).find(c => c.name.toLowerCase() === formData.clientName.toLowerCase());
      
      if (existingClient) {
        clientId = existingClient.id;
      } else if (formData.clientName) {
        // Automatically create new client if it doesn't exist
        const newClient = await addClient({
          name: formData.clientName,
          location_id: locationObj?.id || null,
          created_by: user?.id,
          is_disclosed: true
        });
        clientId = newClient.id;
      }

      const caseData = {
        title: formData.title,
        description: formData.description,
        location_id: locationObj?.id || null,
        client_id: clientId,
        priority: formData.priority,
        status: formData.status || 'open',
        assigned_engineer_id: formData.assignedEngineer || null,
        created_by: user?.id
      };
      
      await addCase(caseData);
      toast.success('Case created successfully');
      resetForm();
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      priority: 'medium',
      assignedEngineer: '',
      status: 'open'
    });
    setShowModal(false);
  };

  const handleAssignCase = async (caseId, engineerId) => {
    if (!engineerId) return;

    const targetCase = cases.find(c => c.id === caseId);
    
    // Check Location Conflict (Mandatory Block)
    const locationConflict = checkLocationConflict(engineerId, targetCase.created_at, targetCase.location);
    if (locationConflict.hasConflict) {
      toast.error(locationConflict.message);
      return;
    }

    // Check Leave (Warning)
    if (isEngineerOnLeave(targetCase.created_at, engineerId)) {
      if (!window.confirm('Engineer is on leave during this period. Assign anyway?')) {
        return;
      }
    }

    // Check Overlap (Warning)
    const overlap = checkScheduleOverlap(engineerId, targetCase.created_at, new Date(targetCase.created_at).setHours(23));
    if (overlap.hasOverlap) {
      if (!window.confirm(`${overlap.message} Assign anyway?`)) {
        return;
      }
    }

    try {
      await updateCase(caseId, {
        assigned_engineer_id: engineerId,
        status: 'assigned'
      });
    } catch (error) {
      console.error('Error assigning case:', error);
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    const targetCase = cases.find(c => c.id === caseId);
    
    // Permission Check: Only Admin or assigned Engineer can update
    const isAssignedEngineer = user.role === 'engineer' && targetCase.assigned_engineer_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isAdmin && !isAssignedEngineer) {
      toast.error('You do not have permission to update this case.');
      return;
    }

    if (newStatus === 'completed') {
      if (targetCase) {
        setCompletingCase(targetCase);
        setShowCompletionModal(true);
        return;
      }
    }

    try {
      await updateCase(caseId, { status: newStatus });
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  const handleCaseCompletion = async ({ caseId, completionData }) => {
    try {
      await updateCase(caseId, { 
        status: 'completed',
        completion_details: completionData 
      });
      setShowCompletionModal(false);
      setCompletingCase(null);
    } catch (error) {
      console.error('Error completing case:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Clock className="status-icon completed" />;
      case 'in_progress':
        return <AlertCircle className="status-icon in-progress" />;
      case 'open':
      case 'assigned':
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
    const pending = cases.filter(c => c.status === 'open' || c.status === 'assigned').length;
    const inProgress = cases.filter(c => c.status === 'in_progress').length;
    const completed = cases.filter(c => c.status === 'completed').length;

    return { total, pending, inProgress, completed };
  };

  const stats = getCaseStats();

  return (
    <div className="case-manager" style={{ padding: 20 }}>
      <div className="case-manager-header">
        <h2>Case Manager</h2>
        <div className="header-actions">
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

      <>
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
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

                const hasOverlap = assignedEngineer && checkScheduleOverlap(assignedEngineer.id, case_.created_at, new Date(case_.created_at).setHours(23), case_.id).hasOverlap;
                const isOnLeave = assignedEngineer && isEngineerOnLeave(case_.created_at, assignedEngineer.id);

                return (
                  <div key={case_.id} className="case-card">
                    <div className="case-header">
                      <div className="case-title-section">
                        <div className="title-wrapper">
                          <h3>{case_.title}</h3>
                          {(hasOverlap || isOnLeave) && (
                            <div className="warning-trigger" title={isOnLeave ? 'Engineer on Leave' : 'Schedule Overlap'}>
                              <AlertCircle size={18} color="#fbbf24" />
                            </div>
                          )}
                        </div>
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
                          {statuses.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
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
                            onChange={(e) => handleAssignCase(case_.id, e.target.value)}
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
        </>


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
                <label>Client (Hospital) *</label>
                <input
                  type="text"
                  list="clients-list"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Select or type new hospital name"
                  required
                />
                <datalist id="clients-list">
                  {(clients || []).map(client => (
                    <option key={client.id} value={client.name} />
                  ))}
                </datalist>
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
                    {(locationObjects || []).map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
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

      {/* Case Completion Modal */}
      {showCompletionModal && completingCase && (
        <CaseCompletionModal
          caseData={completingCase}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletingCase(null);
          }}
          onSave={handleCaseCompletion}
        />
      )}

      <style jsx>{`
        .case-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .case-manager-header h2 {
          margin: 0;
          color: #f1f5f9;
          font-size: clamp(1.25rem, 4vw, 1.75rem);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: rgba(22, 27, 34, 0.85);
          padding: 20px;
          border-radius: 14px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .stat-card.pending {
          border-left: 4px solid #fbbf24;
        }

        .stat-card.in-progress {
          border-left: 4px solid #06b6d4;
        }

        .stat-card.completed {
          border-left: 4px solid #10b981;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #f1f5f9;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .filters-section {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(22, 27, 34, 0.85);
          padding: 10px 15px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          flex: 1;
          min-width: 200px;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          background: transparent;
          color: #e2e8f0;
        }

        .search-box input::placeholder {
          color: #64748b;
        }

        .filter-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          background: rgba(22, 27, 34, 0.85);
          color: #e2e8f0;
          font-size: 14px;
          min-height: 44px;
          backdrop-filter: blur(20px);
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #7B61FF;
          box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.2);
        }

        .cases-list {
          display: grid;
          gap: 15px;
        }

        .case-card {
          background: rgba(22, 27, 34, 0.85);
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 4px solid #7B61FF;
          backdrop-filter: blur(20px);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .case-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border-color: rgba(123, 97, 255, 0.4);
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .case-title-section h3 {
          margin: 0;
          color: #f1f5f9;
          font-size: 1rem;
          font-weight: 600;
        }

        .title-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 5px;
        }

        .warning-trigger {
          cursor: help;
          display: flex;
          align-items: center;
          background: rgba(251, 191, 36, 0.1);
          padding: 4px;
          border-radius: 6px;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .case-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .case-id {
          color: #64748b;
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
          flex-shrink: 0;
        }

        .status-icon {
          width: 16px;
          height: 16px;
        }

        .status-select {
          padding: 6px 10px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          font-size: 0.8rem;
          background: rgba(13, 17, 23, 0.7);
          color: #e2e8f0;
          cursor: pointer;
          min-height: 36px;
        }

        .status-select:focus {
          outline: none;
          border-color: #7B61FF;
        }

        .case-description {
          color: #94a3b8;
          margin-bottom: 15px;
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .case-info {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748b;
          font-size: 0.85rem;
        }

        .case-assignment {
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .assigned-engineer {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #34d399;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .assign-select {
          padding: 8px 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          font-size: 0.9rem;
          width: 100%;
          background: rgba(13, 17, 23, 0.7);
          color: #e2e8f0;
          min-height: 44px;
          cursor: pointer;
        }

        .assign-select:focus {
          outline: none;
          border-color: #7B61FF;
        }

        .no-cases {
          text-align: center;
          padding: 60px 40px;
          color: #64748b;
          background: rgba(22, 27, 34, 0.5);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
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
          flex-wrap: wrap;
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

          .modal-actions {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
};

export default CaseManager;
