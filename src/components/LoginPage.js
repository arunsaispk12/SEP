// src/components/LoginPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const LogoMark = () => (
  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 24px rgba(167,139,250,0.45)', flexShrink: 0, marginBottom: 12 }}>
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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

const PILLS = [
  { label: 'Real-time scheduling', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  { label: 'Engineer dispatch',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)' },
  { label: 'Case management',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  { label: 'Leave & approvals',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)' },
];

const LBL = { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 };

function DarkInput({ type = 'text', value, onChange, placeholder, onFocus, onBlur, focused, autoFocus }) {
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

export default function LoginPage() {
  const { login, resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [focused, setFocused] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) { setResetError('Please enter your email address'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      const ok = await resetPassword(resetEmail);
      if (ok) {
        setResetSuccess(true);
      } else {
        setResetError('Failed to send reset email. Please try again.');
      }
    } catch {
      setResetError('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeReset = () => {
    setShowReset(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: FONT }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ width: 300, flexShrink: 0, padding: '40px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>
        <LogoMark />
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 3, letterSpacing: '-0.3px' }}>Service Engineer<br/>Planner</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24 }}>Field Operations Platform</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PILLS.map(p => (
            <div key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 5, background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontSize: 10, fontWeight: 600 }}>
              ✓ {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>Sign in to your workspace</div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <div style={LBL}>Email address</div>
              <DarkInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" focused={focused === 'email'} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} autoFocus />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={LBL}>Password</div>
              <DarkInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" focused={focused === 'password'} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button type="button" onClick={() => setShowReset(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
                Forgot password?
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: loading ? 'rgba(71,85,105,0.6)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Signing in...</>
              ) : 'Sign In →'}
            </button>
          </form>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />
          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Create one here</Link>
          </div>
        </div>

        {/* ── INLINE RESET OVERLAY ── */}
        {showReset && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,41,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: '100%', maxWidth: 380 }}>
              {!resetSuccess ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Reset password</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Enter your email and we'll send you a reset link</div>
                  <form onSubmit={handleReset}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={LBL}>Email address</div>
                      <DarkInput type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@company.com" focused={focused === 'resetEmail'} onFocus={() => setFocused('resetEmail')} onBlur={() => setFocused(null)} autoFocus />
                    </div>
                    {resetError && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{resetError}</div>}
                    <button type="submit" disabled={resetLoading} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 11, height: 46, width: '100%', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: resetLoading ? 'not-allowed' : 'pointer', fontFamily: FONT, marginBottom: 12 }}>
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <button type="button" onClick={closeReset} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>← Back to sign in</button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Check your email</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>We sent a reset link to <span style={{ color: '#fff' }}>{resetEmail}</span></div>
                  <button onClick={closeReset} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, height: 40, width: '100%', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>← Back to sign in</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
