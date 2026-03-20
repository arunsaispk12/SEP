import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Shield, Save, Eye, EyeOff, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const getInitials = n => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '?';

const LASER_TYPES = ['HT Lykos Singleshot', 'HT Lykos DTS'];

const ProfileManagement = () => {
  const { profile, updateProfile, changePassword } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || '',
    laser_type: profile?.laser_type || '',
    serial_number: profile?.serial_number || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const locations = [
    { id: 1, name: 'Hyderabad' },
    { id: 2, name: 'Bangalore' },
    { id: 3, name: 'Coimbatore' },
    { id: 4, name: 'Chennai' }
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

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
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully');
      }
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'engineer': return { label: 'Service Engineer', icon: '🔧', color: '#3b82f6' };
      case 'manager':  return { label: 'Manager', icon: '👨‍💼', color: '#10b981' };
      case 'admin':    return { label: 'Administrator', icon: '🛡️', color: '#f59e0b' };
      default:         return { label: role, icon: '👤', color: '#6b7280' };
    }
  };

  const roleInfo = getRoleInfo(profile?.role);

  const resetEdit = () => {
    setIsEditing(false);
    setProfileData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || '',
      laser_type: profile?.laser_type || '',
      serial_number: profile?.serial_number || '',
    });
  };

  return (
    <div className="profile-layout" style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: '#f1f5f9' }}>

      {/* Profile Header */}
      <div className="glass-panel profile-header" style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {profileData.avatar_url ? (
            <img src={profileData.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 28 }}>{getInitials(profileData.name)}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: 24, fontWeight: 700 }}>{profileData.name}</h2>
          <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: 16 }}>{profileData.email}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 14, fontWeight: 600, background: roleInfo.color }}>
            {roleInfo.icon} {roleInfo.label}
          </span>
        </div>
        <div className="profile-header-actions" style={{ display: 'flex', gap: 12 }}>
          {!isEditing ? (
            <button className="glass-btn-primary" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit size={16} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="glass-btn-secondary" onClick={resetEdit}>Cancel</button>
              <button className="glass-btn-primary" onClick={handleProfileUpdate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Basic Information */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: 18, fontWeight: 600 }}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <User size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Full Name</label>
                {isEditing ? (
                  <input type="text" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} className="glass-input" />
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
                  <input type="tel" value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} className="glass-input" placeholder="Enter phone number" />
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
          </div>

          {/* Avatar URL (edit mode only) */}
          {isEditing && (
            <div style={{ marginTop: 20 }}>
              <div className="section-label">Avatar URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {profileData.avatar_url ? (
                    <img src={profileData.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  ) : getInitials(profileData.name || '')}
                </div>
                <input type="url" value={profileData.avatar_url || ''} onChange={e => setProfileData(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://example.com/photo.jpg" className="glass-input" />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>Enter a public image URL. Leave blank to use initials avatar.</div>
            </div>
          )}
        </div>

        {/* Laser Details */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: 18, fontWeight: 600 }}>🔬 Laser Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Laser Type</label>
                {isEditing ? (
                  <select value={profileData.laser_type} onChange={e => setProfileData(p => ({ ...p, laser_type: e.target.value }))} className="glass-select">
                    <option value="">Select laser type</option>
                    {LASER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <span style={{ color: profileData.laser_type ? '#fff' : '#64748b', fontSize: 16 }}>
                    {profileData.laser_type || 'Not specified'}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Serial Number</label>
                {isEditing ? (
                  <input type="text" value={profileData.serial_number} onChange={e => setProfileData(p => ({ ...p, serial_number: e.target.value }))} className="glass-input" placeholder="Enter serial number" />
                ) : (
                  <span style={{ color: profileData.serial_number ? '#fff' : '#64748b', fontSize: 16 }}>
                    {profileData.serial_number || 'Not specified'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: 18, fontWeight: 600 }}>Security</h3>
          <button className="glass-btn-primary" onClick={() => setShowPasswordForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} /> Change Password
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 600 }}>Change Password</h3>
              <button onClick={() => setShowPasswordForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handlePasswordChange}>
              {[
                { key: 'currentPassword', label: 'Current Password *', placeholder: 'Enter current password', show: 'current' },
                { key: 'newPassword',     label: 'New Password *',     placeholder: 'Enter new password',     show: 'new' },
                { key: 'confirmPassword', label: 'Confirm New Password *', placeholder: 'Confirm new password', show: 'confirm' },
              ].map(({ key, label, placeholder, show }) => (
                <div key={key} style={{ marginBottom: 18 }}>
                  <div className="section-label">{label}</div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords[show] ? 'text' : 'password'}
                      value={passwordData[key]}
                      onChange={e => setPasswordData(p => ({ ...p, [key]: e.target.value }))}
                      required
                      placeholder={placeholder}
                      className="glass-input"
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [show]: !p[show] }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                      {showPasswords[show] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: 12, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: 14 }}>Password Requirements:</h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#64748b', fontSize: 14 }}>
                  <li>At least 6 characters long</li>
                  <li>Must be different from current password</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPasswordForm(false)} className="glass-btn-secondary">Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} /> Change Password
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
