// src/components/GlassTopBar.jsx
import React from 'react';
import { Bell, Menu } from 'lucide-react';

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const TAB_TITLES = {
  admin: 'Admin Panel',
  dashboard: 'Dashboard',
  manager: 'Dashboard',
  personal: 'My Dashboard',
  users: 'User Management',
  clients: 'Clients',
  locations: 'Locations',
  calendar: 'Schedule',
  cases: 'Cases',
  sync: 'Google Calendar',
  account: 'Account',
};

export default function GlassTopBar({ activeTab, onMenuClick }) {
  const title = TAB_TITLES[activeTab] || 'SEP';

  return (
    <div
      className="glass-topbar"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: 48,
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 16,
        gap: 12,
        zIndex: 30,
        fontFamily: FONT,
      }}
    >
      {/* Mobile hamburger — hidden on desktop via CSS (.topbar-menu-btn display:none default, display:flex at ≤768px) */}
      <button
        onClick={onMenuClick}
        className="topbar-menu-btn"
        style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4, alignItems: 'center' }}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.2px', flex: 1 }}>
        {title}
      </div>

      {/* Notification bell */}
      <button
        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        title="Notifications (coming soon)"
      >
        <Bell size={14} color="rgba(255,255,255,0.5)" />
      </button>
    </div>
  );
}
