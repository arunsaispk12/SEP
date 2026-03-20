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
    isEngineerOnLeave,
    automationConfig
  } = useEngineerContext();
  const { user, profile } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Case Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingCase, setCompletingCase] = useState(null);

  const LASER_TYPES = ['HT Lykos SS', 'HT Lykos DTS'];

  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    location: '',
    priority: 'medium',
    assignedEngineer: '',
    status: 'open',
    laser_type: ''
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
      let isNewClient = false;
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
        isNewClient = true;
      }

      const caseData = {
        title: formData.clientName,
        description: formData.description,
        location_id: locationObj?.id || null,
        client_id: clientId,
        priority: formData.priority,
        status: formData.status || 'open',
        assigned_engineer_id: formData.assignedEngineer || null,
        created_by: user?.id,
        laser_type: formData.laser_type || null
      };
      
      await addCase(caseData);
      toast.success('Case created successfully');
      // WhatsApp trigger
      const waTrigger = automationConfig?.whatsapp_triggers?.case_created;
      const waTemplate = automationConfig?.whatsapp_templates?.case_created;
      if (waTrigger && waTemplate && !isNewClient) {
        const assignedEngineer = engineers.find(e => e.id === formData.assignedEngineer);
        const msg = waTemplate
          .replace('{{client}}', formData.clientName || '')
          .replace('{{location}}', formData.location || '')
          .replace('{{engineer}}', assignedEngineer?.name || 'Unassigned')
          .replace('{{date}}', new Date().toLocaleDateString('en-IN'))
          .replace('{{priority}}', formData.priority || 'medium')
          .replace('{{status}}', 'open');
        const waNumber = (automationConfig?.whatsapp_number || '').replace(/[^\d]/g, '');
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      }
      resetForm();
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      description: '',
      location: '',
      priority: 'medium',
      assignedEngineer: '',
      status: 'open',
      laser_type: ''
    });
    setShowModal(false);
  };

  const handleAssignCase = async (caseId, engineerId) => {
    if (!engineerId) return;

    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    // Use scheduled_start as the reference date; fall back to created_at if not set
    const caseDate = targetCase.scheduled_start || targetCase.created_at;
    const caseDateEnd = new Date(caseDate);
    caseDateEnd.setHours(23, 59, 59, 999);

    // Check Location Conflict (Mandatory Block)
    const locationConflict = checkLocationConflict(engineerId, caseDate, targetCase.location);
    if (locationConflict.hasConflict) {
      toast.error(locationConflict.message);
      return;
    }

    // Check Leave (Warning)
    if (isEngineerOnLeave(caseDate, engineerId)) {
      if (!window.confirm('Engineer is on leave during this period. Assign anyway?')) {
        return;
      }
    }

    // Check Overlap (Warning)
    const overlap = checkScheduleOverlap(engineerId, caseDate, caseDateEnd.toISOString());
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
    if (!targetCase) return;

    // Permission Check: Only Admin or assigned Engineer can update
    // profile.role has the user's role; user.id has the auth UID
    const isAssignedEngineer = profile?.role === 'engineer' && targetCase.assigned_engineer_id === user?.id;
    const isAdmin = profile?.role === 'admin' || profile?.is_admin;

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

                const caseRefDate = case_.scheduled_start || case_.created_at;
                const caseRefDateEnd = new Date(caseRefDate);
                caseRefDateEnd.setHours(23, 59, 59, 999);
                const hasOverlap = assignedEngineer && checkScheduleOverlap(assignedEngineer.id, caseRefDate, caseRefDateEnd.toISOString(), case_.id).hasOverlap;
                const isOnLeave = assignedEngineer && isEngineerOnLeave(caseRefDate, assignedEngineer.id);

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
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Laser Type</label>
                <select
                  value={formData.laser_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, laser_type: e.target.value }))}
                >
                  <option value="">Select laser type</option>
                  {LASER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
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
          automationConfig={automationConfig}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletingCase(null);
          }}
          onSave={handleCaseCompletion}
        />
      )}

    </div>
  );
};

export default CaseManager;
