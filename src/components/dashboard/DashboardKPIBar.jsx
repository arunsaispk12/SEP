// src/components/dashboard/DashboardKPIBar.jsx
import React from 'react';

const CARDS = [
  { id: 'total',     label: 'Total Cases',         color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { id: 'upcoming',  label: 'Upcoming (7 days)',    color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  { id: 'unassigned',label: 'Unassigned',           color: '#f87171', glow: 'rgba(248,113,113,0.25)' },
  { id: 'available', label: 'Available Engineers',  color: '#34d399', glow: 'rgba(52,211,153,0.3)'  },
];

export default function DashboardKPIBar({ counts, activeFilter, onFilterChange }) {
  // counts: { total, upcoming, unassigned, available }
  return (
    <div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
      {CARDS.map(card => {
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            style={{
              background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isActive ? card.color : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14,
              padding: '14px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: isActive ? `0 0 14px ${card.glow}` : 'none',
            }}
          >
            {/* Active stripe */}
            {isActive && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#fbbf24' }} />
            )}
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {counts[card.id] ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '.6px', marginTop: 5 }}>
              {card.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
