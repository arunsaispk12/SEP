// src/components/SignupPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import supabaseService from '../services/supabaseService';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const ROLES = [
  { value: 'engineer',  label: 'Field Engineer', icon: '🔧', desc: 'Handles on-site service cases' },
  { value: 'manager',   label: 'Manager',        icon: '👨‍💼', desc: 'Oversees teams & approvals' },
  { value: 'executive', label: 'Executive',       icon: '👔', desc: 'Analytics & reporting' },
  { value: 'client',    label: 'Client',          icon: '🏥', desc: 'Submit service requests' },
];

const STEPS = [
  { n: 1, label: 'Account' },
  { n: 2, label: 'Work Profile' },
  { n: 3, label: 'Review' },
];

const DEFAULT_LOCATIONS = [
  { id: 1, name: 'Hyderabad' },
  { id: 2, name: 'Bangalore' },
  { id: 3, name: 'Coimbatore' },
  { id: 4, name: 'Chennai' },
];
const SIGNUP_SUCCESS_STORAGE_KEY = 'sep-signup-success';
const SIGNUP_SUCCESS_TTL_MS = 10 * 60 * 1000;

const LBL = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 };
const SECTION = { marginBottom: 14 };

const LogoMark = () => (
  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 28px rgba(167,139,250,0.45)', marginBottom: 12 }}>
    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
      <circle cx="5" cy="5" r="1.8" fill="white"/>
      <circle cx="11" cy="5" r="1.8" fill="white"/>
      <circle cx="17" cy="5" r="1.8" fill="white"/>
      <circle cx="5" cy="11" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="11" r="2.5" fill="white"/>
      <circle cx="17" cy="11" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="5" cy="17" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="17" r="1.8" fill="white"/>
      <circle cx="17" cy="17" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <line x1="11" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="5" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="17" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="11" y1="11" x2="11" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
    </svg>
  </div>
);

function DarkInput({ type = 'text', value, onChange, placeholder, focused, onFocus, onBlur, autoFocus }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: '100%', height: 42, padding: '0 14px',
        background: focused ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.05)',
        border: focused ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: focused ? '0 0 0 3px rgba(167,139,250,0.12)' : 'none',
        borderRadius: 10, color: '#fff', fontSize: 14,
        fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color .15s, box-shadow .15s',
      }}
    />
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{msg}</div>;
}

export default function SignupPage() {
  const { signUp, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locationId, setLocationId] = useState('');
  const [role, setRole] = useState('engineer');
  const [locations, setLocations] = useState([]);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [completedEmail, setCompletedEmail] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    supabaseService.getLocations()
      .then(data => {
        const mappedLocations = (data || [])
          .map(l => ({ id: l.id, name: l.name }))
          .filter(l => l.id != null && l.name);

        setLocations(mappedLocations.length > 0 ? mappedLocations : DEFAULT_LOCATIONS);
        setLocationsLoading(false);
      })
      .catch(() => {
        setLocations(DEFAULT_LOCATIONS);
        setLocationsLoading(false);
      });
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SIGNUP_SUCCESS_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!parsed?.createdAt || Date.now() - parsed.createdAt > SIGNUP_SUCCESS_TTL_MS) {
        sessionStorage.removeItem(SIGNUP_SUCCESS_STORAGE_KEY);
        return;
      }

      if (parsed?.email) {
        setCompletedEmail(parsed.email);
      }
      setDone(true);
    } catch (error) {
      console.warn('Failed to restore signup success state:', error);
      sessionStorage.removeItem(SIGNUP_SUCCESS_STORAGE_KEY);
    }
  }, []);

  const validateStep1 = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Please enter a valid email';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!locationId) e.location = 'Please select your location';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const ok = await signUp(email, password, {
        name,
        role,
        location_id: Number(locationId),
        phone: '',
        bio: '',
        skills: [],
        certifications: [],
        experience_years: 0,
        avatar: '👤',
        is_available: true,
        is_active: true,
      });
      if (ok) {
        sessionStorage.setItem(SIGNUP_SUCCESS_STORAGE_KEY, JSON.stringify({
          email,
          createdAt: Date.now()
        }));
        setCompletedEmail(email);
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fld = (id) => ({
    onFocus: () => setFocused(id),
    onBlur: () => setFocused(null),
    focused: focused === id,
  });

  const selectedLocation = locations.find(l => String(l.id) === String(locationId));
  const selectedRole = ROLES.find(r => r.value === role);

  // ── SUCCESS STATE ──
  if (done) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
        <div style={{ width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18, backdropFilter: 'blur(20px)', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Account created!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 28 }}>
            We sent a confirmation to <span style={{ color: '#fff' }}>{completedEmail || email}</span>.<br/>Verify your email to activate your account, then wait for admin approval.
          </div>
          <Link to="/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 10, padding: '12px 28px', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>← Back to Sign In</Link>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT, position: 'relative' }}>

      {/* radial glow behind card */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18, backdropFilter: 'blur(20px)', boxShadow: '0 32px 64px rgba(0,0,0,0.5),0 0 40px rgba(139,92,246,0.08)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── CARD HEADER ── */}
        <div style={{ padding: '28px 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <LogoMark />
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginBottom: 2 }}>Service Engineer Planner</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1 }}>Field Operations Platform</div>
        </div>

        {/* ── STEP PROGRESS ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 28px 0' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: step > s.n ? 13 : 11, fontWeight: 700,
                  background: step > s.n ? 'rgba(52,211,153,0.15)' : step === s.n ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                  border: step > s.n ? '1px solid rgba(52,211,153,0.5)' : step === s.n ? '1px solid rgba(167,139,250,0.65)' : '1px solid rgba(255,255,255,0.1)',
                  color: step > s.n ? '#34d399' : step === s.n ? '#c4b5fd' : 'rgba(255,255,255,0.2)',
                  boxShadow: step === s.n ? '0 0 0 4px rgba(167,139,250,0.1),0 0 16px rgba(167,139,250,0.25)' : 'none',
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: step === s.n ? '#c4b5fd' : step > s.n ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{s.label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.n ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)', marginTop: 14 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── CARD BODY ── */}
        <div style={{ padding: '20px 28px 28px' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Create your account</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Start with your name and credentials</div>
              <div style={SECTION}>
                <div style={LBL}>Full Name</div>
                <DarkInput value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoFocus {...fld('name')} />
                <FieldError msg={errors.name} />
              </div>
              <div style={SECTION}>
                <div style={LBL}>Work Email</div>
                <DarkInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" {...fld('email')} />
                <FieldError msg={errors.email} />
              </div>
              <div className="signup-password-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={LBL}>Password</div>
                  <DarkInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" {...fld('password')} />
                  <FieldError msg={errors.password} />
                </div>
                <div>
                  <div style={LBL}>Confirm</div>
                  <DarkInput type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" {...fld('confirm')} />
                  <FieldError msg={errors.confirmPassword} />
                </div>
              </div>
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, marginTop: 6 }}>Continue →</button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Your work profile</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Tell us where you're based and what you do</div>
              <div style={SECTION}>
                <div style={LBL}>Location</div>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  disabled={locationsLoading}
                  style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: locationId ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', cursor: locationsLoading ? 'wait' : 'pointer', opacity: locationsLoading ? 0.5 : 1 }}
                >
                  <option value="" style={{ background: '#1e1b4b', color: '#fff' }}>{locationsLoading ? 'Loading cities…' : 'Select your city'}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id} style={{ background: '#1e1b4b', color: '#fff' }}>{l.name}</option>
                  ))}
                </select>
                <FieldError msg={errors.location} />
              </div>
              <div style={SECTION}>
                <div style={LBL}>Role</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {ROLES.map(r => (
                    <div
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      style={{
                        background: role === r.value ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.04)',
                        border: role === r.value ? '1px solid rgba(167,139,250,0.55)' : '1px solid rgba(255,255,255,0.09)',
                        boxShadow: role === r.value ? '0 0 0 1px rgba(167,139,250,0.15),0 0 20px rgba(167,139,250,0.1)' : 'none',
                        borderRadius: 12, padding: 14, cursor: 'pointer', userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: role === r.value ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{r.icon}</div>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: role === r.value ? '1.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.15)', background: role === r.value ? 'rgba(167,139,250,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {role === r.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: role === r.value ? '#c4b5fd' : 'rgba(255,255,255,0.75)', marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, marginTop: 6 }}>Continue →</button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>← Back</button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Review your details</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Everything look right? You can go back to edit.</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { icon: '👤', iconBg: 'rgba(96,165,250,0.1)',    key: 'Full Name',   val: name },
                  { icon: '✉',  iconBg: 'rgba(52,211,153,0.1)',   key: 'Work Email',  val: email },
                  { icon: '📍', iconBg: 'rgba(251,191,36,0.1)',   key: 'Location',    val: selectedLocation?.name || '—' },
                  { icon: selectedRole?.icon, iconBg: 'rgba(167,139,250,0.12)', key: 'Role', val: null, chip: selectedRole?.label },
                ].map((row, i, arr) => (
                  <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{row.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '.3px', marginBottom: 2 }}>{row.key}</div>
                      {row.chip
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6 }}>{row.chip}</span>
                        : <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{row.val}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleSubmit} disabled={submitting || loading} style={{ background: submitting || loading ? 'rgba(71,85,105,0.6)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting || loading ? 'not-allowed' : 'pointer', boxShadow: submitting || loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting || loading
                  ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Creating account...</>
                  : 'Create Account →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>← Back</button>
              </div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 10, fontSize: 11, color: 'rgba(52,211,153,0.7)', lineHeight: 1.7, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
                <span>Your account will be reviewed by an admin. You'll receive an email once access is approved — usually within 24 hours.</span>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
