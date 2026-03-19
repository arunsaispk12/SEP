// src/components/dashboard/TeamStatusPanel.jsx
import React from 'react';
import GlassPanel from './GlassPanel';
import { getEngineerStatus, getInitials, avatarGradient, ENGINEER_STATUS_CONFIG } from './dashboardUtils';

export default function TeamStatusPanel({ engineers, schedules, currentUserId, activeFilter }) {
  // When activeFilter === 'available', dim engineers that are not available
  return (
    <GlassPanel style={{ padding: '14px 16px', height: '100%' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 12 }}>
        Team Status
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {engineers.map((eng, i) => {
          const status = getEngineerStatus(eng, schedules);
          const cfg = ENGINEER_STATUS_CONFIG[status];
          const isMe = eng.id === currentUserId;
          const dimmed = activeFilter === 'available' && status !== 'available';
          const cityName = eng.current_location?.name || eng.currentLocation || eng.location?.name || eng.location || '—';

          return (
            <div
              key={eng.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: dimmed ? 0.3 : 1,
                transition: 'opacity 0.2s',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '6px 8px',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, minWidth: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#fff', fontWeight: 700,
                background: avatarGradient(i),
                boxShadow: isMe ? '0 0 0 2px #a78bfa' : 'none',
              }}>
                {getInitials(eng.name)}
              </div>

              {/* Name + location */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: isMe ? '#a78bfa' : '#fff', fontWeight: isMe ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {eng.name}{isMe && <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>(you)</span>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{cityName}</div>
              </div>

              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: cfg.color,
                boxShadow: cfg.glow,
                flexShrink: 0,
              }} title={cfg.label} />
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
