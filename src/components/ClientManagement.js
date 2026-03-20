import React, { useState } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  Shield,
  ShieldOff,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  Building2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEngineerContext } from '../context/EngineerContext';
import { useAuth } from '../context/AuthContext';

const ClientManagement = () => {
  const { user } = useAuth();
  const { clients, addClient, updateClient, deleteClient, locationObjects } = useEngineerContext();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [editingClient, setEditingClient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location_id: '',
    contact_person: '',
    designation: '',
    mobile: '',
    address: '',
    assigned_executive_id: null,
    is_disclosed: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast.success('Client updated successfully');
      } else {
        await addClient({
          ...formData,
          created_by: user.id,
          assigned_executive_id: formData.assigned_executive_id || user.id
        });
        toast.success('Client added successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location_id: '',
      contact_person: '',
      designation: '',
      mobile: '',
      address: '',
      assigned_executive_id: null,
      is_disclosed: true
    });
    setEditingClient(null);
    setShowModal(false);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      location_id: client.location_id || '',
      contact_person: client.contact_person || '',
      designation: client.designation || '',
      mobile: client.mobile || '',
      address: client.address || '',
      assigned_executive_id: client.assigned_executive_id,
      is_disclosed: client.is_disclosed
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
        toast.success('Client deleted');
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.contact_person && client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLocation = filterLocation === 'all' || client.location_id === parseInt(filterLocation);

    return matchesSearch && matchesLocation;
  });

  return (
    <div style={{ padding: 20, color: '#f1f5f9' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 4px 0', background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Client Management
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Manage IVF Hospitals and Fertility Centres</p>
        </div>
        <button className="glass-btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} />
          Add New Client
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div className="glass-panel-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Building2 size={24} style={{ color: '#7B61FF', padding: 10, background: 'rgba(123,97,255,0.1)', borderRadius: 12 }} />
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{clients.length}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Clients</span>
          </div>
        </div>
        <div className="glass-panel-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <MapPin size={24} style={{ color: '#7B61FF', padding: 10, background: 'rgba(123,97,255,0.1)', borderRadius: 12 }} />
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{locationObjects.length}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Active Regions</span>
          </div>
        </div>
        <div className="glass-panel-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <CheckCircle2 size={24} style={{ color: '#7B61FF', padding: 10, background: 'rgba(123,97,255,0.1)', borderRadius: 12 }} />
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{clients.filter(c => c.is_disclosed).length}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Public Clients</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 16px' }}>
          <Search size={18} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search hospitals or contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#f1f5f9', padding: '12px 0', width: '100%', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 16px', color: '#94a3b8' }}>
          <Filter size={18} />
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#f1f5f9', padding: '12px 0', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Locations</option>
            {locationObjects.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, minWidth: 500 }}>
        {filteredClients.map(client => (
          <div key={client.id} className="glass-panel-sm" style={{ padding: 20, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, border-color 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.125rem', color: '#fff' }}>{client.name}</h3>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: '0.8125rem' }}>
                  <MapPin size={14} />
                  {locationObjects.find(l => l.id === client.location_id)?.name || 'Unknown'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: client.is_disclosed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: client.is_disclosed ? '#4ade80' : '#f87171' }}>
                {client.is_disclosed ? <Shield size={14} /> : <ShieldOff size={14} />}
                {client.is_disclosed ? 'Public' : 'Private'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, flex: 1 }}>
              <div style={{ display: 'flex', gap: 12, color: '#7B61FF' }}>
                <User size={16} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Person</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.9375rem', fontWeight: 500 }}>{client.contact_person || 'N/A'}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>{client.designation}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, color: '#7B61FF' }}>
                <Phone size={16} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.9375rem', fontWeight: 500 }}>{client.mobile || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Added on {new Date(client.created_at).toLocaleDateString()}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEdit(client)}
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: 6, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#7B61FF'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.5)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: 6, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.5)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {showModal && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal-wide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <div className="section-label" style={{ color: '#7B61FF', marginBottom: 12 }}>Basic Information</div>
                <div style={{ marginBottom: 14 }}>
                  <div className="section-label">Client Name (Hospital/Clinic) *</div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter hospital name"
                    required
                    className="glass-input"
                  />
                </div>
                <div>
                  <div className="section-label">Location *</div>
                  <select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleInputChange}
                    required
                    className="glass-select"
                  >
                    <option value="">Select Location</option>
                    {locationObjects.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="glass-divider" />

              <div style={{ marginBottom: 20 }}>
                <div className="section-label" style={{ color: '#7B61FF', marginBottom: 12 }}>Contact Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <div className="section-label">Contact Person *</div>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleInputChange}
                      placeholder="Dr. Name"
                      required
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <div className="section-label">Designation</div>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Clinical Director"
                      className="glass-input"
                    />
                  </div>
                </div>
                <div>
                  <div className="section-label">Mobile Number *</div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile"
                    required
                    className="glass-input"
                  />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div className="section-label">Address</div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Hospital address"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="glass-divider" />

              <div style={{ marginBottom: 20 }}>
                <div className="section-label" style={{ color: '#7B61FF', marginBottom: 12 }}>Assignment & Visibility</div>
                <div style={{ display: 'flex', gap: 12, background: 'rgba(123,97,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(123,97,255,0.1)' }}>
                  <input
                    type="checkbox"
                    id="is_disclosed"
                    name="is_disclosed"
                    checked={formData.is_disclosed}
                    onChange={handleInputChange}
                    style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#7B61FF' }}
                  />
                  <label htmlFor="is_disclosed" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                    <strong style={{ color: '#e2e8f0', fontSize: '0.9375rem' }}>Disclose to other Executives</strong>
                    <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>If unchecked, this client will only be visible to you and Admins.</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="glass-btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="glass-btn-primary">
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
