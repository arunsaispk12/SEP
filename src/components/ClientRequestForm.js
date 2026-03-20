import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const ClientRequestForm = () => {
  const [form, setForm] = useState({
    hospital: '', location: '', address: '', contact: '', phone: '', description: '', preferredDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-client-request', {
        body: form
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.screen}>
      <Toaster position="top-center" />
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>⚙️</div>
          <h1 style={s.title}>Service Request</h1>
          <p style={s.subtitle}>Submit a service request and our team will get back to you shortly.</p>
        </div>

        {submitted ? (
          <div style={s.success}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2 style={{ color: '#4ade80', margin: '16px 0 8px' }}>Request Submitted</h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>We'll be in touch soon. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {[
              { name: 'hospital', label: 'Hospital / Clinic Name', type: 'text', placeholder: 'City IVF Centre', required: true },
              { name: 'location', label: 'City / Location', type: 'text', placeholder: 'Bangalore', required: true },
              { name: 'address', label: 'Address', type: 'text', placeholder: '123 MG Road, Indiranagar', required: false },
              { name: 'contact', label: 'Contact Person', type: 'text', placeholder: 'Dr. Name', required: true },
              { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', required: true },
            ].map(f => (
              <div key={f.name} style={s.field}>
                <label style={s.label}>{f.label} {f.required && <span style={{ color: '#f87171' }}>*</span>}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required={f.required}
                  style={s.input}
                />
              </div>
            ))}

            <div style={s.field}>
              <label style={s.label}>Request Description <span style={{ color: '#f87171' }}>*</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the service needed..."
                required
                rows={4}
                style={{ ...s.input, resize: 'vertical' }}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Preferred Date <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="date"
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                style={s.input}
              />
            </div>

            <button type="submit" disabled={submitting} style={s.btn}>
              {submitting ? 'Submitting…' : 'Submit Request →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const s = {
  screen: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 480 },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: { fontSize: 40, marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  input: { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 13, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  success: { textAlign: 'center', padding: '20px 0' },
};

export default ClientRequestForm;
