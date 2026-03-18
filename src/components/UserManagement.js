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

  const handleViewUser = (u) => {
    setSelectedUser(u);
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

  const iconBtnStyle = {
    width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: 28, fontWeight: 700 }}>User Management</h2>
          <p style={{ margin: 0, color: '#94a3b8' }}>Manage service engineers and user accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="glass-btn-secondary"
            onClick={() => setShowLocationForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={20} />
            Add Location
          </button>
          <button
            className="glass-btn-primary"
            onClick={() => setShowAddForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <UserPlus size={20} />
            Add New User
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input"
          style={{ flex: 1, minWidth: 200 }}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="glass-select"
          style={{ minWidth: 150 }}
        >
          <option value="all">All Roles</option>
          <option value="engineer">Engineers</option>
          <option value="manager">Managers</option>
          <option value="admin">Administrators</option>
        </select>
        <select
          value={filterApproval}
          onChange={(e) => setFilterApproval(e.target.value)}
          className="glass-select"
          style={{ minWidth: 160 }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved Only</option>
        </select>
      </div>

      {/* Users List */}
      <div style={{ display: 'grid', gap: 16 }}>
        {filteredUsers.map((engineer) => (
          <div key={engineer.id} className="glass-panel-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20, transition: 'all 0.2s' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              <span>{engineer.avatar || '👤'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                {engineer.name}
                {!engineer.is_approved && (
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>
                    PENDING
                  </span>
                )}
              </div>
              <div style={{ color: '#94a3b8', marginBottom: 8 }}>{engineer.email}</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#94a3b8' }}>
                  {getRoleIcon(engineer.role)} {getRoleLabel(engineer.role)}
                  {engineer.role === 'admin' && (
                    <span style={{ background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>ADMIN</span>
                  )}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#94a3b8' }}>
                  <MapPin size={14} />
                  {locations.find(l => l.id === engineer.location_id)?.name || 'Unknown'}
                </span>
                {engineer.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#94a3b8' }}>
                    <Phone size={14} />
                    {engineer.phone}
                  </span>
                )}
              </div>
              {engineer.skills && engineer.skills.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {engineer.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} style={{ background: 'rgba(123,97,255,0.15)', color: '#a78bfa', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>{skill}</span>
                  ))}
                  {engineer.skills.length > 3 && (
                    <span style={{ color: '#64748b', fontSize: 12 }}>+{engineer.skills.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!engineer.is_approved && (
                <button
                  style={{ ...iconBtnStyle, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                  onClick={() => approveUser(engineer.id)}
                  title="Approve User"
                >
                  <Save size={16} />
                </button>
              )}
              <button
                style={{ ...iconBtnStyle, background: 'rgba(123,97,255,0.15)', color: '#a78bfa', border: '1px solid rgba(123,97,255,0.2)' }}
                onClick={() => handleViewUser(engineer)}
                title="View Profile"
              >
                <Eye size={16} />
              </button>
              <button
                style={{ ...iconBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => { setEditingUser(engineer); setShowEditForm(true); }}
                title="Edit User"
              >
                <Edit size={16} />
              </button>
              <button
                style={{ ...iconBtnStyle, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                onClick={() => handleDeleteUser(engineer.id)}
                title="Delete User"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Leaves Management */}
      <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} /> Engineers' Leaves
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>View and modify leave requests</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(leaves || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No leaves found</div>
          ) : (
            (leaves || []).map(leave => (
              <div key={leave.id} className="glass-panel-sm" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{getEngineerName(leave.engineer_id)}</div>
                  <div style={{ color: '#94a3b8', fontSize: 14 }}>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</div>
                  <div style={{ color: '#64748b', fontSize: 14 }}>{leave.reason || 'No reason'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...iconBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => openEditLeave(leave)} title="Edit Leave">
                    <Edit size={16} />
                  </button>
                  <button style={{ ...iconBtnStyle, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => deleteLeave(leave.id)} title="Cancel Leave">
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
        <div className="glass-modal-backdrop">
          <div className="glass-modal-wide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}>Add New User</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Full Name *</div>
                  <input type="text" value={newUser.name} onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))} required className="glass-input" />
                </div>
                <div>
                  <div className="section-label">Email *</div>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))} required className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Password *</div>
                  <div style={{ position: 'relative' }}>
                    <input type={showPasswords.new ? 'text' : 'password'} value={newUser.password} onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))} required className="glass-input" style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="section-label">Confirm Password *</div>
                  <div style={{ position: 'relative' }}>
                    <input type={showPasswords.confirm ? 'text' : 'password'} value={newUser.confirmPassword} onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))} required className="glass-input" style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Role *</div>
                  <select value={newUser.role} onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))} required className="glass-select">
                    {roles.map(role => <option key={role.value} value={role.value}>{role.icon} {role.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="section-label">Location *</div>
                  <select value={newUser.location_id} onChange={(e) => setNewUser(prev => ({ ...prev, location_id: parseInt(e.target.value) }))} required className="glass-select">
                    {locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Phone</div>
                  <input type="tel" value={newUser.phone} onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))} className="glass-input" />
                </div>
                <div>
                  <div className="section-label">Experience (Years)</div>
                  <input type="number" min="0" value={newUser.experience_years} onChange={(e) => setNewUser(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))} className="glass-input" />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Bio</div>
                <textarea value={newUser.bio} onChange={(e) => setNewUser(prev => ({ ...prev, bio: e.target.value }))} rows="3" className="glass-textarea" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Skills</div>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {newUser.skills.map((skill, index) => (
                      <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(123,97,255,0.2)', color: '#a78bfa', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {availableSkills.filter(skill => !newUser.skills.includes(skill)).map(skill => (
                      <button key={skill} type="button" className="glass-btn-secondary" onClick={() => addSkill(skill)} style={{ padding: '4px 10px', fontSize: 12 }}>{skill}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="section-label">Certifications</div>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {newUser.certifications.map((cert, index) => (
                      <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(6,182,212,0.15)', color: '#22d3ee', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>
                        {cert}
                        <button type="button" onClick={() => removeCertification(cert)} style={{ background: 'none', border: 'none', color: '#22d3ee', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {availableCertifications.filter(cert => !newUser.certifications.includes(cert)).map(cert => (
                      <button key={cert} type="button" className="glass-btn-secondary" onClick={() => addCertification(cert)} style={{ padding: '4px 10px', fontSize: 12 }}>{cert}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div className="glass-modal-backdrop">
          <div className="glass-modal-wide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}>Edit User</h3>
              <button onClick={() => { setShowEditForm(false); setEditingUser(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Full Name *</div>
                  <input type="text" value={editingUser.name} onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))} required className="glass-input" />
                </div>
                <div>
                  <div className="section-label">Email *</div>
                  <input type="email" value={editingUser.email} onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))} required className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Role *</div>
                  <select value={editingUser.role} onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))} required className="glass-select">
                    {roles.map(role => <option key={role.value} value={role.value}>{role.icon} {role.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="section-label">Location *</div>
                  <select value={editingUser.location_id} onChange={(e) => setEditingUser(prev => ({ ...prev, location_id: parseInt(e.target.value) }))} required className="glass-select">
                    {locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Phone</div>
                  <input type="tel" value={editingUser.phone || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))} className="glass-input" />
                </div>
                <div>
                  <div className="section-label">Experience (Years)</div>
                  <input type="number" min="0" value={editingUser.experience_years || 0} onChange={(e) => setEditingUser(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))} className="glass-input" />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="section-label">Bio</div>
                <textarea value={editingUser.bio || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, bio: e.target.value }))} rows="3" className="glass-textarea" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => { setShowEditForm(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}>Edit Leave</h3>
              <button onClick={() => { setShowLeaveModal(false); setEditingLeave(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateLeave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Engineer</div>
                  <input type="text" value={getEngineerName(leaveForm.engineer_id)} readOnly className="glass-input" style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <div className="section-label">Status</div>
                  <input type="text" value="Approved" readOnly className="glass-input" style={{ opacity: 0.7 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">Start Date</div>
                  <input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))} required className="glass-input" />
                </div>
                <div>
                  <div className="section-label">End Date</div>
                  <input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))} required className="glass-input" />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">Reason</div>
                <textarea rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} className="glass-textarea" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => { setShowLeaveModal(false); setEditingLeave(null); }}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} />Update Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showLocationForm && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}>Add New Location</h3>
              <button onClick={() => setShowLocationForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLocation}>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Location Name *</div>
                <input type="text" value={newLocation.name} onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))} required placeholder="e.g., Mumbai Office" className="glass-input" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="section-label">Address</div>
                <input type="text" value={newLocation.address} onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))} placeholder="Street address" className="glass-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="section-label">City</div>
                  <input type="text" value={newLocation.city} onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))} placeholder="City name" className="glass-input" />
                </div>
                <div>
                  <div className="section-label">State</div>
                  <input type="text" value={newLocation.state} onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))} placeholder="State name" className="glass-input" />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">Pincode</div>
                <input type="text" value={newLocation.pincode} onChange={(e) => setNewLocation(prev => ({ ...prev, pincode: e.target.value }))} placeholder="PIN code" className="glass-input" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => setShowLocationForm(false)}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}>Change Password</h3>
              <button onClick={() => setShowPasswordForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 16 }}>
                <div className="section-label">Current Password *</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPasswords.current ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} required className="glass-input" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div className="section-label">New Password *</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPasswords.new ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} required className="glass-input" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div className="section-label">Confirm New Password *</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPasswords.confirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} required className="glass-input" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 12, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: 14 }}>Password Requirements:</h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#64748b', fontSize: 14 }}>
                  <li>At least 6 characters long</li>
                  <li>Must be different from current password</li>
                </ul>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}>User Profile</h3>
              <button onClick={() => { setShowViewModal(false); setSelectedUser(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {selectedUser.avatar || '👤'}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 18 }}>{selectedUser.name}</h4>
                <span style={{ background: 'rgba(123,97,255,0.15)', color: '#a78bfa', padding: '3px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#64748b', fontSize: 14, minWidth: 80 }}>Email:</span>
                <span style={{ color: '#e2e8f0', fontSize: 14 }}>{selectedUser.email}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#64748b', fontSize: 14, minWidth: 80 }}>Phone:</span>
                <span style={{ color: '#e2e8f0', fontSize: 14 }}>{selectedUser.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#64748b', fontSize: 14, minWidth: 80 }}>Location:</span>
                <span style={{ color: '#e2e8f0', fontSize: 14 }}>{locations.find(l => l.id === selectedUser.location_id)?.name || 'N/A'}</span>
              </div>
            </div>

            {selectedUser.role === 'engineer' && (
              <div style={{ background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 16 }}>
                <h5 style={{ margin: '0 0 12px 0', color: '#a78bfa', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Laser Equipment Details</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Laser Type</div>
                    <div style={{ color: '#e2e8f0' }}>{selectedUser.laser_type || 'Not specified'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Serial Number</div>
                    <div style={{ color: '#e2e8f0' }}>{selectedUser.serial_number || 'Not specified'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Tracker Status</div>
                    <span style={{ background: selectedUser.tracker_status === 'Available' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)', color: selectedUser.tracker_status === 'Available' ? '#4ade80' : '#f87171', padding: '3px 8px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                      {selectedUser.tracker_status || 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="glass-btn-secondary" onClick={() => { setShowViewModal(false); setSelectedUser(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
