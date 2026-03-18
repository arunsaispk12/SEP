import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import { supabase } from '../config/supabase';
import {
  Edit, Trash2, Mail, CheckCircle, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user } = useAuth();
  const { engineers, approveUser, updateEngineer, loadData, locationObjects } = useEngineerContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'engineer', location_id: '' });
  const [inviteLoading, setInviteLoading] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  // ── Derived stats ───────────────────────────────────────────────
  const totalUsers = engineers.length;
  const engineerCount = engineers.filter(e => e.role === 'engineer').length;
  const pendingCount = engineers.filter(e => !e.is_active && e.invite_sent_at).length;
  const adminCount = engineers.filter(e => e.role === 'admin').length;

  // ── Filtering ───────────────────────────────────────────────────
  const filteredUsers = engineers.filter(e => {
    const matchSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (e.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || e.role === filterRole;
    let matchStatus = true;
    if (filterStatus === 'active') matchStatus = e.is_active === true;
    else if (filterStatus === 'pending') matchStatus = !e.is_active && !!e.invite_sent_at;
    else if (filterStatus === 'not_invited') matchStatus = !e.is_active && !e.invite_sent_at;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Status helpers ──────────────────────────────────────────────
  const getStatus = (e) => {
    if (e.is_active) return 'active';
    if (e.invite_sent_at) return 'pending';
    return 'not_invited';
  };

  const STATUS_CONFIG = {
    active:      { label: 'Active',             color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)' },
    pending:     { label: 'Pending Activation', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
    not_invited: { label: 'Not Invited',        color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.20)' },
  };

  const AVATAR_COLORS = {
    active:      'linear-gradient(135deg,#7c3aed,#4f46e5)',
    pending:     'linear-gradient(135deg,#d97706,#b45309)',
    not_invited: 'linear-gradient(135deg,#dc2626,#991b1b)',
  };

  const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const getRoleLabel = (role) => ({ engineer: '🔧 Engineer', manager: '👨‍💼 Manager', admin: '🛡️ Admin' }[role] || role);
  const getLocationName = (locId) => (locationObjects || []).find(l => l.id === locId)?.name || '';

  // ── Invite ──────────────────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { ...inviteForm, location_id: inviteForm.location_id || null, resend: false }
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      toast.success(`Invite sent to ${inviteForm.email}`);
      setShowInviteForm(false);
      setInviteForm({ name: '', email: '', role: 'engineer', location_id: '' });
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (engineer) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: engineer.email, name: engineer.name, role: engineer.role,
                location_id: engineer.location_id, resend: true }
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      toast.success(`Invite resent to ${engineer.email}`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to resend invite');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDeleteConfirm = async (engineer) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: engineer.id }
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      toast.success('User deleted');
      setDeletingId(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // ── Edit ────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateEngineer(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        location_id: editingUser.location_id || null,
        phone: editingUser.phone || null,
        laser_type: editingUser.laser_type || null,
        serial_number: editingUser.serial_number || null,
        tracker_status: editingUser.tracker_status || null,
      });
      toast.success('User updated');
      setShowEditForm(false);
      setEditingUser(null);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const iconBtn = (extra = {}) => ({
    width: 34, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', ...extra
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, color: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 26, fontWeight: 700 }}>User Management</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Manage user accounts and access</p>
        </div>
        <button className="glass-btn-primary" onClick={() => setShowInviteForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={16} /> Invite User
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: totalUsers, color: '#a78bfa' },
          { label: 'Engineers', value: engineerCount, color: '#60a5fa' },
          { label: 'Pending Activation', value: pendingCount, color: '#fbbf24', clickStatus: 'pending' },
          { label: 'Admins', value: adminCount, color: '#f87171' },
        ].map(stat => (
          <div key={stat.label}
            onClick={() => stat.clickStatus && setFilterStatus(f => f === stat.clickStatus ? 'all' : stat.clickStatus)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${stat.clickStatus && filterStatus === stat.clickStatus ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, padding: '14px 16px',
              cursor: stat.clickStatus ? 'pointer' : 'default',
            }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search users…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="glass-input" style={{ flex: 1, minWidth: 200 }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="glass-select" style={{ minWidth: 140 }}>
          <option value="all">All Roles</option>
          <option value="engineer">Engineers</option>
          <option value="manager">Managers</option>
          <option value="admin">Admins</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-select" style={{ minWidth: 160 }}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="pending">Pending Activation</option>
          <option value="not_invited">Not Invited</option>
        </select>
      </div>

      {/* ── User list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#475569' }}>No users found</div>
        )}
        {filteredUsers.map(engineer => {
          const status = getStatus(engineer);
          const sc = STATUS_CONFIG[status];
          return (
            <div key={engineer.id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16
            }}>
              {/* Avatar */}
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: AVATAR_COLORS[status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {getInitials(engineer.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{engineer.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                    {sc.label}
                  </span>
                  <span style={{ background: 'rgba(123,97,255,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                    {getRoleLabel(engineer.role)}
                  </span>
                </div>
                <div style={{ color: '#64748b', fontSize: 13 }}>
                  {engineer.email}
                  {engineer.location_id && ` · 📍 ${getLocationName(engineer.location_id)}`}
                  {engineer.phone && ` · 📞 ${engineer.phone}`}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 7, flexShrink: 0, alignItems: 'center' }}>
                {!engineer.is_approved && (
                  <button onClick={() => approveUser(engineer.id)} title="Approve"
                    style={iconBtn({ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' })}>
                    <CheckCircle size={16} />
                  </button>
                )}
                {(status === 'pending' || status === 'not_invited') && (
                  <button onClick={() => handleResendInvite(engineer)}
                    title={status === 'pending' ? 'Resend Invite' : 'Send Invite'}
                    style={{ ...iconBtn({ border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', background: 'rgba(99,102,241,0.12)' }), padding: '0 12px', width: 'auto', fontSize: 12, fontWeight: 600, gap: 4, display: 'flex' }}>
                    <Mail size={13} /> {status === 'pending' ? 'Resend' : 'Send Invite'}
                  </button>
                )}
                <button onClick={() => { setEditingUser({ ...engineer }); setShowEditForm(true); }} title="Edit"
                  style={iconBtn({ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' })}>
                  <Edit size={15} />
                </button>

                {deletingId === engineer.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: 12, color: '#f87171', whiteSpace: 'nowrap' }}>Delete user?</span>
                    <button onClick={() => handleDeleteConfirm(engineer)}
                      style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Confirm
                    </button>
                    <button onClick={() => setDeletingId(null)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingId(engineer.id)} title="Delete"
                    style={iconBtn({ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' })}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Invite Modal ── */}
      {showInviteForm && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>✉ Invite User</h3>
              <button onClick={() => setShowInviteForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 18px 0', color: '#64748b', fontSize: 13 }}>An invite email will be sent — user sets their own password on first login.</p>
            <form onSubmit={handleInvite}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Full Name *</div>
                  <input required className="glass-input" value={inviteForm.name}
                    onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div className="section-label">Email *</div>
                  <input required type="email" className="glass-input" value={inviteForm.email}
                    onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="section-label">Role *</div>
                  <select required className="glass-select" value={inviteForm.role}
                    onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="engineer">🔧 Engineer</option>
                    <option value="manager">👨‍💼 Manager</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                </div>
                <div>
                  <div className="section-label">Location</div>
                  <select className="glass-select" value={inviteForm.location_id}
                    onChange={e => setInviteForm(p => ({ ...p, location_id: e.target.value }))}>
                    <option value="">No location</option>
                    {(locationObjects || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#818cf8', marginBottom: 16 }}>
                ℹ A secure invite link will be emailed. No password needed — the user creates their own when they accept.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => setShowInviteForm(false)}>Cancel</button>
                <button type="submit" className="glass-btn-primary" disabled={inviteLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={15} /> {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditForm && editingUser && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Edit User</h3>
              <button onClick={() => { setShowEditForm(false); setEditingUser(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Full Name *</div>
                  <input required className="glass-input" value={editingUser.name || ''}
                    onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div className="section-label">Email</div>
                  <input readOnly className="glass-input" value={editingUser.email || ''} style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Role *</div>
                  <select required className="glass-select" value={editingUser.role || 'engineer'}
                    onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="engineer">🔧 Engineer</option>
                    <option value="manager">👨‍💼 Manager</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                </div>
                <div>
                  <div className="section-label">Location</div>
                  <select className="glass-select" value={editingUser.location_id || ''}
                    onChange={e => setEditingUser(p => ({ ...p, location_id: e.target.value || null }))}>
                    <option value="">No location</option>
                    {(locationObjects || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div className="section-label">Phone</div>
                <input type="tel" className="glass-input" value={editingUser.phone || ''}
                  onChange={e => setEditingUser(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="section-label">Laser Type</div>
                  <input className="glass-input" value={editingUser.laser_type || ''}
                    onChange={e => setEditingUser(p => ({ ...p, laser_type: e.target.value }))} />
                </div>
                <div>
                  <div className="section-label">Serial Number</div>
                  <input className="glass-input" value={editingUser.serial_number || ''}
                    onChange={e => setEditingUser(p => ({ ...p, serial_number: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-label">Tracker Status</div>
                <select className="glass-select" value={editingUser.tracker_status || ''}
                  onChange={e => setEditingUser(p => ({ ...p, tracker_status: e.target.value }))}>
                  <option value="">Not set</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="glass-btn-secondary" onClick={() => { setShowEditForm(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={15} /> Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
