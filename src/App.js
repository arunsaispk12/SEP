import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import SidebarTabs from './components/SidebarTabs';
import UnifiedDashboard from './components/UnifiedDashboard';
import ScheduleCalendar from './components/ScheduleCalendar';
import CaseManager from './components/CaseManager';
import GoogleCalendarSync from './components/GoogleCalendarSync';
import UserManagement from './components/UserManagement';
import ProfileManagement from './components/ProfileManagement';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { EngineerProvider } from './context/EngineerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMiddlewareManager } from './middlewares';
import middlewareConfig from './config/middleware';
import './App.css';

function AppContent() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);

  // Theme toggle functionality
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
    if (user.role === 'admin') {
      return [
        { id: 'admin', label: 'Admin Panel', icon: '🛡️' },
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'User Management', icon: '👤' },
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'cases', label: 'Cases', icon: '📋' },
        { id: 'sync', label: 'Google Calendar', icon: '🔄' }
      ];
    } else if (user.role === 'manager') {
      return [
        { id: 'manager', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'User Management', icon: '👤' },
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'cases', label: 'Cases', icon: '📋' },
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
    <div className={`min-h-screen ${isDark ? 'bg-navy-dark' : 'bg-gray-50'} transition-colors duration-300`}>
      <Toaster position="top-right" />

      {/* Navbar */}
      <Navbar
        user={user}
        logout={logout}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Sidebar */}
      <SidebarTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />

      {/* Main Content */}
      <div className="ml-64 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {activeTab === 'admin' && <AdminPanel />}
            {activeTab === 'dashboard' && <UnifiedDashboard />}
            {activeTab === 'personal' && <UnifiedDashboard />}
            {activeTab === 'account' && <ProfileManagement />}
            {activeTab === 'manager' && <UnifiedDashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'calendar' && <ScheduleCalendar />}
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
