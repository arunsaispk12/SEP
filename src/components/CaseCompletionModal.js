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

    </div>
  );
};

export default CaseCompletionModal;
