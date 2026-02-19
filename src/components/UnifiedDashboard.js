
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import DashboardCard from './DashboardCard';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  Grid,
  User,
  Edit,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Briefcase,
  Target,
  PieChart
} from 'lucide-react';

const UnifiedDashboard = () => {
  const { user, logout } = useAuth();
  const { engineers, schedules, cases, locations, leaves, addLeave, updateLeave, deleteLeave } = useEngineerContext();

  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [displayMode, setDisplayMode] = useState('overview'); // overview, cases, schedules, calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedEngineer, setSelectedEngineer] = useState('all');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Get current user's data
  const userCases = cases.filter(case_ => case_.assigned_engineer_id === user.id);
  const userSchedules = schedules.filter(schedule => schedule.engineer_id === user.id);
  const userLeaves = leaves.filter(l => l.engineer_id === user.id);

  // Get date range based on view mode
  const getDateRange = () => {
    const date = new Date(selectedDate);

    switch (viewMode) {
      case 'weekly':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { start: startOfWeek, end: endOfWeek };

      case 'monthly':
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return { start: startOfMonth, end: endOfMonth };

      default:
        return { start: date, end: date };
    }
  };

  // Filter data based on selected criteria and user role
  const filteredData = useMemo(() => {
    const { start, end } = getDateRange();

    let filteredSchedules = schedules;
    let filteredCases = cases;

    // Apply date range filter
    filteredSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start || schedule.start_time);
      return scheduleDate >= start && scheduleDate <= end;
    });

    filteredCases = cases.filter(case_ => {
      const caseDate = new Date(case_.created_at);
      return caseDate >= start && caseDate <= end;
    });

    // For engineers, only show their own data
    if (user.role === 'engineer') {
      filteredSchedules = filteredSchedules.filter(s => s.engineer_id === user.id);
      filteredCases = filteredCases.filter(c => c.assigned_engineer_id === user.id);
    } else {
      // For managers/admins, apply location and engineer filters
      if (selectedLocation !== 'all') {
        filteredSchedules = filteredSchedules.filter(s => s.location === selectedLocation);
        filteredCases = filteredCases.filter(c => c.location === selectedLocation);
      }

      if (selectedEngineer !== 'all') {
        const engineerId = parseInt(selectedEngineer);
        filteredSchedules = filteredSchedules.filter(s => s.engineer_id === engineerId);
        filteredCases = filteredCases.filter(c => c.assigned_engineer_id === engineerId);
      }
    }

    return { schedules: filteredSchedules, cases: filteredCases };
  }, [schedules, cases, selectedDate, viewMode, selectedLocation, selectedEngineer, user]);

  // Calculate statistics based on user role
  const statistics = useMemo(() => {
    const { schedules, cases } = filteredData;

    const totalCases = cases.length;
    const completedCases = cases.filter(c => c.status === 'completed').length;
    const inProgressCases = cases.filter(c => c.status === 'in-progress').length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;

    const totalSchedules = schedules.length;
    const highPriorityCases = cases.filter(c => c.priority === 'high').length;

    if (user.role === 'engineer') {
      return {
        totalCases,
        completedCases,
        inProgressCases,
        pendingCases,
        totalSchedules,
        completionRate: totalCases > 0 ? (completedCases / totalCases * 100).toFixed(1) : 0
      };
    } else {
      // Manager/Admin statistics
      const engineerUtilization = engineers.map(engineer => {
        const engineerCases = cases.filter(c => c.assigned_engineer_id === engineer.id);
        const engineerSchedules = schedules.filter(s => s.engineer_id === engineer.id);
        return {
          ...engineer,
          caseCount: engineerCases.length,
          scheduleCount: engineerSchedules.length,
          utilization: engineerCases.length + engineerSchedules.length
        };
      });

      return {
        totalCases,
        completedCases,
        inProgressCases,
        pendingCases,
        totalSchedules,
        highPriorityCases,
        engineerUtilization,
        completionRate: totalCases > 0 ? (completedCases / totalCases * 100).toFixed(1) : 0
      };
    }
  }, [filteredData, engineers, user.role]);

  const resetLeaveForm = () => {
    setLeaveForm({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setEditingLeave(null);
    setShowLeaveModal(false);
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    const payload = {
      engineer_id: user.id,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason,
      status: 'approved'
    };
    if (editingLeave) {
      await updateLeave(editingLeave.id, payload);
    } else {
      await addLeave(payload);
    }
    resetLeaveForm();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon completed" />;
      case 'in-progress':
        return <Clock className="status-icon in-progress" />;
      case 'pending':
        return <AlertCircle className="status-icon pending" />;
      default:
        return <XCircle className="status-icon" />;
    }
  };

  const formatDateRange = () => {
    const { start, end } = getDateRange();

    switch (viewMode) {
      case 'weekly':
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      case 'monthly':
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return start.toLocaleDateString();
    }
  };

  // Render dashboard header based on user role
  const renderDashboardHeader = () => {
    if (user.role === 'engineer') {
      return (
        <div className="dashboard-header">
          <div className="header-left">
            <div className="user-info">
              <div className="user-avatar">
                <span className="avatar-text">{user.avatar || '👨‍🔧'}</span>
              </div>
              <div className="user-details">
                <h1>Welcome back, {user.name}!</h1>
                <p>{user.location} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="view-controls">
              <div className="view-mode-selector">
                <button
                  className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
                  onClick={() => setViewMode('daily')}
                >
                  <Calendar size={16} />
                  Daily
                </button>
                <button
                  className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                  onClick={() => setViewMode('weekly')}
                >
                  <Calendar size={16} />
                  Weekly
                </button>
                <button
                  className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                  onClick={() => setViewMode('monthly')}
                >
                  <Calendar size={16} />
                  Monthly
                </button>
              </div>

              <div className="display-mode-selector">
                <button
                  className={`display-btn ${displayMode === 'overview' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('overview')}
                >
                  <Activity size={16} />
                  Overview
                </button>
                <button
                  className={`display-btn ${displayMode === 'cases' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('cases')}
                >
                  <AlertCircle size={16} />
                  Cases
                </button>
                <button
                  className={`display-btn ${displayMode === 'schedules' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('schedules')}
                >
                  <Calendar size={16} />
                  Schedules
                </button>
              </div>

              <div className="date-picker">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
            </div>

            <div className="user-actions">
              <button className="action-btn" onClick={() => setShowLeaveModal(true)}>
                <Plus size={20} />
              </button>
              <button className="action-btn logout-btn" onClick={logout}>
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // Manager/Admin header
      return (
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Dashboard - {user.role.charAt(0).toUpperCase() + user.role.slice(1)} View</h1>
            <p className="date-range">{formatDateRange()}</p>
          </div>

          <div className="header-controls">
            <div className="view-mode-selector">
              <button
                className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
                onClick={() => setViewMode('daily')}
              >
                <Calendar size={16} />
                Daily
              </button>
              <button
                className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                onClick={() => setViewMode('weekly')}
              >
                <Calendar size={16} />
                Weekly
              </button>
              <button
                className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                onClick={() => setViewMode('monthly')}
              >
                <Calendar size={16} />
                Monthly
              </button>
            </div>

            <div className="display-mode-selector">
              <button
                className={`display-btn ${displayMode === 'overview' ? 'active' : ''}`}
                onClick={() => setDisplayMode('overview')}
              >
                <Grid size={16} />
                Overview
              </button>
              <button
                className={`display-btn ${displayMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setDisplayMode('calendar')}
              >
                <Calendar size={16} />
                Calendar
              </button>
              <button
                className={`display-btn ${displayMode === 'cases' ? 'active' : ''}`}
                onClick={() => setDisplayMode('cases')}
              >
                <AlertCircle size={16} />
                Cases
              </button>
            </div>

            <div className="date-picker">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>
          </div>
        </div>
      );
    }
  };

  // Render filters for managers/admins
  const renderFilters = () => {
    if (user.role === 'engineer') return null;

    return (
      <div className="dashboard-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Users size={16} />
          <select
            value={selectedEngineer}
            onChange={(e) => setSelectedEngineer(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Engineers</option>
            {engineers.map(engineer => (
              <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // Render statistics cards
  const renderStatistics = () => {
    const stats = statistics;

    return (
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalCases}</div>
            <div className="stat-label">{user.role === 'engineer' ? 'My Cases' : 'Total Cases'}</div>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.completedCases}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card in-progress">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.inProgressCases}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingCases}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalSchedules}</div>
            <div className="stat-label">{user.role === 'engineer' ? 'My Schedules' : 'Total Schedules'}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render main content based on display mode and user role
  const renderMainContent = () => {
    if (displayMode === 'overview') {
      if (user.role === 'engineer') {
        // Engineer overview - personal dashboard cards
        const chartData = [
          { name: 'Mon', value: 4 },
          { name: 'Tue', value: 6 },
          { name: 'Wed', value: 8 },
          { name: 'Thu', value: 5 },
          { name: 'Fri', value: 7 }
        ];

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Dashboard Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-accent to-cyan-accent bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-400 mt-2">
                  {formatDateRange()}
                </p>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="My Cases"
                value={statistics.totalCases}
                subtitle="Total assigned cases"
                icon={Briefcase}
                color="purple"
                chartData={chartData}
                chartType="area"
                delay={0.1}
              />

              <DashboardCard
                title="Completed"
                value={statistics.completedCases}
                subtitle={`${statistics.completionRate}% completion rate`}
                icon={CheckCircle}
                color="green"
                chartData={[
                  { name: 'Jan', value: 12 },
                  { name: 'Feb', value: 15 },
                  { name: 'Mar', value: 18 }
                ]}
                chartType="bar"
                delay={0.2}
              />

              <DashboardCard
                title="In Progress"
                value={statistics.inProgressCases}
                subtitle="Currently working on"
                icon={Clock}
                color="cyan"
                chartData={[
                  { name: 'Week 1', value: 8 },
                  { name: 'Week 2', value: 12 },
                  { name: 'Week 3', value: 6 }
                ]}
                chartType="line"
                delay={0.3}
              />

              <DashboardCard
                title="Schedules"
                value={statistics.totalSchedules}
                subtitle="Upcoming appointments"
                icon={Calendar}
                color="orange"
                chartData={[
                  { name: 'Mon', value: 3 },
                  { name: 'Tue', value: 5 },
                  { name: 'Wed', value: 2 },
                  { name: 'Thu', value: 4 },
                  { name: 'Fri', value: 6 }
                ]}
                chartType="bar"
                delay={0.4}
              />
            </div>

            {/* View Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-navy-light/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-accent/20">
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((mode) => (
                  <motion.button
                    key={mode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      viewMode === mode
                        ? 'bg-gradient-to-r from-purple-accent to-cyan-accent text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-glass-light/50'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-2">
                {['overview', 'cases', 'schedules'].map((mode) => (
                  <motion.button
                    key={mode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDisplayMode(mode)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      displayMode === mode
                        ? 'bg-gradient-to-r from-purple-accent to-cyan-accent text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-glass-light/50'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </motion.button>
                ))}
              </div>

              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-4 py-2 rounded-xl bg-glass-light/50 border border-purple-accent/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-accent/50 backdrop-blur-sm"
              />
            </div>
          </motion.div>
        );
      } else {
        // Manager/Admin overview - comprehensive dashboard
        const locationData = Object.entries(
          locations.reduce((acc, location) => {
            acc[location] = {
              engineers: engineers.filter(e => e.currentLocation === location).length,
              cases: filteredData.cases.filter(c => c.location === location).length,
              schedules: filteredData.schedules.filter(s => s.location === location).length
            };
            return acc;
          }, {})
        );

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Dashboard Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-accent to-cyan-accent bg-clip-text text-transparent">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </h1>
                <p className="text-gray-400 mt-2">
                  {formatDateRange()}
                </p>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Total Cases"
                value={statistics.totalCases}
                subtitle="Across all locations"
                icon={Briefcase}
                color="purple"
                chartData={[
                  { name: 'Mon', value: 12 },
                  { name: 'Tue', value: 15 },
                  { name: 'Wed', value: 18 },
                  { name: 'Thu', value: 14 },
                  { name: 'Fri', value: 20 }
                ]}
                chartType="area"
                delay={0.1}
              />

              <DashboardCard
                title="Active Engineers"
                value={engineers.filter(e => e.is_available).length}
                subtitle={`${engineers.length} total engineers`}
                icon={Users}
                color="cyan"
                chartData={[
                  { name: 'Available', value: engineers.filter(e => e.is_available).length, color: '#10b981' },
                  { name: 'Busy', value: engineers.filter(e => !e.is_available).length, color: '#ef4444' }
                ]}
                chartType="pie"
                delay={0.2}
              />

              <DashboardCard
                title="Completion Rate"
                value={`${statistics.completionRate}%`}
                subtitle="Case completion rate"
                icon={Target}
                color="green"
                chartData={[
                  { name: 'Jan', value: 65 },
                  { name: 'Feb', value: 75 },
                  { name: 'Mar', value: 85 }
                ]}
                chartType="line"
                delay={0.3}
              />

              <DashboardCard
                title="Pending Cases"
                value={statistics.pendingCases}
                subtitle="Require attention"
                icon={AlertCircle}
                color="orange"
                chartData={locationData.map(([location, data]) => ({
                  name: location.substring(0, 3),
                  value: data.cases
                }))}
                chartType="bar"
                delay={0.4}
              />
            </div>

            {/* Filters and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-navy-light/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-accent/20">
                <h3 className="text-lg font-semibold text-white mb-4">View Mode</h3>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'monthly'].map((mode) => (
                    <motion.button
                      key={mode}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode(mode)}
                      className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-purple-accent to-cyan-accent text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-glass-light/50'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="bg-navy-light/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-accent/20">
                <h3 className="text-lg font-semibold text-white mb-4">Display Mode</h3>
                <div className="flex gap-2">
                  {['overview', 'calendar', 'cases'].map((mode) => (
                    <motion.button
                      key={mode}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDisplayMode(mode)}
                      className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        displayMode === mode
                          ? 'bg-gradient-to-r from-purple-accent to-cyan-accent text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-glass-light/50'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="bg-navy-light/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-accent/20">
                <h3 className="text-lg font-semibold text-white mb-4">Date Selection</h3>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-glass-light/50 border border-purple-accent/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-accent/50 backdrop-blur-sm"
                />

                {/* Location Filter */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Filter className="w-4 h-4 inline mr-2" />
                    Location Filter
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-glass-light/50 border border-purple-accent/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-accent/50 backdrop-blur-sm"
                  >
                    <option value="all">All Locations</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
    }

    // For other display modes, show appropriate content based on role
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-navy-light/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-accent/20 text-center"
      >
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-white mb-4">{displayMode.charAt(0).toUpperCase() + displayMode.slice(1)} View</h2>
        <p className="text-gray-400">This view is coming soon. Please use the Overview for now.</p>
      </motion.div>
    );
  };

  // Missing function getStatusColor
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in-progress':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="unified-dashboard">
      {renderDashboardHeader()}
      {renderFilters()}
      {renderStatistics()}
      {renderMainContent()}

      {/* Leave Modal for Engineers */}
      {user.role === 'engineer' && showLeaveModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingLeave ? 'Edit Leave' : 'Apply Leave'}</h2>
              <button className="close-btn" onClick={resetLeaveForm}>×</button>
            </div>
            <form onSubmit={submitLeave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetLeaveForm}>Cancel</button>
                <button type="submit" className="btn">{editingLeave ? 'Update' : 'Apply'} Leave</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .unified-dashboard {
          padding: 20px;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          min-height: 100vh;
          color: #e2e8f0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(30, 41, 59, 0.9);
          color: #e2e8f0;
          padding: 28px 32px;
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          margin-bottom: 32px;
        }

        .header-left h1 {
          margin: 0 0 8px 0;
          color: #e2e8f0;
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .date-range {
          color: #94a3b8;
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
        }

        .header-controls {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .view-mode-selector {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #94a3b8;
        }

        .view-btn.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .view-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
        }

        .display-mode-selector {
          display: flex;
          gap: 2px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .display-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          color: #94a3b8;
        }

        .display-btn.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .display-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
        }

        .date-picker input {
          padding: 12px 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          font-size: 14px;
          background: rgba(30, 41, 59, 0.6);
          color: #e2e8f0;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .date-picker input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .dashboard-filters {
          display: flex;
          gap: 20px;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(15px);
          padding: 20px 25px;
          border-radius: 14px;
          margin-bottom: 25px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-select {
          padding: 10px 14px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          font-size: 14px;
          background: rgba(30, 41, 59, 0.6);
          color: #e2e8f0;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 35px;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .stat-card.completed {
          border-left: 4px solid #10b981;
        }

        .stat-card.in-progress {
          border-left: 4px solid #3b82f6;
        }

        .stat-card.pending {
          border-left: 4px solid #f59e0b;
        }

        .stat-icon {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          padding: 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card.completed .stat-icon {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .stat-card.in-progress .stat-icon {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .stat-card.pending .stat-icon {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2.2rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 6px;
          letter-spacing: -0.025em;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.95rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .dashboard-content {
          display: grid;
          gap: 30px;
        }

        .coming-soon {
          text-align: center;
          padding: 60px 20px;
          background: rgba(30, 41, 59, 0.6);
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .coming-soon h2 {
          color: #e2e8f0;
          margin-bottom: 16px;
        }

        .coming-soon p {
          color: #94a3b8;
        }

        /* Engineer-specific styles */
        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .avatar-text {
          color: white;
        }

        .user-details h1 {
          margin: 0 0 5px 0;
          color: #e2e8f0;
          font-size: 1.5rem;
        }

        .user-details p {
          margin: 0;
          color: #94a3b8;
        }

        .view-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(30, 41, 59, 0.6);
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          color: #e2e8f0;
        }

        .action-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .my-cases h2,
        .my-schedules h2,
        .my-leaves h2,
        .location-overview h2,
        .engineer-utilization h2,
        .recent-cases h2 {
          margin: 0 0 20px 0;
          color: #e2e8f0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .cases-list,
        .schedules-list,
        .leaves-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .case-item,
        .schedule-item {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.3s ease;
        }

        .case-item:hover,
        .schedule-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .case-header,
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .case-header h4,
        .schedule-header h4 {
          margin: 0;
          color: #e2e8f0;
          font-size: 1.1rem;
          flex: 1;
          margin-right: 12px;
        }

        .case-meta {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .priority-badge,
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .priority-badge.high {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .priority-badge.medium {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .priority-badge.low {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-badge.completed {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-badge.in-progress {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-badge.pending {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .case-details,
        .schedule-details {
          margin-top: 10px;
        }

        .case-details p,
        .schedule-details p {
          color: #94a3b8;
          margin: 10px 0;
          line-height: 1.5;
        }

        .case-info,
        .schedule-info {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .leave-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(15px);
          padding: 16px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .leave-actions {
          display: flex;
          gap: 8px;
        }

        .location-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .location-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.3s ease;
        }

        .location-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .location-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .location-header h3 {
          margin: 0;
          color: #e2e8f0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .location-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .engineers-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .engineer-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: rgba(51, 65, 85, 0.6);
          border-radius: 15px;
          font-size: 0.8rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.available {
          background: #10b981;
        }

        .status-dot.busy {
          background: #ef4444;
        }

        .utilization-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .utilization-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.3s ease;
        }

        .utilization-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .engineer-info h4 {
          margin: 0 0 5px 0;
          color: #e2e8f0;
          font-size: 1.1rem;
        }

        .engineer-info p {
          margin: 0;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .utilization-stats {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
        }

        .util-stat {
          text-align: center;
        }

        .util-stat .label {
          display: block;
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .util-stat .value {
          display: block;
          font-size: 1.2rem;
          font-weight: bold;
          color: #e2e8f0;
        }

        .utilization-bar {
          height: 8px;
          background: rgba(71, 85, 105, 0.5);
          border-radius: 4px;
          overflow: hidden;
        }

        .utilization-fill {
          height: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          transition: width 0.3s ease;
        }

        .utilization-bar.high .utilization-fill {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .utilization-bar.medium .utilization-fill {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .utilization-bar.low .utilization-fill {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
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
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background: rgba(30, 41, 59, 0.95);
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(148, 163, 184, 0.2);
          backdrop-filter: blur(25px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .modal-header h3 {
          margin: 0;
          color: #e2e8f0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(71, 85, 105, 0.5);
          color: #e2e8f0;
        }

        .modal-body {
          padding: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #e2e8f0;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          font-size: 14px;
          background: rgba(30, 41, 59, 0.6);
          color: #e2e8f0;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background: rgba(71, 85, 105, 0.8);
          color: #cbd5e1;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(71, 85, 105, 0.9);
          border-color: rgba(148, 163, 184, 0.4);
          transform: translateY(-2px);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .unified-dashboard {
            padding: 15px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            border-radius: 16px;
          }

          .header-left h1 {
            font-size: 2rem;
          }

          .header-controls {
            flex-direction: column;
            width: 100%;
            gap: 15px;
          }

          .view-mode-selector,
          .display-mode-selector {
            width: 100%;
            justify-content: center;
          }

          .dashboard-filters {
            flex-direction: column;
            gap: 15px;
            padding: 20px;
          }

          .summary-stats {
            grid-template-columns: 1fr;
            gap: 15px;
            margin-bottom: 25px;
          }

          .location-grid,
          .utilization-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .stat-card {
            padding: 20px;
          }

          .location-card,
          .utilization-card,
          .case-item,
          .schedule-item {
            padding: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedDashboard;