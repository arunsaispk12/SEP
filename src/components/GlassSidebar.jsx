// src/components/GlassSidebar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, BarChart2, Users, Building2, MapPin,
  Calendar, ClipboardList, RefreshCw, Home, Settings,
  LogOut, ChevronRight, X,
} from 'lucide-react';

const SIDEBAR_W = 240;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const ICON_MAP = {
  admin: Shield,
  dashboard: BarChart2,
  manager: BarChart2,
  users: Users,
  clients: Building2,
  locations: MapPin,
  calendar: Calendar,
  cases: ClipboardList,
  sync: RefreshCw,
  personal: Home,
  account: Settings,
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function avatarGradient(name) {
  const colors = [
    'linear-gradient(135deg,#a78bfa,#ec4899)',
    'linear-gradient(135deg,#60a5fa,#34d399)',
    'linear-gradient(135deg,#fbbf24,#f97316)',
    'linear-gradient(135deg,#34d399,#06b6d4)',
    'linear-gradient(135deg,#f472b6,#a78bfa)',
  ];
  const code = name && name.length > 0 ? name.charCodeAt(0) : 0;
  return colors[code % colors.length];
}

const LogoMark = () => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 1px rgba(167,139,250,0.3),0 0 16px rgba(167,139,250,0.3)' }}>
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
      <circle cx="5" cy="5" r="1.8" fill="white"/>
      <circle cx="11" cy="5" r="1.8" fill="white"/>
      <circle cx="17" cy="5" r="1.8" fill="white"/>
      <circle cx="5" cy="11" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="11" r="2.5" fill="white"/>
      <circle cx="17" cy="11" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="5" cy="17" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="17" r="1.8" fill="white"/>
      <circle cx="17" cy="17" r="1.8" fill="rgba(255,255,255,0.5)"/>
      <line x1="11" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="5" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="17" y1="5" x2="11" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="11" y1="11" x2="11" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
    </svg>
  </div>
);

export default function GlassSidebar({ activeTab, setActiveTab, tabs, user, profile, logout, isOpen, onClose }) {
  const name = profile?.name || user?.email || '';
  const role = profile?.role || '';
  const roleBadgeColor = {
    admin: '#f87171',
    manager: '#60a5fa',
    executive: '#fbbf24',
    engineer: '#34d399',
  }[role] || '#a78bfa';

  return (
    <div
      className={`glass-sidebar${isOpen ? ' glass-sidebar--open' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'min(280px, 85vw)',
        height: '100vh',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        fontFamily: FONT,
      }}
    >
      {/* ── Brand zone ── */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <LogoMark />
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.2px' }}>Service Engineer<br/>Planner</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Field Ops Platform</div>
        </div>
        <button onClick={onClose} className="glass-sidebar-close" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'none' }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Nav zone ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tabs.map(tab => {
          const Icon = ICON_MAP[tab.id] || ClipboardList;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); onClose?.(); }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(167,139,250,0.15)' : 'transparent',
                textAlign: 'left',
                width: '100%',
                position: 'relative',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: 'linear-gradient(180deg,#a78bfa,#60a5fa)', borderRadius: '0 2px 2px 0' }} />
              )}
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} color={isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)'} />
              {tab.label}
              {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'rgba(167,139,250,0.6)' }} />}
            </motion.button>
          );
        })}
      </nav>

      {/* ── User zone ── */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {getInitials(name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ display: 'inline-block', marginTop: 3, padding: '1px 7px', borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: roleBadgeColor, background: `${roleBadgeColor}18`, border: `1px solid ${roleBadgeColor}30` }}>{role}</div>
          </div>
        </div>
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 36, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        >
          <LogOut size={13} />
          Sign out
        </motion.button>
      </div>
    </div>
  );
}
