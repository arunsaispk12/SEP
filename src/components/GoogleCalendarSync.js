import React, { useState, useEffect, useCallback } from 'react';
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
          const p = await googleCalendarService.getUserProfile();
          setUserProfile(p);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, [setGoogleCalendarConnected]);

  // Perform sync
  const performSync = useCallback(async () => {
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
  }, [isAuthenticated, syncSettings, schedules]);

  // Auto-sync functionality
  useEffect(() => {
    if (syncSettings.autoSync && isAuthenticated) {
      const interval = setInterval(() => {
        performSync();
      }, syncSettings.syncInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [syncSettings.autoSync, syncSettings.syncInterval, isAuthenticated, performSync]);

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
    <div className="gcal-sync-layout" style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: '#f1f5f9' }}>
      {/* Header */}
      <div className="glass-panel gcal-header" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={24} style={{ color: '#a78bfa' }} />
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 24, fontWeight: 700 }}>Google Calendar Integration</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: getStatusColor(syncStatus) }}>
          {getStatusIcon(syncStatus)}
          <span style={{ textTransform: 'capitalize' }}>
            {syncStatus === 'disabled' ? 'Disabled' :
             syncStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {syncStatus === 'disabled' && (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}>
          <AlertCircle size={48} style={{ color: '#f87171', marginBottom: 20 }} />
          <h3 style={{ margin: '0 0 10px 0', fontSize: 20, color: '#f87171' }}>Google Calendar Integration Disabled</h3>
          <p style={{ margin: 0, color: '#94a3b8' }}>Google Calendar API credentials are not configured. Please contact your administrator.</p>
        </div>
      )}

      {syncStatus !== 'disabled' && (
        <>
          {/* Connection Section */}
          <div style={{ marginBottom: 24 }}>
            <div className="section-label" style={{ fontSize: 14, marginBottom: 12 }}>Connection</div>
            <div className="glass-panel" style={{ padding: 30 }}>
              {!isAuthenticated ? (
                <div style={{ textAlign: 'center' }}>
                  <Calendar size={48} style={{ color: '#a78bfa', marginBottom: 20 }} />
                  <h4 style={{ margin: '0 0 10px 0', color: '#f1f5f9', fontSize: 18 }}>Connect to Google Calendar</h4>
                  <p style={{ margin: '0 0 30px 0', color: '#94a3b8' }}>Sync your schedules and cases with Google Calendar for better time management.</p>
                  <button
                    className="glass-btn-primary"
                    onClick={connectToGoogleCalendar}
                    disabled={isLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}
                  >
                    {isLoading ? (
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <LogIn size={20} />
                    )}
                    {isLoading ? 'Connecting...' : 'Connect to Google Calendar'}
                  </button>
                </div>
              ) : (
                <div className="gcal-connected-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#a78bfa', flexShrink: 0 }}>
                      {userProfile?.getImageUrl ? (
                        <img src={userProfile.getImageUrl()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#f1f5f9', fontSize: 16 }}>{userProfile?.getName() || 'Google User'}</h4>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>{userProfile?.getEmail() || 'Connected to Google Calendar'}</p>
                    </div>
                  </div>
                  <button
                    className="glass-btn-danger"
                    onClick={disconnectFromGoogleCalendar}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
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
            <div style={{ marginBottom: 24 }}>
              <div className="section-label" style={{ fontSize: 14, marginBottom: 12 }}>Sync Controls</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <button
                  className="glass-btn-primary"
                  onClick={performSync}
                  disabled={isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {isLoading ? (
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </button>

                {lastSyncTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14 }}>
                    <Clock size={16} />
                    <span>Last sync: {lastSyncTime.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Statistics */}
          {isAuthenticated && (
            <div style={{ marginBottom: 24 }}>
              <div className="section-label" style={{ fontSize: 14, marginBottom: 12 }}>Sync Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                {[
                  { value: syncStats.totalSynced, label: 'Total Synced', color: '#f1f5f9' },
                  { value: syncStats.lastSyncSuccess, label: 'Last Sync Success', color: '#34d399' },
                  { value: syncStats.lastSyncError, label: 'Last Sync Errors', color: '#f87171' },
                ].map((stat, i) => (
                  <div key={i} className="glass-panel-sm" style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, marginBottom: 5 }}>{stat.value}</div>
                    <div style={{ fontSize: 14, color: '#94a3b8' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Settings */}
          {isAuthenticated && (
            <div style={{ marginBottom: 24 }}>
              <div className="section-label" style={{ fontSize: 14, marginBottom: 12 }}>Sync Settings</div>
              <div className="glass-panel" style={{ padding: 20 }}>
                {[
                  { key: 'autoSync', label: 'Enable Auto Sync', desc: `Automatically sync changes every ${syncSettings.syncInterval} minutes` },
                  { key: 'syncSchedules', label: 'Sync Schedules', desc: 'Sync engineer schedules to Google Calendar' },
                  { key: 'syncCases', label: 'Sync Cases', desc: 'Sync case assignments to Google Calendar' },
                  { key: 'syncNotifications', label: 'Sync Notifications', desc: 'Sync important notifications to Google Calendar' },
                ].map((setting, i) => (
                  <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={syncSettings[setting.key]}
                        onChange={(e) => updateSyncSettings({ [setting.key]: e.target.checked })}
                        style={{ width: 18, height: 18, accentColor: '#7b61ff' }}
                      />
                      <span>{setting.label}</span>
                    </label>
                    <p style={{ margin: '6px 0 0 28px', color: '#94a3b8', fontSize: 14 }}>{setting.desc}</p>
                  </div>
                ))}

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: '#e2e8f0' }}>
                    <span>Sync Interval (minutes)</span>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={syncSettings.syncInterval}
                      onChange={(e) => updateSyncSettings({ syncInterval: parseInt(e.target.value) })}
                      className="glass-input"
                      style={{ width: 80, marginLeft: 10 }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Profile Management */}
          <div>
            <div className="section-label" style={{ fontSize: 14, marginBottom: 12 }}>Profile Management</div>
            <div className="glass-panel" style={{ padding: 20 }}>
              <div className="glass-panel-sm" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, color: '#a78bfa' }}>
                  <User size={24} />
                  <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: 16 }}>User Profile</h4>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { icon: <Key size={16} />, text: `Name: ${profile?.name || 'Not available'}` },
                    { icon: <Key size={16} />, text: `Email: ${profile?.email || 'Not available'}` },
                    { icon: <MapPin size={16} />, text: `Location: ${profile?.location?.name || 'Not assigned'}` },
                    { icon: <Bell size={16} />, text: `Role: ${profile?.role || 'Not assigned'}` },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 14 }}>
                      <span style={{ color: '#a78bfa', flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default GoogleCalendarSync;
