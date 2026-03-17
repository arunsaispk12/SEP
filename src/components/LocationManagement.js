import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Map as MapIcon,
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
    <div className="location-management">
      <div className="page-header">
        <div className="header-info">
          <h1>Location Data</h1>
          <p>Manage office locations and service regions</p>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Location
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Building size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-value">{locations.length}</span>
            <span className="stat-label">Total Locations</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Globe size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-value">
              {new Set(locations.map(l => l.state).filter(Boolean)).size}
            </span>
            <span className="stat-label">States Covered</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <Navigation size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-value">
              {new Set(locations.map(l => l.city).filter(Boolean)).size}
            </span>
            <span className="stat-label">Cities</span>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search by name or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading locations...</div>
      ) : (
        <div className="locations-grid">
          {filteredLocations.map(location => (
            <div key={location.id} className="location-card">
              <div className="location-card-header">
                <div className="location-icon">
                  <MapPin size={24} />
                </div>
                <div className="location-title">
                  <h3>{location.name}</h3>
                  <span className="city-state">{location.city}, {location.state}</span>
                </div>
              </div>
              
              <div className="location-body">
                <div className="address-box">
                  <span className="label">Address</span>
                  <p>{location.address || 'No address provided'}</p>
                  {location.pincode && <span className="pincode">PIN: {location.pincode}</span>}
                </div>
              </div>

              <div className="location-footer">
                <button className="icon-btn edit" onClick={() => handleEdit(location)}>
                  <Edit2 size={16} />
                  Edit
                </button>
                <button className="icon-btn delete" onClick={() => handleDelete(location.id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingLocation ? 'Edit Location' : 'Add New Location'}</h2>
              <button className="close-btn" onClick={resetForm}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="location-form">
              <div className="form-group">
                <label>Location Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Bangalore Head Office"
                  required
                />
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full street address"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="6-digit PIN"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .location-management {
          padding: 24px;
          color: #1e293b;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .header-info h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .header-info p {
          color: #64748b;
          margin: 0;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
        }

        .add-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
        }

        .stat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue { background: #eff6ff; color: #3b82f6; }
        .stat-icon-wrapper.purple { background: #faf5ff; color: #a855f7; }
        .stat-icon-wrapper.green { background: #f0fdf4; color: #22c55e; }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .search-bar {
          margin-bottom: 24px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 16px;
          max-width: 500px;
        }

        .search-input-wrapper svg {
          color: #94a3b8;
        }

        .search-input-wrapper input {
          width: 100%;
          padding: 12px;
          border: none;
          outline: none;
          font-size: 1rem;
          color: #1e293b;
        }

        .locations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        .location-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.2s;
        }

        .location-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
        }

        .location-card-header {
          padding: 20px;
          display: flex;
          gap: 16px;
          border-bottom: 1px solid #f8fafc;
        }

        .location-icon {
          width: 48px;
          height: 48px;
          background: #f8fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .location-title h3 {
          margin: 0 0 4px 0;
          font-size: 1.125rem;
          color: #0f172a;
        }

        .city-state {
          color: #64748b;
          font-size: 0.875rem;
        }

        .location-body {
          padding: 20px;
        }

        .address-box {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
        }

        .address-box .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .address-box p {
          margin: 0 0 8px 0;
          font-size: 0.9375rem;
          line-height: 1.5;
          color: #334155;
        }

        .pincode {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }

        .location-footer {
          padding: 16px 20px;
          background: #f8fafc;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .icon-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .icon-btn.edit {
          background: #eff6ff;
          color: #3b82f6;
        }

        .icon-btn.edit:hover {
          background: #dbeafe;
        }

        .icon-btn.delete {
          background: #fef2f2;
          color: #ef4444;
        }

        .icon-btn.delete:hover {
          background: #fee2e2;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .modal-header {
          padding: 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #0f172a;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .location-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }

        .form-group input, 
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group input:focus, 
        .form-group textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .loading-state {
          text-align: center;
          padding: 48px;
          color: #64748b;
          font-size: 1.125rem;
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .locations-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LocationManagement;
