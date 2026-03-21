import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Navigation,
  Globe,
  Building,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import supabaseService from '../services/supabaseService';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await supabaseService.updateLocation(editingLocation.id, formData);
        toast.success('Location updated successfully');
      } else {
        await supabaseService.createLocation(formData);
        toast.success('Location added successfully');
      }
      resetForm();
      loadLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location? This might affect existing users and cases.')) {
      try {
        await supabaseService.deleteLocation(id);
        toast.success('Location deleted');
        loadLocations();
      } catch (error) {
        console.error('Error deleting location:', error);
        toast.error('Failed to delete location');
      }
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      pincode: location.pincode || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    });
    setEditingLocation(null);
    setShowModal(false);
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loc.city && loc.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, color: '#f1f5f9' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px 0', background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Location Data
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Manage office locations and service regions</p>
        </div>
        <button className="glass-btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} />
          Add Location
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="glass-panel-sm" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(123,97,255,0.15)', color: '#a78bfa' }}>
            <Building size={24} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{locations.length}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>Total Locations</span>
          </div>
        </div>
        <div className="glass-panel-sm" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
            <Globe size={24} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
              {new Set(locations.map(l => l.state).filter(Boolean)).size}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>States Covered</span>
          </div>
        </div>
        <div className="glass-panel-sm" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
            <Navigation size={24} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
              {new Set(locations.map(l => l.city).filter(Boolean)).size}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>Cities</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 16px', maxWidth: 500 }}>
          <Search size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#f1f5f9', padding: '12px 0', width: '100%', outline: 'none', fontSize: '1rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: '1.125rem' }}>Loading locations...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div className="location-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, minWidth: 0 }}>
          {filteredLocations.map(location => (
            <div key={location.id} className="glass-panel-sm" style={{ overflow: 'hidden', transition: 'all 0.2s' }}>
              <div className="location-card-header" style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="location-card-icon" style={{ width: 48, height: 48, background: 'rgba(123,97,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', color: '#fff' }}>{location.name}</h3>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{location.city}, {location.state}</span>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ background: 'rgba(13,17,23,0.4)', padding: 12, borderRadius: 8 }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>Address</span>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9375rem', lineHeight: 1.5, color: '#cbd5e1' }}>{location.address || 'No address provided'}</p>
                  {location.pincode && <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>PIN: {location.pincode}</span>}
                </div>
              </div>

              <div style={{ padding: '14px 20px', background: 'rgba(13,17,23,0.3)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  className="glass-btn-secondary"
                  onClick={() => handleEdit(location)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.875rem' }}
                >
                  <Edit2 size={15} />
                  Edit
                </button>
                <button
                  className="glass-btn-danger"
                  onClick={() => handleDelete(location.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.875rem' }}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="glass-modal-backdrop">
          <div className="glass-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <div className="section-label">Location Name *</div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Bangalore Head Office"
                  required
                  className="glass-input"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <div className="section-label">Street Address</div>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full street address"
                  rows="3"
                  className="glass-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <div className="section-label">City *</div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                    className="glass-input"
                  />
                </div>
                <div>
                  <div className="section-label">State *</div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    required
                    className="glass-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div className="section-label">Pincode</div>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="6-digit PIN"
                  className="glass-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="glass-btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={18} />
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;
