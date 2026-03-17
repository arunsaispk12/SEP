import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Phone, MapPin, Briefcase, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import supabaseService from '../services/supabaseService';

const SignupPage = () => {
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
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

// Always use quick mode - simplified signup
const [quickMode] = useState(true);
  
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    { value: 'admin', label: 'Administrator', icon: '🛡️' },
    { value: 'executive', label: 'Executive', icon: '👔' },
    { value: 'client', label: 'Client (Hospital)', icon: '🏥' }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleCertificationToggle = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.location_id) {
      newErrors.location = 'Please select your location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: formData.role,
          location_id: formData.location_id,
          phone: formData.phone || '',
          bio: '',
          skills: [],
          certifications: [],
          experience_years: 0,
          avatar: '👨‍🔧',
          is_available: true,
          is_active: true
        }
      );

      if (success) {
        // Form will be reset by the auth context
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'engineer',
          location_id: '',
          phone: '',
          bio: '',
          skills: [],
          certifications: [],
          experience_years: 0,
          avatar: '👨‍🔧'
        });

        // Redirect to dashboard after successful signup
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        console.log('Signup failed but no exception was thrown');
      }
    } catch (error) {
      console.error('Signup error in SignupPage:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <Link to="/login" className="back-link">
            <ArrowLeft size={20} />
            Back to Login
          </Link>
          <h1>Create Account</h1>
          <p>Join the Service Engineer Planner team</p>
        </div>


        <form onSubmit={handleSubmit} className="signup-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  <User size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={16} />
                  Password *
                </label>
                <div className="password-input">
                  <input
                    type={showPasswords.password ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                    className="password-toggle"
                  >
                    {showPasswords.password ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <Lock size={16} />
                  Confirm Password *
                </label>
                <div className="password-input">
                  <input
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                    className="password-toggle"
                  >
                    {showPasswords.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="form-section">
            <h3>Professional Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.icon} {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location_id">
                  <MapPin size={16} />
                  Location *
                </label>
                <select
                  id="location_id"
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select your location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>
            </div>

          </div>


          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="signup-btn"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </div>

          <div className="signup-footer">
            <p>Already have an account? <Link to="/login">Sign in here</Link></p>
          </div>
        </form>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .signup-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .signup-header {
          padding: 30px 30px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 20px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #3b82f6;
        }

        .mode-toggle {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          gap: 10px;
        }

        .mode-btn {
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-btn.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }

        .mode-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .signup-header h1 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
        }

        .signup-header p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .signup-form {
          padding: 30px;
        }

        .form-section {
          margin-bottom: 30px;
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
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
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: #ef4444;
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

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
        }

        .skills-container,
        .certifications-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .selected-skills,
        .selected-certifications {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .skill-tag,
        .cert-tag {
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

        .remove-skill,
        .remove-cert {
          background: none;
          border: none;
          color: #1e40af;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
          margin-left: 4px;
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
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skill-option:hover,
        .cert-option:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .form-actions {
          margin-top: 30px;
        }

        .signup-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .signup-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .signup-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .signup-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .signup-footer a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }

        .signup-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .signup-container {
            margin: 10px;
          }

          .signup-form {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignupPage;
