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
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          .denied-content {
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          .denied-content h2 {
            color: #dc2626;
            margin-bottom: 16px;
          }
          .denied-content p {
            color: #64748b;
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
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }

        .admin-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-content h1 {
          margin: 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 4px 0 0 0;
          color: #64748b;
        }

        .admin-info {
          color: #64748b;
          font-weight: 500;
        }

        .admin-content {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
        }

        .admin-nav {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px 20px;
          border: none;
          background: transparent;
          border-radius: 12px;
          color: #64748b;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 8px;
        }

        .nav-item:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .admin-main {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          padding: 12px;
          border-radius: 12px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .recent-activity h3 {
          color: #1f2937;
          margin-bottom: 20px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .activity-icon {
          color: #667eea;
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
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .users-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 16px 20px;
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        .role-badge, .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .role-badge.admin {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .role-badge.manager {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .role-badge.engineer {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
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
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .btn-icon:hover {
          background: #667eea;
          color: white;
        }

        .btn-icon.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .btn-icon.danger:hover {
          background: #dc2626;
          color: white;
        }

        .cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .case-admin-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .case-admin-card h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .case-admin-card p {
          color: #64748b;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }

        .case-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: #64748b;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .setting-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .setting-card h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .setting-card p {
          color: #64748b;
          margin-bottom: 16px;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        @media (max-width: 768px) {
          .admin-content {
            grid-template-columns: 1fr;
          }

          .admin-nav {
            order: 2;
          }

          .users-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .search-box {
            width: 100%;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-row {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;