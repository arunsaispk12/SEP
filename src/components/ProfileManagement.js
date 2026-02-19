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
    avatar: profile?.avatar || '👨‍🔧'
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
    <div className="profile-management">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-emoji">{profileData.avatar}</span>
        </div>
        <div className="profile-info">
          <h2>{profileData.name}</h2>
          <p className="profile-email">{profileData.email}</p>
          <div className="profile-role">
            <span 
              className="role-badge"
              style={{ backgroundColor: roleInfo.color }}
            >
              {roleInfo.icon} {roleInfo.label}
            </span>
          </div>
        </div>
        <div className="profile-actions">
          {!isEditing ? (
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="cancel-btn"
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
                    avatar: profile?.avatar || '👨‍🔧'
                  });
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleProfileUpdate}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        {/* Basic Information */}
        <div className="profile-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <User size={20} />
              <div className="info-content">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{profileData.name}</span>
                )}
              </div>
            </div>

            <div className="info-item">
              <Mail size={20} />
              <div className="info-content">
                <label>Email</label>
                <span>{profileData.email}</span>
              </div>
            </div>

            <div className="info-item">
              <Phone size={20} />
              <div className="info-content">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="edit-input"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <span>{profileData.phone || 'Not provided'}</span>
                )}
              </div>
            </div>

            <div className="info-item">
              <MapPin size={20} />
              <div className="info-content">
                <label>Location</label>
                <span>
                  {locations.find(l => l.id === profile?.location_id)?.name || 'Not assigned'}
                </span>
              </div>
            </div>

            <div className="info-item">
              <Briefcase size={20} />
              <div className="info-content">
                <label>Experience</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={profileData.experience_years}
                    onChange={(e) => setProfileData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{profileData.experience_years} years</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="profile-section">
          <h3>Bio</h3>
          {isEditing ? (
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="edit-textarea"
              placeholder="Tell us about yourself..."
              rows="3"
            />
          ) : (
            <p className="bio-text">{profileData.bio || 'No bio provided'}</p>
          )}
        </div>

        {/* Skills */}
        <div className="profile-section">
          <h3>Skills</h3>
          {isEditing ? (
            <div className="skills-edit">
              <div className="selected-skills">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="available-skills">
                {availableSkills
                  .filter(skill => !profileData.skills.includes(skill))
                  .map(skill => (
                    <button
                      key={skill}
                      type="button"
                      className="skill-option"
                      onClick={() => addSkill(skill)}
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="skills-display">
              {profileData.skills.length > 0 ? (
                profileData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))
              ) : (
                <p className="no-skills">No skills added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="profile-section">
          <h3>Certifications</h3>
          {isEditing ? (
            <div className="certifications-edit">
              <div className="selected-certifications">
                {profileData.certifications.map((cert, index) => (
                  <span key={index} className="cert-tag">
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="available-certifications">
                {availableCertifications
                  .filter(cert => !profileData.certifications.includes(cert))
                  .map(cert => (
                    <button
                      key={cert}
                      type="button"
                      className="cert-option"
                      onClick={() => addCertification(cert)}
                    >
                      + {cert}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="certifications-display">
              {profileData.certifications.length > 0 ? (
                profileData.certifications.map((cert, index) => (
                  <span key={index} className="cert-tag">{cert}</span>
                ))
              ) : (
                <p className="no-certs">No certifications added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Security */}
        <div className="profile-section">
          <h3>Security</h3>
          <div className="security-actions">
            <button 
              className="password-btn"
              onClick={() => setShowPasswordForm(true)}
            >
              <Shield size={16} />
              Change Password
            </button>
          </div>
        </div>
      </div>

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
                ×
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
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="password-toggle"
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
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="password-toggle"
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
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="password-toggle"
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
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <Shield size={16} />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-management {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .profile-info {
          flex: 1;
        }

        .profile-info h2 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 700;
        }

        .profile-email {
          margin: 0 0 12px 0;
          color: #6b7280;
          font-size: 16px;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .profile-actions {
          display: flex;
          gap: 12px;
        }

        .edit-btn, .save-btn, .cancel-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-btn {
          background: #3b82f6;
          color: white;
        }

        .edit-btn:hover {
          background: #2563eb;
        }

        .save-btn {
          background: #10b981;
          color: white;
        }

        .save-btn:hover {
          background: #059669;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        .profile-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .profile-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .profile-section h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .info-item svg {
          color: #6b7280;
          flex-shrink: 0;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-content label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .info-content span {
          color: #1f2937;
          font-size: 16px;
        }

        .edit-input, .edit-textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
          width: 100%;
        }

        .edit-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .bio-text {
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .skills-edit, .certifications-edit {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .selected-skills, .selected-certifications {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .skill-tag, .cert-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #dbeafe;
          color: #1e40af;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #1e40af;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
          margin-left: 4px;
        }

        .available-skills, .available-certifications {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .skill-option, .cert-option {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skill-option:hover, .cert-option:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .skills-display, .certifications-display {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .no-skills, .no-certs {
          color: #9ca3af;
          font-style: italic;
          margin: 0;
        }

        .security-actions {
          display: flex;
          gap: 12px;
        }

        .password-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .password-btn:hover {
          background: #d97706;
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
          max-width: 500px;
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
          font-size: 24px;
          line-height: 1;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .password-input {
          position: relative;
        }

        .password-input input {
          width: 100%;
          padding: 12px 40px 12px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
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
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .profile-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileManagement;
