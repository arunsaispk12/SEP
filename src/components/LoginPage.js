import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Building2, AlertCircle, Mail, KeyRound } from 'lucide-react';

const LoginPage = () => {
  const { login, resetPassword, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    await login(formData.email, formData.password);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const success = await resetPassword(resetEmail);
      if (success) {
        setResetSuccess(true);
        setTimeout(() => {
          setShowResetPassword(false);
          setResetSuccess(false);
          setResetEmail('');
        }, 3000);
      } else {
        setResetError('Failed to send password reset email. Please try again.');
      }
    } catch (error) {
      setResetError('An error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error message when user starts typing
    if (error) {
      // dispatch({ type: 'CLEAR_ERROR' }); // Uncomment if you want to clear error on typing
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        backdropFilter: 'blur(25px)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Building2 size={32} />
            </div>
            <div>
              <h1 style={{
                margin: '0',
                color: '#e2e8f0',
                fontSize: '28px',
                fontWeight: '700',
                letterSpacing: '-0.025em',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Service Engineer Planner
              </h1>
              <p style={{
                margin: '4px 0 0 0',
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '400'
              }}>
                Welcome back
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Mail size={16} />
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#f9fafb',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#f9fafb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <User size={20} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <KeyRound size={16} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  border: '2px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  color: '#e2e8f0',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = 'rgba(30, 41, 59, 0.8)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  e.target.style.background = 'rgba(30, 41, 59, 0.6)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <Lock size={20} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginTop: '20px',
              fontSize: '15px',
              textAlign: 'center',
              fontWeight: '600',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: loading ? 'rgba(71, 85, 105, 0.8)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              marginTop: '24px',
              marginBottom: '24px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* Forgot Password */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '8px 16px'
              }}
              onMouseEnter={(e) => e.target.style.color = '#60a5fa'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              Forgot your password?
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            margin: '0',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => e.target.style.color = '#60a5fa'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Password Reset Modal */}
        {showResetPassword && (
          <div className="modal-overlay">
            <div className="modal-content reset-modal">
              <div className="modal-header">
                <h3>Reset Password</h3>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail('');
                    setResetError('');
                    setResetSuccess(false);
                  }}
                >
                  ×
                </button>
              </div>

              {!resetSuccess ? (
                <form onSubmit={handleResetPassword} className="modal-body">
                  <p className="reset-description">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <div className="form-group">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  {resetError && (
                    <div className="error-message" style={{ marginTop: '12px', color: '#f87171', fontSize: '14px', textAlign: 'center' }}>
                      {resetError}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetEmail('');
                        setResetError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="modal-body success-message">
                  <div className="success-icon">✅</div>
                  <h4>Password Reset Email Sent</h4>
                  <p>
                    We've sent a password reset link to <strong>{resetEmail}</strong>.
                    Please check your email and follow the instructions to reset your password.
                  </p>
                  <button
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetEmail('');
                      setResetSuccess(false);
                    }}
                    className="primary-btn"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            margin: '0',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Service Engineer Planner v1.0
          </p>
          <p style={{
            margin: '4px 0 0 0',
            color: '#64748b',
            fontSize: '12px'
          }}>
            © 2024 All rights reserved
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          background: rgba(30, 41, 59, 0.95);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 500px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          backdrop-filter: blur(25px);
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .logo h1 {
          margin: 0;
          color: #333;
          font-size: 1.8rem;
        }

        .login-header p {
          color: #666;
          margin: 0;
          font-size: 1.1rem;
        }

        .login-form {
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-group svg {
          position: absolute;
          left: 15px;
          color: #666;
          z-index: 1;
        }

        .input-group input {
          width: 100%;
          padding: 15px 15px 15px 50px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }

        .input-group input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .login-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .signup-link {
          margin-top: 20px;
          text-align: center;
        }

        .signup-link p {
          color: #6b7280;
          margin: 0;
        }

        .signup-link a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }

        .signup-link a:hover {
          text-decoration: underline;
        }

        .demo-section {
          margin-bottom: 30px;
        }

        .demo-toggle {
          width: 100%;
          padding: 10px;
          background: #f8f9fa;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .demo-toggle:hover {
          background: #e9ecef;
          border-color: #667eea;
        }

        .demo-accounts {
          margin-top: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 2px solid #e1e5e9;
        }

        .demo-accounts h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .demo-accounts p {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .demo-grid {
          display: grid;
          gap: 10px;
        }

        .demo-account {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .demo-account:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        .account-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .account-info p {
          margin: 0 0 3px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .account-email {
          color: #667eea;
          font-size: 0.8rem;
        }

        .account-role {
          color: #666;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .login-footer {
          text-align: center;
          color: #666;
          font-size: 0.9rem;
        }

        .login-footer p {
          margin: 5px 0;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #fecaca;
          margin-top: 16px;
          font-size: 14px;
          text-align: center;
        }

        .forgot-password {
          text-align: center;
          margin-top: 20px;
        }

        .forgot-password-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .forgot-password-btn:hover {
          color: #2563eb;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .reset-modal .modal-content {
          max-width: 450px;
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
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
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

        .reset-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .modal-actions button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .modal-actions button:hover {
          background: #f9fafb;
        }

        .primary-btn {
          background: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
        }

        .primary-btn:hover {
          background: #2563eb !important;
        }

        .success-message {
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .success-message h4 {
          color: #1f2937;
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .success-message p {
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .login-container {
            padding: 30px 20px;
          }

          .logo {
            flex-direction: column;
            gap: 10px;
          }

          .logo h1 {
            font-size: 1.5rem;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            margin: 20px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
