import React, { useState, useEffect } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import { API_BASE } from '../../utils/api';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patientName: '', patientPhone: '', doctorId: '', preferredDate: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/doctors/public`)
      .then(res => res.json())
      .then(json => {
        const list = json.data || [];
        setDoctors(list);
        if (list.length === 1) {
          setForm(f => ({ ...f, doctorId: list[0]._id }));
        }
      })
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(form.patientPhone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    if (!form.doctorId) {
      setError('Please select a doctor');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Could not book appointment');
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppNavbar role="public" />
      <div className="page page-narrow">
        <Card>
          {success ? (
            <>
              <h2 className="section-title">Request Sent</h2>
              <p>
                Thanks, {form.patientName}. Your appointment request has been sent to the hospital -
                they'll confirm it shortly by phone.
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="section-title">Book an Appointment</h2>
              <p className="text-muted" style={{ marginTop: '-12px', marginBottom: '20px' }}>
                No account needed. Online payment to confirm your slot is coming soon -
                for now, the hospital will call you to confirm.
              </p>
              {error && <div className="ui-banner ui-banner-error">{error}</div>}

              <Field label="Your Name" required htmlFor="patientName">
                <input id="patientName" className="ui-input" value={form.patientName} onChange={handleChange('patientName')} />
              </Field>

              <Field label="Phone Number" required htmlFor="patientPhone">
                <input id="patientPhone" className="ui-input" type="tel" value={form.patientPhone} onChange={handleChange('patientPhone')} />
              </Field>

              {doctors.length > 1 && (
                <Field label="Doctor" required htmlFor="doctorId">
                  <select id="doctorId" className="ui-select" value={form.doctorId} onChange={handleChange('doctorId')}>
                    <option value="">Select a doctor</option>
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>{doc.name} - {doc.specialization}</option>
                    ))}
                  </select>
                </Field>
              )}
              {doctors.length === 1 && (
                <p className="text-muted">Doctor: {doctors[0].name} ({doctors[0].specialization})</p>
              )}

              <Field label="Preferred Date" required htmlFor="preferredDate">
                <input id="preferredDate" className="ui-input" type="date" value={form.preferredDate} onChange={handleChange('preferredDate')} />
              </Field>

              <Field label="Reason for visit" htmlFor="reason">
                <textarea id="reason" className="ui-textarea" rows={3} value={form.reason} onChange={handleChange('reason')} />
              </Field>

              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Submitting...' : 'Request Appointment'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BookAppointment;
