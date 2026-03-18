// src/components/dashboard/MyStatusControls.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { getEngineerStatus, getInitials, avatarGradient, ENGINEER_STATUS_CONFIG } from './dashboardUtils';

export default function MyStatusControls({ engineer, engineerIndex, schedules, locationObjects, onUpdateEngineer }) {
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  if (!engineer) return null;

  const status = getEngineerStatus(engineer, schedules);
  const cfg = ENGINEER_STATUS_CONFIG[status];
  const cityName = engineer.current_location?.name || engineer.currentLocation || engineer.location?.name || engineer.location || '—';

  const handleLogTravel = async () => {
    if (!selectedLocationId) return;
    await onUpdateEngineer(engineer.id, { current_location_id: parseInt(selectedLocationId, 10), is_available: false });
    setShowTravelModal(false);
    setSelectedLocationId('');
  };

  const handleSetAvailable = async () => {
    const update = { is_available: true };
    if (engineer.location_id) update.current_location_id = engineer.location_id;
    await onUpdateEngineer(engineer.id, update);
  };

  return (
    <>
      <GlassPanel glow="purple" style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>
          My Status
        </div>

        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: avatarGradient(engineerIndex),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700,
            boxShadow: '0 0 0 2px #a78bfa',
          }}>
            {getInitials(engineer.name)}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{engineer.name}</div>
            <div style={{ fontSize: 8, color: cfg.color, marginTop: 1 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cfg.color, boxShadow: cfg.glow, marginRight: 4, verticalAlign: 'middle' }}/>
              {cfg.label} · {cityName}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => setShowTravelModal(true)}
          style={{ width: '100%', padding: '6px 0', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, color: '#fde68a', cursor: 'pointer', fontSize: 9, fontWeight: 600, marginBottom: 6 }}
        >📍 Log Travel / Change Location</button>
        <button
          onClick={handleSetAvailable}
          style={{ width: '100%', padding: '6px 0', background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 6, color: '#6ee7b7', cursor: 'pointer', fontSize: 9, fontWeight: 600 }}
        >✓ Set Available</button>
      </GlassPanel>

      {/* Log Travel Modal */}
      {showTravelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e1b4b', border: '1px solid rgba(167,139,250,0.35)', borderRadius: 12, padding: 24, width: 320, boxShadow: '0 0 24px rgba(167,139,250,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Log Travel</div>
              <button onClick={() => setShowTravelModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.6px' }}>Destination</div>
            <select
              value={selectedLocationId}
              onChange={e => setSelectedLocationId(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 16 }}
            >
              <option value="">Select location…</option>
              {locationObjects.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTravelModal(false)} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button
                onClick={handleLogTravel}
                disabled={!selectedLocationId}
                style={{ padding: '6px 14px', background: selectedLocationId ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedLocationId ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: selectedLocationId ? '#fde68a' : 'rgba(255,255,255,0.3)', cursor: selectedLocationId ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
