import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassSidebar from './components/GlassSidebar';
import GlassTopBar from './components/GlassTopBar';
import UnifiedDashboard from './components/UnifiedDashboard';
import UnifiedCalendar from './components/UnifiedCalendar';
import CaseManager from './components/CaseManager';
import ClientManagement from './components/ClientManagement';
import LocationManagement from './components/LocationManagement';
import GoogleCalendarSync from './components/GoogleCalendarSync';
import UserManagement from './components/UserManagement';
import ProfileManagement from './components/ProfileManagement';
import AdminPanel from './components/AdminPanel';
import EngineerDashboard from './components/EngineerDashboard';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { EngineerProvider } from './context/EngineerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMiddlewareManager } from './middlewares';
import middlewareConfig from './config/middleware';
import './App.css';

function AppContent() {
  const { user, profile, isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when navigating (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login/signup pages if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Different tabs based on user role
  const getTabsForUser = () => {
    if (profile?.role === 'admin') {
      return [
        { id: 'admin', label: 'Admin Panel', icon: '🛡️' },
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'User Management', icon: '👤' },
        { id: 'clients', label: 'Clients', icon: '🏢' },
        { id: 'locations', label: 'Locations', icon: '📍' },
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'cases', label: 'Cases', icon: '📋' },
        { id: 'sync', label: 'Google Calendar', icon: '🔄' }
      ];
    } else if (profile?.role === 'manager') {
      return [
        { id: 'manager', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'User Management', icon: '👤' },
        { id: 'clients', label: 'Clients', icon: '🏢' },
        { id: 'locations', label: 'Locations', icon: '📍' },
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'cases', label: 'Cases', icon: '📋' },
        { id: 'sync', label: 'Google Calendar', icon: '🔄' }
      ];
    } else if (profile?.role === 'executive') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'clients', label: 'My Clients', icon: '🏢' },
        { id: 'cases', label: 'Cases', icon: '📋' },
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'sync', label: 'Google Calendar', icon: '🔄' }
      ];
    } else {
      return [
        { id: 'personal', label: 'Dashboard', icon: '🏠' },
        { id: 'account', label: 'Account', icon: '⚙️' },
        { id: 'calendar', label: 'My Schedule', icon: '📅' },
        { id: 'cases', label: 'My Cases', icon: '📋' },
        { id: 'sync', label: 'Google Calendar', icon: '🔄' }
      ];
    }
  };

  const tabs = getTabsForUser();

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: 'rgba(30,27,75,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', backdropFilter: 'blur(12px)' } }} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 35 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <GlassSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        user={user}
        profile={profile}
        logout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <GlassTopBar
        activeTab={activeTab}
        onMenuClick={() => setSidebarOpen(prev => !prev)}
      />

      {/* Main content area */}
      <div style={{ marginLeft: 280, paddingTop: 48 }} className="content-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '0' }}
          >
            {activeTab === 'admin' && <AdminPanel />}
            {activeTab === 'dashboard' && <UnifiedDashboard />}
            {activeTab === 'personal' && <EngineerDashboard onGoToCases={() => setActiveTab('cases')} />}
            {activeTab === 'account' && <ProfileManagement />}
            {activeTab === 'manager' && <UnifiedDashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'clients' && <ClientManagement />}
            {activeTab === 'locations' && <LocationManagement />}
            {activeTab === 'calendar' && <UnifiedCalendar />}
            {activeTab === 'cases' && <CaseManager />}
            {activeTab === 'sync' && <GoogleCalendarSync />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  // Initialize middleware manager synchronously before rendering
  const middlewareManager = getMiddlewareManager(middlewareConfig);
  middlewareManager.initialize();

  return (
    <Router>
      <AuthProvider>
        <EngineerProvider>
          <AppContent />
        </EngineerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
