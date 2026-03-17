import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import {
  UserPlus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Shield,
  Phone,
  MapPin,
  Calendar,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import supabaseService from '../services/supabaseService';

const UserManagement = () => {
  const { user, changePassword } = useAuth();
  const { engineers, leaves, updateLeave, deleteLeave, addEngineer, updateEngineer, deleteEngineer, approveUser } = useEngineerContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    id: null,
    engineer_id: null,
    start_date: '',
    end_date: '',
    reason: ''
  });
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'engineer',
    location_id: 1,
    phone: '',
    bio: '',
    skills: [],
    certifications: [],
    experience_years: 0,
    avatar: '👨‍🔧'
  });

  // Location form state
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const [locations, setLocations] = useState([]);

  // Load locations from database
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationData = await supabaseService.getLocations();
        setLocations(locationData.map(loc => ({ id: loc.id, name: loc.name })));
      } catch (error) {
        console.error('Error loading locations:', error);
        // Fallback to hardcoded locations
        setLocations([
          { id: 1, name: 'Hyderabad' },
          { id: 2, name: 'Bangalore' },
          { id: 3, name: 'Coimbatore' },
          { id: 4, name: 'Chennai' }
        ]);
      }
    };

    loadLocations();
  }, []);

  // Available roles
  const roles = [
    { value: 'engineer', label: 'Service Engineer', icon: '🔧' },
    { value: 'manager', label: 'Manager', icon: '👨‍💼' },
    { value: 'admin', label: 'Administrator', icon: '🛡️' }
  ];

  // Available skills
  const availableSkills = [
    'Hardware Repair', 'Software Installation', 'Network Setup', 'System Maintenance',
    'Database Management', 'Cloud Services', 'Technical Analysis', 'Problem Solving',
    'Equipment Setup', 'Industrial Systems', 'Manufacturing Equipment', 'Safety Protocols',
    'Team Management', 'Operations Planning', 'Strategic Planning'
  ];

  // Available certifications
  const availableCertifications = [
    'CCNA', 'CompTIA A+', 'AWS Certified', 'Microsoft Azure', 'PMP', 'ITIL Foundation',
    'OSHA Safety', 'Industrial Automation', 'Six Sigma Black Belt', 'Google Cloud Certified'
  ];

  // Filter users based on search, role, and approval
  const filteredUsers = engineers.filter(engineer => {
    const matchesSearch = (engineer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (engineer.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || engineer.role === filterRole;
    const matchesApproval = filterApproval === 'all' || 
                           (filterApproval === 'pending' && !engineer.is_approved) ||
                           (filterApproval === 'approved' && engineer.is_approved);
    return matchesSearch && matchesRole && matchesApproval;
  });

  // Handle adding new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const userData = {
        ...newUser,
        is_available: true,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      await addEngineer(userData);
      toast.success('User added successfully');
      setShowAddForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'engineer',
        location_id: 1,
        phone: '',
        bio: '',
        skills: [],
        certifications: [],
        experience_years: 0,
        avatar: '👨‍🔧'
      });
    } catch (error) {
      toast.error('Failed to add user');
      console.error('Add user error:', error);
    }
  };

  // Handle editing user
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      await updateEngineer(editingUser.id, editingUser);
      toast.success('User updated successfully');
      setShowEditForm(false);
      setEditingUser(null);
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Update user error:', error);
    }
  };

  // Handle deleting user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteEngineer(userId);
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
        console.error('Delete user error:', error);
      }
    }
  };

  // Handle add location
  const handleAddLocation = async (e) => {
    e.preventDefault();

    if (!newLocation.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    try {
      await supabaseService.createLocation(newLocation);
      toast.success('Location added successfully');
      setShowLocationForm(false);
      setNewLocation({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
      });
      // Refresh locations
      const locationData = await supabaseService.getLocations();
      setLocations(locationData.map(loc => ({ id: loc.id, name: loc.name })));
    } catch (error) {
      toast.error('Failed to add location');
      console.error('Add location error:', error);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (success) {
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error('Failed to change password');
      console.error('Password change error:', error);
    }
  };

  // Handle skill addition
  const addSkill = (skill) => {
    if (!newUser.skills.includes(skill)) {
      setNewUser(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  // Handle skill removal
  const removeSkill = (skill) => {
    setNewUser(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Handle certification addition
  const addCertification = (cert) => {
    if (!newUser.certifications.includes(cert)) {
      setNewUser(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert]
      }));
    }
  };

  // Handle certification removal
  const removeCertification = (cert) => {
    setNewUser(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  // Get role icon
  const getRoleIcon = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj?.icon || '👤';
  };

  // Get role label
  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj?.label || role;
  };

  const getEngineerName = (engineerId) => engineers.find(e => e.id === engineerId)?.name || 'Unknown';

  const openEditLeave = (leave) => {
    setEditingLeave(leave);
    setLeaveForm({
      id: leave.id,
      engineer_id: leave.engineer_id,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason || ''
    });
    setShowLeaveModal(true);
  };

  const handleUpdateLeave = async (e) => {
    e.preventDefault();
    try {
      await updateLeave(leaveForm.id, {
        engineer_id: leaveForm.engineer_id,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason,
        status: 'approved'
      });
      setShowLeaveModal(false);
      setEditingLeave(null);
    } catch (error) {
      // handled in context
    }
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-left">
          <h2>User Management</h2>
          <p>Manage service engineers and user accounts</p>
        </div>
        <div className="header-actions">
          <button
            className="add-location-btn"
            onClick={() => setShowLocationForm(true)}
          >
            <Plus size={20} />
            Add Location
          </button>
          <button
            className="add-user-btn"
            onClick={() => setShowAddForm(true)}
          >
            <UserPlus size={20} />
            Add New User
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="engineer">Engineers</option>
            <option value="manager">Managers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
        <div className="filter-dropdown">
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved Only</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {filteredUsers.map((engineer) => (
          <div key={engineer.id} className="user-card">
            <div className="user-avatar">
              <span>{engineer.avatar || '👤'}</span>
            </div>
            <div className="user-info">
              <div className="user-name">
                {engineer.name}
                {!engineer.is_approved && <span className="pending-badge">PENDING</span>}
              </div>
              <div className="user-email">{engineer.email}</div>
              <div className="user-details">
                <span className="user-role">
                  {getRoleIcon(engineer.role)} {getRoleLabel(engineer.role)}
                  {engineer.role === 'admin' && <span className="admin-badge">ADMIN</span>}
                </span>
                <span className="user-location">
                  <MapPin size={14} />
                  {locations.find(l => l.id === engineer.location_id)?.name || 'Unknown'}
                </span>
                {engineer.phone && (
                  <span className="user-phone">
                    <Phone size={14} />
                    {engineer.phone}
                  </span>
                )}
              </div>
              {engineer.skills && engineer.skills.length > 0 && (
                <div className="user-skills">
                  {engineer.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                  {engineer.skills.length > 3 && (
                    <span className="skill-more">+{engineer.skills.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
            <div className="user-actions">
              {!engineer.is_approved && (
                <button
                  className="approve-btn"
                  onClick={() => approveUser(engineer.id)}
                  title="Approve User"
                >
                  <Save size={16} />
                </button>
              )}
              <button
                className="view-btn"
                onClick={() => handleViewUser(engineer)}
                title="View Profile"
              >
                <Eye size={16} />
              </button>
              <button
                className="edit-btn"
                onClick={() => {
                  setEditingUser(engineer);
                  setShowEditForm(true);
                }}
                title="Edit User"
              >
                <Edit size={16} />
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDeleteUser(engineer.id)}
                title="Delete User"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Leaves Management (Manager) */}
      <div className="leaves-management">
        <div className="leaves-header">
          <h3><Calendar size={18} /> Engineers' Leaves</h3>
          <p>View and modify leave requests</p>
        </div>
        <div className="leaves-list">
          {(leaves || []).length === 0 ? (
            <div className="empty">No leaves found</div>
          ) : (
            (leaves || []).map(leave => (
              <div key={leave.id} className="leave-row">
                <div className="leave-info">
                  <div className="leave-title">{getEngineerName(leave.engineer_id)}</div>
                  <div className="leave-dates">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</div>
                  <div className="leave-reason">{leave.reason || 'No reason'}</div>
                </div>
                <div className="leave-actions">
                  <button className="edit-btn" onClick={() => openEditLeave(leave)} title="Edit Leave">
                    <Edit size={16} />
                  </button>
                  <button className="delete-btn" onClick={() => deleteLeave(leave.id)} title="Cancel Leave">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <div className="password-input">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div className="password-input">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <select
                    value={newUser.location_id}
                    onChange={(e) => setNewUser(prev => ({ ...prev, location_id: parseInt(e.target.value) }))}
                    required
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={newUser.experience_years}
                    onChange={(e) => setNewUser(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={newUser.bio}
                  onChange={(e) => setNewUser(prev => ({ ...prev, bio: e.target.value }))}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Skills</label>
                <div className="skills-section">
                  <div className="selected-skills">
                    {newUser.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="available-skills">
                    {availableSkills
                      .filter(skill => !newUser.skills.includes(skill))
                      .map(skill => (
                        <button
                          key={skill}
                          type="button"
                          className="skill-option"
                          onClick={() => addSkill(skill)}
                        >
                          {skill}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Certifications</label>
                <div className="certifications-section">
                  <div className="selected-certifications">
                    {newUser.certifications.map((cert, index) => (
                      <span key={index} className="cert-tag">
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="available-certifications">
                    {availableCertifications
                      .filter(cert => !newUser.certifications.includes(cert))
                      .map(cert => (
                        <button
                          key={cert}
                          type="button"
                          className="cert-option"
                          onClick={() => addCertification(cert)}
                        >
                          {cert}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  <Save size={16} />
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingUser(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <select
                    value={editingUser.location_id}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, location_id: parseInt(e.target.value) }))}
                    required
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingUser.experience_years || 0}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, bio: e.target.value }))}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  <Save size={16} />
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Modal */}
      {showLeaveModal && editingLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Leave</h3>
              <button className="close-btn" onClick={() => { setShowLeaveModal(false); setEditingLeave(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateLeave} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Engineer</label>
                  <input type="text" value={getEngineerName(leaveForm.engineer_id)} readOnly />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <input type="text" value="Approved" readOnly />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowLeaveModal(false); setEditingLeave(null); }}>Cancel</button>
                <button type="submit" className="primary-btn"><Save size={16} />Update Leave</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showLocationForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Location</h3>
              <button
                className="close-btn"
                onClick={() => setShowLocationForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddLocation} className="modal-body">
              <div className="form-group">
                <label>Location Name *</label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., Mumbai Office"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City name"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={newLocation.state}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={newLocation.pincode}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="PIN code"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowLocationForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  <Plus size={16} />
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPasswordForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="modal-body">
              <div className="form-group">
                <label>Current Password *</label>
                <div className="password-input">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <div className="password-input">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <div className="password-input">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li>At least 6 characters long</li>
                  <li>Must be different from current password</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  <Shield size={16} />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h3>User Profile</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-summary">
                <div className="profile-avatar-large">
                  {selectedUser.avatar || '👤'}
                </div>
                <div className="profile-main-info">
                  <h4>{selectedUser.name}</h4>
                  <span className="profile-role">{getRoleLabel(selectedUser.role)}</span>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">
                    {locations.find(l => l.id === selectedUser.location_id)?.name || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedUser.role === 'engineer' && (
                <div className="laser-details-box">
                  <h5>Laser Equipment Details</h5>
                  <div className="laser-info-grid">
                    <div className="laser-info-item">
                      <span className="label">Laser Type</span>
                      <span className="value">{selectedUser.laser_type || 'Not specified'}</span>
                    </div>
                    <div className="laser-info-item">
                      <span className="label">Serial Number</span>
                      <span className="value">{selectedUser.serial_number || 'Not specified'}</span>
                    </div>
                    <div className="laser-info-item">
                      <span className="label">Tracker Status</span>
                      <span className={`value status-badge ${selectedUser.tracker_status === 'Available' ? 'available' : 'unavailable'}`}>
                        {selectedUser.tracker_status || 'Not Available'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-management {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .user-management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .header-left h2 {
          margin: 0 0 5px 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
        }

        .header-left p {
          margin: 0;
          color: #6b7280;
        }

        .add-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-user-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .search-filter-section {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }

        .search-box {
          flex: 1;
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
        }

        .filter-dropdown select {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          min-width: 150px;
        }

        .users-list {
          display: grid;
          gap: 20px;
        }

      .leaves-management {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
      }

      .leaves-header {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 12px;
      }

      .leaves-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .leave-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
      }

      .leave-title {
        font-weight: 600;
        color: #111827;
      }

      .leave-dates, .leave-reason {
        color: #6b7280;
        font-size: 14px;
      }

        .user-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .user-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .user-email {
          color: #6b7280;
          margin-bottom: 8px;
        }

        .user-details {
          display: flex;
          gap: 20px;
          margin-bottom: 8px;
        }

        .user-details span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #6b7280;
        }

        .user-skills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .skill-tag {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .skill-more {
          color: #6b7280;
          font-size: 12px;
        }

        .pending-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          margin-left: 8px;
          border: 1px solid #fde68a;
        }

        .admin-badge {
          background: #dc2626;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 6px;
        }

        .user-actions {
          display: flex;
          gap: 8px;
        }

        .approve-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 6px;
          background: #dcfce7;
          color: #166534;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .approve-btn:hover {
          background: #bbf7d0;
          color: #15803d;
        }

        .edit-btn, .delete-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .edit-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .delete-btn {
          background: #fef2f2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fecaca;
          color: #b91c1c;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
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
          font-size: 20px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .modal-body {
          padding: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
        }

        .form-group textarea {
          resize: vertical;
        }

        .password-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input input {
          width: 100%;
          padding-right: 40px;
        }

        .password-input button {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .skills-section,
        .certifications-section {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }

        .selected-skills,
        .selected-certifications {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .skill-tag,
        .cert-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .skill-tag button,
        .cert-tag button {
          background: none;
          border: none;
          color: #1e40af;
          cursor: pointer;
          padding: 0;
        }

        .available-skills,
        .available-certifications {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .skill-option,
        .cert-option {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skill-option:hover,
        .cert-option:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .password-requirements {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .password-requirements h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 14px;
        }

        .password-requirements ul {
          margin: 0;
          padding-left: 20px;
          color: #6b7280;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .modal-actions button {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-actions button:hover {
          background: #f9fafb;
        }

        .primary-btn {
          background: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .primary-btn:hover {
          background: #2563eb !important;
        }

        /* View Modal Styles */
        .view-modal {
          max-width: 500px !important;
        }

        .profile-summary {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .profile-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          border: 3px solid #dbeafe;
        }

        .profile-main-info h4 {
          margin: 0 0 4px 0;
          font-size: 20px;
          color: #1f2937;
        }

        .profile-role {
          background: #f3f4f6;
          color: #4b5563;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .profile-details-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed #f3f4f6;
        }

        .detail-label {
          color: #6b7280;
          font-weight: 500;
        }

        .detail-value {
          color: #1f2937;
          font-weight: 600;
        }

        .laser-details-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }

        .laser-details-box h5 {
          margin: 0 0 12px 0;
          color: #3b82f6;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .laser-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .laser-info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .laser-info-item .label {
          font-size: 12px;
          color: #64748b;
        }

        .laser-info-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .status-badge.available {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.unavailable {
          background: #fee2e2;
          color: #991b1b;
        }

        .view-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 6px;
          background: #eff6ff;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .view-btn:hover {
          background: #dbeafe;
          color: #1d4ed8;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .search-filter-section {
            flex-direction: column;
          }

          .user-card {
            flex-direction: column;
            text-align: center;
          }

          .user-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
