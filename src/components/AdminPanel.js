import React, { useState, useMemo } from 'react';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Settings,
  Database,
  Shield,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search
} from 'lucide-react';

const AdminPanel = () => {
  const { profile } = useAuth();
  const engineerContext = useEngineerContext();
  const {
    engineers,
    cases,
    schedules
  } = engineerContext;

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // System statistics — live from context data
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
    const term = searchTerm.toLowerCase();
    return engineers.filter(user =>
      (user.name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term)
    );
  }, [engineers, searchTerm]);

  // Memoize sliced cases for admin view
  const displayedCases = useMemo(() => {
    return cases.slice(0, 20);
  }, [cases]);

  // Check if user is admin
  if (!profile || profile.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
          <Shield size={64} style={{ color: '#f87171', marginBottom: 16 }} />
          <h2 style={{ color: '#f87171', marginBottom: 16 }}>Access Denied</h2>
          <p style={{ color: '#94a3b8', marginBottom: 8 }}>You don't have permission to access the admin panel.</p>
          <p style={{ color: '#94a3b8' }}>This area is restricted to administrators only.</p>
        </div>
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
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { icon: <Users size={24} />, value: systemStats.totalUsers, label: 'Total Users' },
          { icon: <CheckCircle size={24} />, value: systemStats.activeUsers, label: 'Active Users' },
          { icon: <Database size={24} />, value: systemStats.totalCases, label: 'Total Cases' },
          { icon: <AlertTriangle size={24} />, value: systemStats.openCases, label: 'Open Cases' },
          { icon: <BarChart3 size={24} />, value: systemStats.totalSchedules, label: 'Schedules' },
          { icon: <Shield size={24} />, value: systemStats.systemHealth, label: 'System Health' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.3s ease' }}>
            <div style={{ color: '#a78bfa', background: 'rgba(123,97,255,0.15)', padding: 12, borderRadius: 12, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 style={{ color: '#f1f5f9', marginBottom: 20 }}>Recent System Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: <Users size={16} />, text: 'New user registered: john.doe@example.com', time: '2 hours ago' },
            { icon: <Database size={16} />, text: 'Case #1234 status updated to "In Progress"', time: '4 hours ago' },
            { icon: <Settings size={16} />, text: 'System backup completed successfully', time: '1 day ago' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
              <div style={{ color: '#a78bfa', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <p style={{ color: '#e2e8f0', margin: '0 0 4px 0', fontSize: '0.9rem' }}>{item.text}</p>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ color: '#f1f5f9', margin: 0 }}>User Management</h3>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Manage system users and their permissions</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8 }}>
            <Search size={16} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: '#e2e8f0', minWidth: 160 }}
            />
          </div>
          <button className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12 }}>
      <div style={{ background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', minWidth: 560 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 16, padding: '14px 20px', background: 'rgba(13,17,23,0.6)', fontWeight: 600, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {filteredEngineers.map(user => (
          <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0', alignItems: 'center', transition: 'background-color 0.2s ease' }}>
            <div>{user.name}</div>
            <div>{user.email}</div>
            <div>
              <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: user.role === 'admin' ? 'rgba(239,68,68,0.15)' : user.role === 'manager' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: user.role === 'admin' ? '#f87171' : user.role === 'manager' ? '#fbbf24' : '#4ade80' }}>
                {user.role}
              </span>
            </div>
            <div>
              <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: user.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: user.is_active ? '#4ade80' : '#f87171' }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div />
          </div>
        ))}
      </div>
      </div>
    </div>
  );

  const CasesTab = () => (
    <div>
      <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>Case Administration</h3>
      <p style={{ color: '#94a3b8', marginBottom: 20 }}>Monitor and manage all system cases</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {displayedCases.map(case_ => (
          <div key={case_.id} className="glass-panel-sm" style={{ padding: 16, transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
              <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '0.95rem' }}>{case_.title}</h4>
              <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: 'rgba(123,97,255,0.15)', color: '#a78bfa', flexShrink: 0 }}>
                {case_.status}
              </span>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: 12, fontSize: '0.875rem' }}>{case_.description}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
              <span>Priority: {case_.priority}</span>
              <span>Location: {case_.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SystemTab = () => (
    <div>
      <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>System Settings</h3>
      <p style={{ color: '#94a3b8', marginBottom: 20 }}>Configure system-wide settings and preferences</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {[
          { title: 'Database Configuration', desc: 'Manage database connections and settings' },
          { title: 'Security Settings', desc: 'Configure authentication and access controls' },
          { title: 'Backup & Recovery', desc: 'Manage system backups and recovery options' },
          { title: 'API Configuration', desc: 'Configure external API integrations' },
        ].map((card, i) => (
          <div key={i} className="glass-panel-sm" style={{ padding: 20, transition: 'border-color 0.2s' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f1f5f9' }}>{card.title}</h4>
            <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: '0.875rem' }}>{card.desc}</p>
            <button className="glass-btn-secondary">Configure</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: 20, color: '#f1f5f9' }}>
      {/* Admin Header */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Shield size={32} style={{ color: '#a78bfa' }} />
          <div>
            <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700 }}>Admin Panel</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>System administration and management</p>
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontWeight: 500 }}>
          <span>Administrator: {profile.name}</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="admin-layout-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Nav */}
        <nav className="glass-panel" style={{ padding: 20, height: 'fit-content' }}>
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px',
                border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s ease',
                marginBottom: 6, minHeight: 44, fontWeight: 500,
                background: activeTab === tab.id ? 'linear-gradient(135deg, #7b61ff 0%, #06b6d4 100%)' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#94a3b8',
                boxShadow: activeTab === tab.id ? '0 4px 16px rgba(123,97,255,0.3)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="glass-panel" style={{ padding: 24 }}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'cases' && <CasesTab />}
          {activeTab === 'system' && <SystemTab />}
        </main>
      </div>

    </div>
  );
};

export default AdminPanel;
