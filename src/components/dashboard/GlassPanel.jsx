// src/components/dashboard/GlassPanel.jsx
import React from 'react';

const GLOW = {
  purple: { boxShadow: '0 0 12px rgba(167,139,250,0.3)', borderColor: 'rgba(167,139,250,0.35)' },
  green:  { boxShadow: '0 0 10px rgba(52,211,153,0.3)',  borderColor: 'rgba(52,211,153,0.35)'  },
  amber:  { boxShadow: '0 0 10px rgba(251,191,36,0.25)', borderColor: 'rgba(251,191,36,0.3)'   },
  red:    { boxShadow: '0 0 10px rgba(248,113,113,0.25)',borderColor: 'rgba(248,113,113,0.3)'  },
  none:   {},
};

/**
 * Reusable glass card.
 * @param {string} glow - 'purple' | 'green' | 'amber' | 'red' | 'none'
 * @param {string} topStripe - CSS color for 3px top accent stripe, or null
 * @param {string} className - extra Tailwind classes
 */
export default function GlassPanel({ children, glow = 'none', topStripe = null, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        ...GLOW[glow],
        ...style,
      }}
      className={className}
      {...props}
    >
      {topStripe && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: topStripe }} />
      )}
      {children}
    </div>
  );
}
