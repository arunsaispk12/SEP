import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  FileText, 
  MapPin, 
  Users,
  Save,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const CaseCompletionModal = ({ caseData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clientName: caseData.title || '',
    location: caseData.location || '',
    embryologistName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    patients: [
      { name: '', age: '', test: '', embryos: '' }
    ]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePatientChange = (index, field, value) => {
    const updatedPatients = [...formData.patients];
    updatedPatients[index][field] = value;
    setFormData(prev => ({
      ...prev,
      patients: updatedPatients
    }));
  };

  const addPatient = () => {
    setFormData(prev => ({
      ...prev,
      patients: [...prev.patients, { name: '', age: '', test: '', embryos: '' }]
    }));
  };

  const removePatient = (index) => {
    if (formData.patients.length === 1) {
      toast.error('At least one patient is required');
      return;
    }
    const updatedPatients = formData.patients.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      patients: updatedPatients
    }));
  };

  const handleExport = () => {
    try {
      const headers = ['Patient Name', 'Age', 'Test', 'Embryos'];
      const rows = formData.patients.map(p => [
        p.name || 'N/A',
        p.age || 'N/A',
        p.test || 'N/A',
        p.embryos || 'N/A'
      ]);

      let csvContent = `Case Completion Report\n`;
      csvContent += `Client: ${formData.clientName}\n`;
      csvContent += `Location: ${formData.location}\n`;
      csvContent += `Date: ${formData.date}\n`;
      csvContent += `Embryologist: ${formData.embryologistName}\n\n`;
      csvContent += headers.join(',') + '\n';
      
      rows.forEach(row => {
        csvContent += row.join(',') + '\n';
      });

      if (formData.notes) {
        csvContent += `\nNotes: ${formData.notes}\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Case_Report_${formData.clientName}_${formData.date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported as CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.embryologistName) {
      toast.error('Embryologist Name is required');
      return;
    }

    const hasEmptyPatient = formData.patients.some(p => !p.name || !p.age);
    if (hasEmptyPatient) {
      toast.error('Please fill in all patient names and ages');
      return;
    }

    onSave({
      caseId: caseData.id,
      completionData: formData
    });
    toast.success('Case details saved successfully!');
    onClose();
  };

  return (
    <div className="completion-modal-overlay">
      <div className="completion-modal-content">
        <div className="modal-header">
          <div className="header-title">
            <FileText size={24} className="header-icon" />
            <h2>Case Completion Details</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section main-info">
            <div className="form-grid">
              <div className="form-group">
                <label>Client Name</label>
                <div className="input-with-icon">
                  <Users size={18} />
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="Enter hospital/client name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter location"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Embryologist Name *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="text"
                    name="embryologistName"
                    value={formData.embryologistName}
                    onChange={handleInputChange}
                    placeholder="Enter embryologist name"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section patients-section">
            <div className="section-header">
              <h3>Patient Details</h3>
              <button type="button" className="add-patient-btn" onClick={addPatient}>
                <Plus size={16} />
                Add Patient
              </button>
            </div>

            <div className="patients-list">
              {formData.patients.map((patient, index) => (
                <div key={index} className="patient-row">
                  <div className="patient-number">{index + 1}</div>
                  <div className="patient-inputs">
                    <div className="patient-group">
                      <input
                        type="text"
                        placeholder="Patient Name"
                        value={patient.name}
                        onChange={(e) => handlePatientChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="patient-group small">
                      <input
                        type="number"
                        placeholder="Age"
                        value={patient.age}
                        onChange={(e) => handlePatientChange(index, 'age', e.target.value)}
                        required
                      />
                    </div>
                    <div className="patient-group">
                      <input
                        type="text"
                        placeholder="Test"
                        value={patient.test}
                        onChange={(e) => handlePatientChange(index, 'test', e.target.value)}
                      />
                    </div>
                    <div className="patient-group small">
                      <input
                        type="number"
                        placeholder="Embryos"
                        value={patient.embryos}
                        onChange={(e) => handlePatientChange(index, 'embryos', e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="remove-patient-btn"
                    onClick={() => removePatient(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section notes-section">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter any additional notes or case details..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <div className="export-options">
              <button 
                type="button" 
                className="btn-export active" 
                onClick={handleExport}
              >
                <Download size={18} />
                Export CSV Report
              </button>
            </div>
            <div className="submit-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                <Save size={18} />
                Complete Case
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .completion-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
          padding: 20px;
        }

        .completion-modal-content {
          background: #1e293b;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background: #1e293b;
          z-index: 10;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          color: #3b82f6;
        }

        .modal-header h2 {
          margin: 0;
          color: #f1f5f9;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #f1f5f9;
        }

        .modal-body {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: 12px;
          color: #64748b;
        }

        .input-with-icon input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .input-with-icon input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          color: #f1f5f9;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .add-patient-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-patient-btn:hover {
          background: #2563eb;
        }

        .patients-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .patient-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0f172a;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .patient-number {
          width: 24px;
          height: 24px;
          background: #334155;
          color: #94a3b8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .patient-inputs {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .patient-group {
          flex: 2;
        }

        .patient-group.small {
          flex: 1;
        }

        .patient-inputs input {
          width: 100%;
          padding: 8px 12px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 0.875rem;
        }

        .remove-patient-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.2s;
        }

        .remove-patient-btn:hover {
          opacity: 1;
          color: #f87171;
        }

        .notes-section label {
          display: block;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .notes-section textarea {
          width: 100%;
          padding: 12px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 1rem;
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .submit-actions {
          display: flex;
          gap: 12px;
        }

        .btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.2);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: not-allowed;
        }

        .btn-export.active {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
          cursor: pointer;
        }

        .btn-export.active:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .btn-cancel {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: rgba(148, 163, 184, 0.1);
          color: #f1f5f9;
        }

        .btn-submit {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .patient-inputs {
            flex-direction: column;
            gap: 8px;
          }

          .modal-actions {
            flex-direction: column;
            gap: 16px;
          }

          .submit-actions {
            width: 100%;
          }

          .submit-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CaseCompletionModal;
