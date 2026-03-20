import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Save,
  Eye,
  EyeOff,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

const getInitials = n => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '?';

const ProfileManagement = () => {
  const { profile, updateProfile, changePassword } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    skills: profile?.skills || [],
    certifications: profile?.certifications || [],
    experience_years: profile?.experience_years || 0,
    avatar: profile?.avatar || '👨‍🔧',
    avatar_url: profile?.avatar_url || '',
    laser_type: profile?.laser_type || '',
    serial_number: profile?.serial_number || '',
    tracker_status: profile?.tracker_status || 'Not Available'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Available locations
  const locations = [
    { id: 1, name: 'Hyderabad' },
    { id: 2, name: 'Bangalore' },
    { id: 3, name: 'Coimbatore' },
    { id: 4, name: 'Chennai' }
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

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
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
        toast.success('Password changed successfully');
      }
    } catch (error) {
      toast.error('Failed to change password');
      console.error('Password change error:', error);
    }
  };

  // Handle skill addition
  const addSkill = (skill) => {
    if (!profileData.skills.includes(skill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  // Handle skill removal
  const removeSkill = (skill) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Handle certification addition
  const addCertification = (cert) => {
    if (!profileData.certifications.includes(cert)) {
      setProfileData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert]
      }));
    }
  };

  // Handle certification removal
  const removeCertification = (cert) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  // Get role display info
  const getRoleInfo = (role) => {
    switch (role) {
      case 'engineer':
        return { label: 'Service Engineer', icon: '🔧', color: '#3b82f6' };
      case 'manager':
        return { label: 'Manager', icon: '👨‍💼', color: '#10b981' };
      case 'admin':
        return { label: 'Administrator', icon: '🛡️', color: '#f59e0b' };
      default:
        return { label: role, icon: '👤', color: '#6b7280' };
    }
  };

  const roleInfo = getRoleInfo(profile?.role);

  return (
    <div className="profile-layout" style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: '#f1f5f9' }}>
      {/* Profile Header */}
      <div className="glass-panel profile-header" style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
          {profileData.avatar_url ? (
            <img
              src={profileData.avatar_url}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 28 }}>{getInitials(profileData.name)}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: 24, fontWeight: 700 }}>{profileData.name}</h2>
          <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: 16 }}>{profileData.email}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, color: 'white', fontSize: 14, fontWeight: 600, background: roleInfo.color }}>
            {roleInfo.icon} {roleInfo.label}
          </span>
        </div>
        <div className="profile-header-actions" style={{ display: 'flex', gap: 12 }}>
          {!isEditing ? (
            <button
              className="glass-btn-primary"
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="glass-btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setProfileData({
                    name: profile?.name || '',
                    email: profile?.email || '',
                    phone: profile?.phone || '',
                    bio: profile?.bio || '',
                    skills: profile?.skills || [],
                    certifications: profile?.certifications || [],
                    experience_years: profile?.experience_years || 0,
                    avatar: profile?.avatar || '👨‍🔧',
                    avatar_url: profile?.avatar_url || '',
                    laser_type: profile?.laser_type || '',
                    serial_number: profile?.serial_number || '',
                    tracker_status: profile?.tracker_status || 'Not Available'
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="glass-btn-primary"
                onClick={handleProfileUpdate}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Basic Information */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: 18, fontWeight: 600 }}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <User size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-input"
                  />
                ) : (
                  <span style={{ color: '#fff', fontSize: 16 }}>{profileData.name}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mail size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Email</label>
                <span style={{ color: '#fff', fontSize: 16 }}>{profileData.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Phone size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="glass-input"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <span style={{ color: '#fff', fontSize: 16 }}>{profileData.phone || 'Not provided'}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MapPin size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Location</label>
                <span style={{ color: '#fff', fontSize: 16 }}>
                  {locations.find(l => l.id === profile?.location_id)?.name || 'Not assigned'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Briefcase size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Experience</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={profileData.experience_years}
                    onChange={(e) => setProfileData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                    className="glass-input"
                  />
                ) : (
                  <span style={{ color: '#fff', fontSize: 16 }}>{profileData.experience_years} years</span>
                )}
              </div>
            </div>
          </div>

          {/* Avatar URL field (editing mode) */}
          {isEditing && (
            <div style={{ marginTop: 20 }}>
              <div className="section-label">Avatar URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : getInitials(profileData.name || '')}
                </div>
                <input
                  type="url"
                  value={profileData.avatar_url || ''}
                  onChange={e => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="glass-input"
                />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>Enter a public image URL. Leave blank to use initials avatar.</div>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: 18, fontWeight: 600 }}>Bio</h3>
          {isEditing ? (
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="glass-textarea"
              placeholder="Tell us about yourself..."
              rows="3"
            />
          ) : (
            <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{profileData.bio || 'No bio provided'}</p>
          )}
        </div>

        {/* Skills */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: 18, fontWeight: 600 }}>Skills</h3>
          {isEditing ? (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {profileData.skills.map((skill, index) => (
                  <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(123,97,255,0.2)', color: '#a78bfa', padding: '6px 12px', borderRadius: 20, fontSize: 14, fontWeight: 500 }}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 4 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableSkills
                  .filter(skill => !profileData.skills.includes(skill))
                  .map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profileData.skills.length > 0 ? (
                profileData.skills.map((skill, index) => (
                  <span key={index} style={{ background: 'rgba(123,97,255,0.2)', color: '#a78bfa', padding: '6px 12px', borderRadius: 20, fontSize: 14, fontWeight: 500 }}>
                    {skill}
                  </span>
                ))
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No skills added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: 18, fontWeight: 600 }}>Certifications</h3>
          {isEditing ? (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {profileData.certifications.map((cert, index) => (
                  <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(6,182,212,0.15)', color: '#22d3ee', padding: '6px 12px', borderRadius: 20, fontSize: 14, fontWeight: 500 }}>
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      style={{ background: 'none', border: 'none', color: '#22d3ee', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 4 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableCertifications
                  .filter(cert => !profileData.certifications.includes(cert))
                  .map(cert => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => addCertification(cert)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      + {cert}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profileData.certifications.length > 0 ? (
                profileData.certifications.map((cert, index) => (
                  <span key={index} style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', padding: '6px 12px', borderRadius: 20, fontSize: 14, fontWeight: 500 }}>
                    {cert}
                  </span>
                ))
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No certifications added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Laser Details (Engineers only) */}
        {profile?.role === 'engineer' && (
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: 18, fontWeight: 600 }}>Laser Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Laser Type</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.laser_type}
                      onChange={(e) => setProfileData(prev => ({ ...prev, laser_type: e.target.value }))}
                      className="glass-input"
                      placeholder="e.g., CO2 Laser, Fiber Laser"
                    />
                  ) : (
                    <span style={{ color: '#fff', fontSize: 16 }}>{profileData.laser_type || 'Not specified'}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Serial Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.serial_number}
                      onChange={(e) => setProfileData(prev => ({ ...prev, serial_number: e.target.value }))}
                      className="glass-input"
                      placeholder="Enter serial number"
                    />
                  ) : (
                    <span style={{ color: '#fff', fontSize: 16 }}>{profileData.serial_number || 'Not specified'}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MapPin size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Tracker Status</label>
                  {isEditing ? (
                    <select
                      value={profileData.tracker_status}
                      onChange={(e) => setProfileData(prev => ({ ...prev, tracker_status: e.target.value }))}
                      className="glass-select"
                    >
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  ) : (
                    <span style={{ color: '#fff', fontSize: 16 }}>{profileData.tracker_status}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Equipment Image</label>
                  {isEditing ? (
                    <div>
                      <input type="file" disabled title="Image upload coming soon" style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>Upload coming soon</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: '#64748b' }}>No image uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: 18, fontWeight: 600 }}>Security</h3>
          <button
            className="glass-btn-primary"
            onClick={() => setShowPasswordForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Shield size={16} />
            Change Password
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 600 }}>Change Password</h3>
              <button
                onClick={() => setShowPasswordForm(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 18 }}>
                <div className="section-label">Current Password *</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    placeholder="Enter current password"
                    className="glass-input"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div className="section-label">New Password *</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    placeholder="Enter new password"
                    className="glass-input"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div className="section-label">Confirm New Password *</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    placeholder="Confirm new password"
                    className="glass-input"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                  >
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

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="glass-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;
