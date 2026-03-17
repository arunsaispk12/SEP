import React, { useState } from 'react';
import { 
  Users, 
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
  ChevronRight,
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
    <div className="client-management">
      <div className="page-header">
        <div className="header-info">
          <h1>Client Management</h1>
          <p>Manage IVF Hospitals and Fertility Centres</p>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add New Client
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <Building2 size={24} className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{clients.length}</span>
            <span className="stat-label">Total Clients</span>
          </div>
        </div>
        <div className="stat-card">
          <MapPin size={24} className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{locationObjects.length}</span>
            <span className="stat-label">Active Regions</span>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={24} className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{clients.filter(c => c.is_disclosed).length}</span>
            <span className="stat-label">Public Clients</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search hospitals or contacts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
            <option value="all">All Locations</option>
            {locationObjects.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="clients-grid">
        {filteredClients.map(client => (
          <div key={client.id} className="client-card">
            <div className="client-card-header">
              <div className="client-main-info">
                <h3>{client.name}</h3>
                <span className="location-tag">
                  <MapPin size={14} />
                  {locationObjects.find(l => l.id === client.location_id)?.name || 'Unknown'}
                </span>
              </div>
              <div className={`disclosure-badge ${client.is_disclosed ? 'public' : 'private'}`}>
                {client.is_disclosed ? <Shield size={14} /> : <ShieldOff size={14} />}
                {client.is_disclosed ? 'Public' : 'Private'}
              </div>
            </div>

            <div className="client-details">
              <div className="detail-item">
                <User size={16} />
                <div className="detail-text">
                  <span className="label">Contact Person</span>
                  <span className="value">{client.contact_person || 'N/A'}</span>
                  <span className="sub-value">{client.designation}</span>
                </div>
              </div>
              <div className="detail-item">
                <Phone size={16} />
                <div className="detail-text">
                  <span className="label">Mobile</span>
                  <span className="value">{client.mobile || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="client-card-footer">
              <span className="created-date">Added on {new Date(client.created_at).toLocaleDateString()}</span>
              <div className="card-actions">
                <button className="icon-btn edit" onClick={() => handleEdit(client)}>
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn delete" onClick={() => handleDelete(client.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <button className="close-modal" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-group">
                  <label>Client Name (Hospital/Clinic) *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter hospital name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Location</option>
                    {locationObjects.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleInputChange}
                      placeholder="Dr. Name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Clinical Director"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Assignment & Visibility</h3>
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="is_disclosed"
                    name="is_disclosed"
                    checked={formData.is_disclosed}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_disclosed">
                    <strong>Disclose to other Executives</strong>
                    <span>If unchecked, this client will only be visible to you and Admins.</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
... (rest of style unchanged) ...

      <style jsx>{`
        .client-management {
          padding: 20px;
          color: #f1f5f9;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header-info h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 0 0 4px 0;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-info p {
          color: #94a3b8;
          margin: 0;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #7B61FF 0%, #00D1FF 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(123, 97, 255, 0.4);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(10px);
        }

        .stat-icon {
          color: #7B61FF;
          padding: 10px;
          background: rgba(123, 97, 255, 0.1);
          border-radius: 12px;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .filters-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 300px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
        }

        .search-box input {
          background: transparent;
          border: none;
          color: #f1f5f9;
          padding: 12px 0;
          width: 100%;
          outline: none;
        }

        .filter-group {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 8px;
          color: #94a3b8;
        }

        .filter-group select {
          background: transparent;
          border: none;
          color: #f1f5f9;
          padding: 12px 0;
          outline: none;
          cursor: pointer;
        }

        .clients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .client-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          transition: transform 0.2s, border-color 0.2s;
          display: flex;
          flex-direction: column;
        }

        .client-card:hover {
          transform: translateY(-4px);
          border-color: rgba(123, 97, 255, 0.3);
          background: rgba(30, 41, 59, 0.6);
        }

        .client-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .client-main-info h3 {
          margin: 0 0 6px 0;
          font-size: 1.125rem;
          color: #fff;
        }

        .location-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
          font-size: 0.8125rem;
        }

        .disclosure-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .disclosure-badge.public {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
        }

        .disclosure-badge.private {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .client-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
          flex: 1;
        }

        .detail-item {
          display: flex;
          gap: 12px;
          color: #7B61FF;
        }

        .detail-text {
          display: flex;
          flex-direction: column;
        }

        .detail-text .label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-text .value {
          color: #e2e8f0;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .detail-text .sub-value {
          color: #64748b;
          font-size: 0.8125rem;
        }

        .client-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .created-date {
          font-size: 0.75rem;
          color: #64748b;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #7B61FF;
          color: white;
          border-color: #7B61FF;
        }

        .icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background: #1e293b;
          z-index: 10;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #fff;
        }

        .close-modal {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .modal-form {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section h3 {
          font-size: 0.875rem;
          color: #7B61FF;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .form-group input, .form-group select {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 12px;
          color: #f1f5f9;
          outline: none;
        }

        .form-group input:focus, .form-group select:focus {
          border-color: #7B61FF;
        }

        .form-checkbox {
          display: flex;
          gap: 12px;
          background: rgba(123, 97, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(123, 97, 255, 0.1);
        }

        .form-checkbox input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .form-checkbox label {
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }

        .form-checkbox label strong {
          color: #e2e8f0;
          font-size: 0.9375rem;
        }

        .form-checkbox label span {
          color: #64748b;
          font-size: 0.8125rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-primary {
          background: #7B61FF;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .clients-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientManagement;
