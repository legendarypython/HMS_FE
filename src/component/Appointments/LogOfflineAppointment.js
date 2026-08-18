import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import { generateTimeSlots } from '../../utils/timeSlots';
import { TENANT_CONFIG } from '../../config/tenant';

const TODAY = new Date().toLocaleDateString('en-CA');
const TIME_SLOTS = generateTimeSlots(TENANT_CONFIG.opdWindows);

// Fast manual entry for a patient who paid offline (cash/card at the desk)
// or a walk-in being logged after the fact - deliberately not the full Add
// Patient form, since this only ever creates an Appointment record (never
// tied to a Patient record at all - see HMS's Appointment model). Only
// name and phone are required, per direct request: staff need to be able
// to log these fast, not fill out a full intake form for a quick payment
// entry.
const LogOfflineAppointment = () => {
  const role = sessionStorage.getItem('userRole');
  const history = useHistory();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', doctorId: '', preferredDate: TODAY, preferredTimeSlot: '', reason: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/doctors/public`)
      .then(res => res.json())
      .then(json => {
        const list = json.data || [];
        setDoctors(list);
        if (list.length === 1) setForm(f => ({ ...f, doctorId: list[0]._id }));
      })
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.patientName.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!/^\d{10}$/.test(form.patientPhone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/appointments/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Could not log this appointment');
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const logAnother = () => {
    setForm({ patientName: '', patientPhone: '', doctorId: doctors.length === 1 ? doctors[0]._id : '', preferredDate: TODAY, preferredTimeSlot: '', reason: '' });
    setSuccess(false);
  };

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        <Card variant="elevated" style={{ maxWidth: 520, margin: '0 auto' }}>
          {success ? (
            <>
              <IconBadge name="check-circle" variant="success" />
              <h2 className="section-title">Logged</h2>
              <p className="text-muted">
                {form.patientName || 'The patient'}&apos;s visit has been recorded as paid (offline) and confirmed.
              </p>
              <div className="patient-form-actions">
                <Button onClick={logAnother}>Log Another</Button>
                <Link to="/appointments"><Button variant="ghost">Back to Appointments</Button></Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <IconBadge name="calendar" />
              <h2 className="section-title">Log Offline Visit</h2>
              <p className="text-muted" style={{ marginTop: '-12px', marginBottom: 20 }}>
                For a patient who paid in person, or a walk-in you're logging after the fact. Only name and phone are required.
              </p>
              {error && <div className="ui-banner ui-banner-error">{error}</div>}

              <Field label="Patient Name" required htmlFor="patientName">
                <input id="patientName" className="ui-input" value={form.patientName} onChange={handleChange('patientName')} autoFocus />
              </Field>

              <Field label="Phone Number" required htmlFor="patientPhone">
                <input id="patientPhone" className="ui-input" type="tel" value={form.patientPhone} onChange={handleChange('patientPhone')} />
              </Field>

              {doctors.length > 1 && (
                <Field label="Doctor" htmlFor="doctorId">
                  <select id="doctorId" className="ui-select" value={form.doctorId} onChange={handleChange('doctorId')}>
                    <option value="">Select a doctor</option>
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>{doc.name} - {doc.specialization}</option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Date" htmlFor="preferredDate">
                <input id="preferredDate" className="ui-input" type="date" value={form.preferredDate} onChange={handleChange('preferredDate')} />
              </Field>

              <Field label="Time (optional)" htmlFor="preferredTimeSlot">
                <select id="preferredTimeSlot" className="ui-select" value={form.preferredTimeSlot} onChange={handleChange('preferredTimeSlot')}>
                  <option value="">Walk-in / not specified</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Reason for visit (optional)" htmlFor="reason">
                <textarea id="reason" className="ui-textarea" rows={2} value={form.reason} onChange={handleChange('reason')} />
              </Field>

              <div className="patient-form-actions">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Log Visit'}</Button>
                <Button type="button" variant="ghost" onClick={() => history.push('/appointments')}>Cancel</Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LogOfflineAppointment;
