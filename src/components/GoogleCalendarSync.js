import React, { useState, useEffect } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import googleCalendarService from '../services/googleCalendarService';
import { Calendar, RefreshCw, CheckCircle, AlertCircle, User, Key, Clock, MapPin, Bell, LogIn, LogOut, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleCalendarSync = () => {
  const { 
    schedules, 
    setGoogleCalendarConnected 
  } = useEngineerContext();
  
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncInterval: 30, // minutes
    syncPastDays: 7,
    syncFutureDays: 30,
    syncSchedules: true,
    syncCases: true,
    syncNotifications: true
  });
  const [syncStats, setSyncStats] = useState({
    totalSynced: 0,
    lastSyncSuccess: 0,
    lastSyncError: 0
  });

  // Check if Google Calendar is enabled
  useEffect(() => {
    const isEnabled = googleCalendarService.isEnabled();
    if (!isEnabled) {
      setSyncStatus('disabled');
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuth = googleCalendarService.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
          setSyncStatus('connected');
          setGoogleCalendarConnected(true);
          
          // Get user profile
          const profile = await googleCalendarService.getUserProfile();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, [setGoogleCalendarConnected]);

  // Auto-sync functionality
  useEffect(() => {
    if (syncSettings.autoSync && isAuthenticated) {
      const interval = setInterval(() => {
        performSync();
      }, syncSettings.syncInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [syncSettings.autoSync, syncSettings.syncInterval, isAuthenticated]);

  // Connect to Google Calendar
  const connectToGoogleCalendar = async () => {
    setIsLoading(true);
    
    try {
      // Initialize Google Calendar service
      const initialized = await googleCalendarService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Google Calendar API');
      }

      // Sign in to Google
      const result = await googleCalendarService.signIn();
      
      if (result.success) {
        setIsAuthenticated(true);
        setSyncStatus('connected');
        setGoogleCalendarConnected(true);
        setUserProfile(result.user);
        setLastSyncTime(new Date());
        toast.success('Successfully connected to Google Calendar!');
      } else {
        throw new Error(result.error || 'Failed to connect to Google Calendar');
      }
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      toast.error(`Failed to connect to Google Calendar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Google Calendar
  const disconnectFromGoogleCalendar = async () => {
    try {
      const result = await googleCalendarService.signOut();
      
      if (result.success) {
        setIsAuthenticated(false);
        setSyncStatus('disconnected');
        setGoogleCalendarConnected(false);
        setUserProfile(null);
        setLastSyncTime(null);
        toast.success('Disconnected from Google Calendar');
      }
    } catch (error) {
      console.error('Google Calendar disconnection error:', error);
      toast.error('Failed to disconnect from Google Calendar');
    }
  };

  // Perform sync
  const performSync = async () => {
    if (!isAuthenticated) {
      toast.error('Please connect to Google Calendar first');
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Sync schedules
      if (syncSettings.syncSchedules) {
        for (const schedule of schedules) {
          if (!schedule.synced_to_calendar) {
            const result = await googleCalendarService.syncScheduleToCalendar(schedule);
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }
        }
      }

      // Update sync stats
      setSyncStats(prev => ({
        ...prev,
        totalSynced: prev.totalSynced + successCount,
        lastSyncSuccess: successCount,
        lastSyncError: errorCount
      }));

      setLastSyncTime(new Date());
      
      if (successCount > 0) {
        toast.success(`Synced ${successCount} items to Google Calendar`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} items`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update sync settings
  const updateSyncSettings = (newSettings) => {
    setSyncSettings(prev => ({ ...prev, ...newSettings }));
    toast.success('Sync settings updated');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#6b7280';
      case 'disabled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle size={20} />;
      case 'disconnected': return <AlertCircle size={20} />;
      case 'disabled': return <AlertCircle size={20} />;
      default: return <AlertCircle size={20} />;
    }
  };

  return (
    <div className="google-calendar-sync">
      <div className="sync-header">
        <div className="sync-title">
          <Calendar size={24} />
          <h2>Google Calendar Integration</h2>
        </div>
        <div className="sync-status">
          <div 
            className="status-indicator"
            style={{ color: getStatusColor(syncStatus) }}
          >
            {getStatusIcon(syncStatus)}
            <span className="status-text">
              {syncStatus === 'disabled' ? 'Disabled' : 
               syncStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {syncStatus === 'disabled' && (
        <div className="sync-disabled">
          <AlertCircle size={48} />
          <h3>Google Calendar Integration Disabled</h3>
          <p>Google Calendar API credentials are not configured. Please contact your administrator.</p>
        </div>
      )}

      {syncStatus !== 'disabled' && (
        <>
          {/* Connection Section */}
          <div className="sync-section">
            <h3>Connection</h3>
            <div className="connection-card">
              {!isAuthenticated ? (
                <div className="connection-disconnected">
                  <Calendar size={48} />
                  <h4>Connect to Google Calendar</h4>
                  <p>Sync your schedules and cases with Google Calendar for better time management.</p>
                  <button 
                    className="connect-btn"
                    onClick={connectToGoogleCalendar}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw size={20} className="spinning" />
                    ) : (
                      <LogIn size={20} />
                    )}
                    {isLoading ? 'Connecting...' : 'Connect to Google Calendar'}
                  </button>
                </div>
              ) : (
                <div className="connection-connected">
                  <div className="user-info">
                    <div className="user-avatar">
                      {userProfile?.getImageUrl ? (
                        <img src={userProfile.getImageUrl()} alt="Profile" />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="user-details">
                      <h4>{userProfile?.getName() || 'Google User'}</h4>
                      <p>{userProfile?.getEmail() || 'Connected to Google Calendar'}</p>
                    </div>
                  </div>
                  <button 
                    className="disconnect-btn"
                    onClick={disconnectFromGoogleCalendar}
                  >
                    <LogOut size={20} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sync Controls */}
          {isAuthenticated && (
            <div className="sync-section">
              <h3>Sync Controls</h3>
              <div className="sync-controls">
                <button 
                  className="sync-btn"
                  onClick={performSync}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw size={20} className="spinning" />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </button>
                
                {lastSyncTime && (
                  <div className="last-sync">
                    <Clock size={16} />
                    <span>Last sync: {lastSyncTime.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Statistics */}
          {isAuthenticated && (
            <div className="sync-section">
              <h3>Sync Statistics</h3>
              <div className="sync-stats">
                <div className="stat-item">
                  <div className="stat-value">{syncStats.totalSynced}</div>
                  <div className="stat-label">Total Synced</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value success">{syncStats.lastSyncSuccess}</div>
                  <div className="stat-label">Last Sync Success</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value error">{syncStats.lastSyncError}</div>
                  <div className="stat-label">Last Sync Errors</div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Settings */}
          {isAuthenticated && (
            <div className="sync-section">
              <h3>Sync Settings</h3>
              <div className="sync-settings">
                <div className="setting-group">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={syncSettings.autoSync}
                      onChange={(e) => updateSyncSettings({ autoSync: e.target.checked })}
                    />
                    <span>Enable Auto Sync</span>
                  </label>
                  <p className="setting-description">
                    Automatically sync changes every {syncSettings.syncInterval} minutes
                  </p>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncSchedules}
                      onChange={(e) => updateSyncSettings({ syncSchedules: e.target.checked })}
                    />
                    <span>Sync Schedules</span>
                  </label>
                  <p className="setting-description">
                    Sync engineer schedules to Google Calendar
                  </p>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncCases}
                      onChange={(e) => updateSyncSettings({ syncCases: e.target.checked })}
                    />
                    <span>Sync Cases</span>
                  </label>
                  <p className="setting-description">
                    Sync case assignments to Google Calendar
                  </p>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncNotifications}
                      onChange={(e) => updateSyncSettings({ syncNotifications: e.target.checked })}
                    />
                    <span>Sync Notifications</span>
                  </label>
                  <p className="setting-description">
                    Sync important notifications to Google Calendar
                  </p>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    <span>Sync Interval (minutes)</span>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={syncSettings.syncInterval}
                      onChange={(e) => updateSyncSettings({ syncInterval: parseInt(e.target.value) })}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Profile Management */}
          <div className="sync-section">
            <h3>Profile Management</h3>
            <div className="profile-management">
              <div className="profile-card">
                <div className="profile-header">
                  <User size={24} />
                  <h4>User Profile</h4>
                </div>
                <div className="profile-info">
                  <div className="info-item">
                    <Key size={16} />
                    <span>Name: {profile?.name || 'Not available'}</span>
                  </div>
                  <div className="info-item">
                    <Key size={16} />
                    <span>Email: {profile?.email || 'Not available'}</span>
                  </div>
                  <div className="info-item">
                    <MapPin size={16} />
                    <span>Location: {profile?.location?.name || 'Not assigned'}</span>
                  </div>
                  <div className="info-item">
                    <Bell size={16} />
                    <span>Role: {profile?.role || 'Not assigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .google-calendar-sync {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .sync-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .sync-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sync-title h2 {
          margin: 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 700;
        }

        .sync-status {
          display: flex;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .status-text {
          text-transform: capitalize;
        }

        .sync-disabled {
          text-align: center;
          padding: 60px 20px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
        }

        .sync-disabled h3 {
          margin: 20px 0 10px 0;
          font-size: 20px;
        }

        .sync-disabled p {
          margin: 0;
          color: #6b7280;
        }

        .sync-section {
          margin-bottom: 30px;
        }

        .sync-section h3 {
          margin: 0 0 15px 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }

        .connection-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .connection-disconnected {
          text-align: center;
        }

        .connection-disconnected h4 {
          margin: 20px 0 10px 0;
          color: #1f2937;
          font-size: 18px;
        }

        .connection-disconnected p {
          margin: 0 0 30px 0;
          color: #6b7280;
        }

        .connect-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .connect-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .connect-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .connection-connected {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-details h4 {
          margin: 0 0 5px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .user-details p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .disconnect-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .disconnect-btn:hover {
          background: #dc2626;
        }

        .sync-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .sync-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sync-btn:hover:not(:disabled) {
          background: #059669;
        }

        .sync-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .last-sync {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
        }

        .sync-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
        }

        .stat-item {
          text-align: center;
          padding: 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .stat-value.success {
          color: #10b981;
        }

        .stat-value.error {
          color: #ef4444;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        .sync-settings {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .setting-group {
          margin-bottom: 20px;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #1f2937;
          cursor: pointer;
        }

        .setting-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
        }

        .setting-label input[type="number"] {
          width: 80px;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          margin-left: 10px;
        }

        .setting-description {
          margin: 5px 0 0 28px;
          color: #6b7280;
          font-size: 14px;
        }

        .profile-management {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .profile-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .profile-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 16px;
        }

        .profile-info {
          display: grid;
          gap: 10px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6b7280;
          font-size: 14px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .google-calendar-sync {
            padding: 15px;
          }

          .sync-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .connection-connected {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .sync-controls {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .sync-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleCalendarSync;