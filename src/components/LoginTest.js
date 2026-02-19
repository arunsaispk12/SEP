import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginTest = () => {
  const { login, user, isAuthenticated, loading, error } = useAuth();
  const [testEmail, setTestEmail] = useState('kavin@company.com');
  const [testPassword, setTestPassword] = useState('kavin123');

  const handleTestLogin = async () => {
    console.log('Testing login with:', { testEmail, testPassword });
    const result = await login(testEmail, testPassword);
    console.log('Login result:', result);
  };

  const demoAccounts = [
    { name: 'Kavin', email: 'kavin@company.com', password: 'kavin123' },
    { name: 'Arun', email: 'arun@company.com', password: 'arun123' },
    { name: 'Gokul', email: 'gokul@company.com', password: 'gokul123' },
    { name: 'Kathir', email: 'kathir@company.com', password: 'kathir123' },
    { name: 'Manager', email: 'manager@company.com', password: 'manager123' }
  ];

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '20px', 
      borderRadius: '10px',
      zIndex: 10000,
      minWidth: '400px'
    }}>
      <h2>Login Test</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Email:</label>
        <input 
          type="email" 
          value={testEmail} 
          onChange={(e) => setTestEmail(e.target.value)}
          style={{ width: '100%', padding: '5px', margin: '5px 0' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Password:</label>
        <input 
          type="password" 
          value={testPassword} 
          onChange={(e) => setTestPassword(e.target.value)}
          style={{ width: '100%', padding: '5px', margin: '5px 0' }}
        />
      </div>
      
      <button 
        onClick={handleTestLogin}
        style={{ 
          width: '100%', 
          padding: '10px', 
          background: '#3b82f6', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Test Login'}
      </button>
      
      <div style={{ marginTop: '15px' }}>
        <h4>Current Status:</h4>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {user ? user.name : 'None'}</p>
        <p>Error: {error || 'None'}</p>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <h4>Demo Accounts:</h4>
        {demoAccounts.map((account, index) => (
          <button
            key={index}
            onClick={() => {
              setTestEmail(account.email);
              setTestPassword(account.password);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '5px',
              margin: '2px 0',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            {account.name} ({account.email})
          </button>
        ))}
      </div>
    </div>
  );
};

export default LoginTest;
