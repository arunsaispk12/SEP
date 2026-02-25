import React, { useState, useMemo, useCallback } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Settings,
  Database,
  Shield,
  Activity,
  BarChart3,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const engineerContext = useEngineerContext();
  const {
    engineers,
    cases,
    schedules,
    locations,
    updateEngineer,
    updateCase,
    updateSchedule
  } = engineerContext;

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const handleUserAction = useCallback((action, userId) => {
    // Handle user management actions
    console.log(`${action} user:`, userId);
  }, []);

  // System statistics
  const systemStats = useMemo(() => {
    return {
      totalUsers: engineers.length,
      activeUsers: engineers.filter(e => e.is_active).length,
      totalCases: cases.length,
      openCases: cases.filter(c => c.status !== 'completed').length,
      totalSchedules: schedules.length,
      systemHealth: 'Good'
    };
  }, [engineers, cases, schedules]);

  // Memoize filtered engineers to avoid recomputing on every render
  const filteredEngineers = useMemo(() => {
    return engineers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [engineers, searchTerm]);

  // Memoize sliced cases for admin view
  const displayedCases = useMemo(() => {
    return cases.slice(0, 20);
  }, [cases]);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <div className="denied-content">
          <Shield size={64} />
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin panel.</p>
          <p>This area is restricted to administrators only.</p>
        </div>
        <style jsx>{`
          .admin-access-denied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
          }
          .denied-content {
            text-align: center;
            background: rgba(22, 27, 34, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            max-width: 400px;
          }
          .denied-content h2 {
            color: #f87171;
            margin-bottom: 16px;
          }
          .denied-content p {
            color: #94a3b8;
            margin-bottom: 8px;
          }
        `}</style>
      </div>
    );
  }

  const adminTabs = [
    { id: 'overview', label: 'System Overview', icon: <Activity size={20} /> },
    { id: 'users', label: 'User Management', icon: <Users size={20} /> },
    { id: 'cases', label: 'Case Administration', icon: <Database size={20} /> },
    { id: 'system', label: 'System Settings', icon: <Settings size={20} /> }
  ];

  const OverviewTab = () => (
    <div className="overview-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{systemStats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{systemStats.activeUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{systemStats.totalCases}</div>
            <div className="stat-label">Total Cases</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{systemStats.openCases}</div>
            <div className="stat-label">Open Cases</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{systemStats.totalSchedules}</div>
            <div className="stat-label">Schedules</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{systemStats.systemHealth}</div>
            <div className="stat-label">System Health</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent System Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <Users size={16} />
            </div>
            <div className="activity-content">
              <p>New user registered: john.doe@example.com</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Database size={16} />
            </div>
            <div className="activity-content">
              <p>Case #1234 status updated to "In Progress"</p>
              <span className="activity-time">4 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <Settings size={16} />
            </div>
            <div className="activity-content">
              <p>System backup completed successfully</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="users-content">
      <div className="users-header">
        <div className="header-left">
          <h3>User Management</h3>
          <p>Manage system users and their permissions</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary">
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div className="table-cell">Name</div>
          <div className="table-cell">Email</div>
          <div className="table-cell">Role</div>
          <div className="table-cell">Status</div>
          <div className="table-cell">Actions</div>
        </div>
        {filteredEngineers.map(user => (
            <div key={user.id} className="table-row">
              <div className="table-cell">{user.name}</div>
              <div className="table-cell">{user.email}</div>
              <div className="table-cell">
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </div>
              <div className="table-cell">
                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="table-cell">
                <div className="action-buttons">
                  <button
                    className="btn-icon"
                    onClick={() => handleUserAction('edit', user.id)}
                    title="Edit user"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleUserAction('delete', user.id)}
                    title="Delete user"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const CasesTab = () => (
    <div className="cases-content">
      <h3>Case Administration</h3>
      <p>Monitor and manage all system cases</p>

      <div className="cases-grid">
        {displayedCases.map(case_ => (
          <div key={case_.id} className="case-admin-card">
            <div className="case-header">
              <h4>{case_.title}</h4>
              <span className={`status-badge ${case_.status}`}>
                {case_.status}
              </span>
            </div>
            <p>{case_.description}</p>
            <div className="case-meta">
              <span>Priority: {case_.priority}</span>
              <span>Location: {case_.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SystemTab = () => (
    <div className="system-content">
      <h3>System Settings</h3>
      <p>Configure system-wide settings and preferences</p>

      <div className="settings-grid">
        <div className="setting-card">
          <h4>Database Configuration</h4>
          <p>Manage database connections and settings</p>
          <button className="btn-secondary">Configure</button>
        </div>

        <div className="setting-card">
          <h4>Security Settings</h4>
          <p>Configure authentication and access controls</p>
          <button className="btn-secondary">Configure</button>
        </div>

        <div className="setting-card">
          <h4>Backup & Recovery</h4>
          <p>Manage system backups and recovery options</p>
          <button className="btn-secondary">Configure</button>
        </div>

        <div className="setting-card">
          <h4>API Configuration</h4>
          <p>Configure external API integrations</p>
          <button className="btn-secondary">Configure</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="header-content">
          <Shield size={32} />
          <div>
            <h1>Admin Panel</h1>
            <p>System administration and management</p>
          </div>
        </div>
        <div className="admin-info">
          <span>Administrator: {user.name}</span>
        </div>
      </div>

      <div className="admin-content">
        <nav className="admin-nav">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="admin-main">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'cases' && <CasesTab />}
          {activeTab === 'system' && <SystemTab />}
        </main>
      </div>

      <style jsx>{`
        .admin-panel {
          min-height: 100vh;
          padding: 20px;
        }

        .admin-header {
          background: rgba(22, 27, 34, 0.85);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-content h1 {
          margin: 0;
          color: #f1f5f9;
          font-size: clamp(1.4rem, 4vw, 2rem);
          font-weight: 700;
        }

        .header-content p {
          margin: 4px 0 0 0;
          color: #94a3b8;
        }

        .admin-info {
          color: #94a3b8;
          font-weight: 500;
        }

        .admin-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        .admin-nav {
          background: rgba(22, 27, 34, 0.85);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          height: fit-content;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border: none;
          background: transparent;
          border-radius: 12px;
          color: #94a3b8;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 6px;
          min-height: 44px;
        }

        .nav-item:hover {
          background: rgba(123, 97, 255, 0.1);
          color: #a78bfa;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #7b61ff 0%, #06b6d4 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(123, 97, 255, 0.3);
        }

        .admin-main {
          background: rgba(22, 27, 34, 0.85);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(13, 17, 23, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(123, 97, 255, 0.3);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .stat-icon {
          color: #a78bfa;
          background: rgba(123, 97, 255, 0.15);
          padding: 12px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 4px;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .recent-activity h3 {
          color: #f1f5f9;
          margin-bottom: 20px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(13, 17, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }

        .activity-content p {
          color: #e2e8f0;
          margin: 0 0 4px 0;
          font-size: 0.9rem;
        }

        .activity-icon {
          color: #a78bfa;
          flex-shrink: 0;
        }

        .activity-time {
          color: #64748b;
          font-size: 0.8rem;
        }

        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .users-header h3 {
          color: #f1f5f9;
          margin: 0;
        }

        .users-header p {
          color: #94a3b8;
          margin: 4px 0 0 0;
          font-size: 0.9rem;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(13, 17, 23, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          border-radius: 8px;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
          color: #e2e8f0;
          min-width: 160px;
        }

        .search-box input::placeholder {
          color: #64748b;
        }

        .search-box svg {
          color: #64748b;
          flex-shrink: 0;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #7b61ff 0%, #06b6d4 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(123, 97, 255, 0.4);
        }

        .users-table {
          background: rgba(13, 17, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 14px 20px;
          background: rgba(13, 17, 23, 0.6);
          font-weight: 600;
          color: #94a3b8;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          transition: background-color 0.2s ease;
          color: #e2e8f0;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: rgba(123, 97, 255, 0.05);
        }

        .role-badge, .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
        }

        .role-badge.admin {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .role-badge.manager {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        .role-badge.engineer {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }

        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 6px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(123, 97, 255, 0.15);
          color: #a78bfa;
          min-height: 32px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon:hover {
          background: #7b61ff;
          color: white;
        }

        .btn-icon.danger {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .btn-icon.danger:hover {
          background: #dc2626;
          color: white;
        }

        .cases-content h3,
        .system-content h3 {
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .cases-content > p,
        .system-content > p {
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .case-admin-card {
          background: rgba(13, 17, 23, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px;
          border-radius: 8px;
          transition: border-color 0.2s;
        }

        .case-admin-card:hover {
          border-color: rgba(123, 97, 255, 0.3);
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 8px;
        }

        .case-admin-card h4 {
          margin: 0;
          color: #f1f5f9;
          font-size: 0.95rem;
        }

        .case-admin-card p {
          color: #94a3b8;
          margin-bottom: 12px;
          font-size: 0.875rem;
        }

        .case-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: #64748b;
          flex-wrap: wrap;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .setting-card {
          background: rgba(13, 17, 23, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px;
          border-radius: 12px;
          transition: border-color 0.2s;
        }

        .setting-card:hover {
          border-color: rgba(123, 97, 255, 0.3);
        }

        .setting-card h4 {
          margin: 0 0 8px 0;
          color: #f1f5f9;
        }

        .setting-card p {
          color: #94a3b8;
          margin-bottom: 16px;
          font-size: 0.875rem;
        }

        .btn-secondary {
          background: rgba(123, 97, 255, 0.1);
          color: #a78bfa;
          border: 1px solid rgba(123, 97, 255, 0.3);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 36px;
          font-weight: 500;
        }

        .btn-secondary:hover {
          background: rgba(123, 97, 255, 0.2);
          border-color: #a78bfa;
        }

        @media (max-width: 900px) {
          .admin-content {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }

        @media (max-width: 640px) {
          .admin-panel {
            padding: 12px;
          }

          .admin-header {
            padding: 16px;
          }

          .users-header {
            flex-direction: column;
            align-items: stretch;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .table-row {
            padding: 12px 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;