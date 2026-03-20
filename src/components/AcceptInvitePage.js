import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import supabaseService from '../services/supabaseService';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle, User, Phone, Lock, Zap } from 'lucide-react';

const LASER_TYPES = ['HT Lykos Singleshot', 'HT Lykos DTS'];

const AcceptInvitePage = () => {
  const { profile, completeInviteSetup } = useAuth();

  const [sessionStatus, setSessionStatus] = useState('checking'); // checking | valid | invalid | done
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3 state
  const [laserType, setLaserType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Validation
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const step1Valid = password.length >= 8 && password === confirmPassword;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setSessionStatus('invalid');
      } else if (session && profile?.is_active) {
        setSessionStatus('done');
      } else {
        setSessionStatus('valid');
        setName(profile?.name || '');
      }
    });
  }, [profile]);

  useEffect(() => {
    if (sessionStatus === 'done') window.location.href = '/';
  }, [sessionStatus]);

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!step1Valid) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to set password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }
    setStep(3);
  };

  const finishSetup = async (laser_type, serial_number) => {
    setSubmitting(true);
    try {
      const updatedProfile = await supabaseService.completeInviteProfile({
        name: name.trim(),
        phone: phone.trim(),
        laser_type: laser_type || null,
        serial_number: serial_number || null,
      });
      toast.success(`Welcome, ${updatedProfile.name}!`);
      completeInviteSetup(updatedProfile);
    } catch (err) {
      toast.error(err.message || 'Failed to save details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    await finishSetup(laserType, serialNumber);
  };

  const handleSkipLaser = async () => {
    await finishSetup('', '');
  };

  if (sessionStatus === 'checking' || sessionStatus === 'done') {
    return (
      <div className="accept-invite-screen">
        <div className="accept-invite-card">
          <div className="invite-loading">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'invalid') {
    return (
      <div className="accept-invite-screen">
        <div className="accept-invite-card">
          <div className="invite-error">
            <div className="invite-error-icon">✉️</div>
            <h2>Invalid Invite Link</h2>
            <p>This invite link is invalid or has expired.</p>
            <p className="invite-error-sub">Contact your admin to resend the invite.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accept-invite-screen">
      <div className="accept-invite-card">
        {/* Header */}
        <div className="invite-header">
          <div className="invite-logo">⚙️</div>
          <h1>Welcome to SEP</h1>
          <p>Complete your account setup</p>
        </div>

        {/* Progress */}
        <div className="invite-progress">
          <div className={`invite-step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            {step > 1 ? <CheckCircle size={14} /> : '1'}
          </div>
          <div className={`invite-step-line ${step > 1 ? 'done' : ''}`} />
          <div className={`invite-step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
            {step > 2 ? <CheckCircle size={14} /> : '2'}
          </div>
          <div className={`invite-step-line ${step > 2 ? 'done' : ''}`} />
          <div className={`invite-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className="invite-step-labels">
            <span>Set password</span>
            <span>Your details</span>
            <span>Laser info</span>
          </div>
        </div>

        {/* Step 1 — Password */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="invite-form">
            <h2>Set your password</h2>

            <div className="invite-field">
              <label><Lock size={14} /> Password</label>
              <div className="invite-password-wrap">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" autoFocus />
                <button type="button" className="invite-toggle-pw" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordTooShort && <span className="invite-error-msg">At least 8 characters required</span>}
            </div>

            <div className="invite-field">
              <label><Lock size={14} /> Confirm password</label>
              <div className="invite-password-wrap">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
                <button type="button" className="invite-toggle-pw" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordMismatch && <span className="invite-error-msg">Passwords do not match</span>}
            </div>

            <button type="submit" className="invite-btn" disabled={!step1Valid || submitting}>
              {submitting ? 'Setting password…' : 'Next →'}
            </button>
          </form>
        )}

        {/* Step 2 — Name & Phone */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="invite-form">
            <h2>Your details</h2>

            <div className="invite-field">
              <label><User size={14} /> Full name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required autoFocus />
            </div>

            <div className="invite-field">
              <label><Phone size={14} /> Phone number *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
            </div>

            <button type="submit" className="invite-btn" disabled={!name.trim() || !phone.trim() || submitting}>
              Next →
            </button>
          </form>
        )}

        {/* Step 3 — Laser Details (optional) */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="invite-form">
            <h2><Zap size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Laser Details</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Optional — you can set this later in your profile.</p>

            <div className="invite-field">
              <label>Laser Type</label>
              <select value={laserType} onChange={e => setLaserType(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 14px', color: laserType ? '#fff' : '#64748b', fontSize: 14, outline: 'none' }}>
                <option value="">Select laser type</option>
                {LASER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="invite-field">
              <label>Serial Number</label>
              <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="e.g. HTL-2024-00123" />
            </div>

            <button type="submit" className="invite-btn" disabled={submitting}>
              {submitting ? 'Completing setup…' : 'Complete Setup ✓'}
            </button>

            <button type="button" onClick={handleSkipLaser} disabled={submitting} style={{ width: '100%', marginTop: 10, padding: '11px 0', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
              Skip for now
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitePage;
