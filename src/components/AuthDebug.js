import React from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../config/supabase';

const AuthDebug = () => {
  const { user, profile, isAuthenticated, loading, error } = useAuth();
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Auth Debug Info</h4>
      <p><strong>Supabase Configured:</strong> {supabaseConfigured ? 'Yes' : 'No'}</p>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
      <p><strong>User:</strong> {user ? user.name : 'None'}</p>
      <p><strong>Profile:</strong> {profile ? profile.name : 'None'}</p>
      <p><strong>Error:</strong> {error || 'None'}</p>
      
      <h5>Demo Accounts:</h5>
      <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
        <li>kavin@company.com / kavin123</li>
        <li>arun@company.com / arun123</li>
        <li>gokul@company.com / gokul123</li>
        <li>kathir@company.com / kathir123</li>
        <li>manager@company.com / manager123</li>
      </ul>
    </div>
  );
};

export default AuthDebug;
