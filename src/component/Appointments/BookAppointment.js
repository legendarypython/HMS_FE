import React, { useState, useEffect } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import IconBadge from '../ui/IconBadge';
import { API_BASE, apiFetch } from '../../utils/api';
import { TENANT_CONFIG } from '../../config/tenant';
import { generateTimeSlots, isClinicClosed, formatWindowsSummary } from '../../utils/timeSlots';
import './BookAppointment.css';

const CONSULTATION_FEE_DISPLAY = '₹500';
const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const TIME_SLOTS = generateTimeSlots(TENANT_CONFIG.opdWindows);
const OPD_HOURS_SUMMARY = formatWindowsSummary(TENANT_CONFIG.opdWindows);
const TODAY = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd, local timezone

// Loads the Razorpay Checkout script once and reuses it on subsequent opens,
// rather than re-injecting a <script> tag every time the form is submitted.
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patientName: '', patientPhone: '', doctorId: '', preferredDate: '', preferredTimeSlot: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/doctors/public`)
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

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (isClinicClosed(value, TENANT_CONFIG.closedDays)) {
      setError('The clinic is closed on this day - please choose another date.');
      setForm({ ...form, preferredDate: '' });
      return;
    }
    setError('');
    setForm({ ...form, preferredDate: value });
  };

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
    if (!form.preferredDate || !form.preferredTimeSlot) {
      setError('Please select a preferred date and time');
      return;
    }
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Could not load the payment gateway. Please check your connection and try again.');
        return;
      }

      const orderRes = await apiFetch(`${API_BASE}/api/appointments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: form.doctorId })
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderJson.message || 'Could not start payment');
        return;
      }
      const { orderId, amount, currency, keyId } = orderJson.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: TENANT_CONFIG.name,
        description: 'Consultation fee',
        prefill: { name: form.patientName, contact: form.patientPhone },
        theme: { color: '#00695c' },
        handler: async (response) => {
          try {
            const verifyRes = await apiFetch(`${API_BASE}/api/appointments/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ...form
              })
            });
            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok) {
              setError(verifyJson.message || 'Payment succeeded but booking failed - please contact the hospital.');
              return;
            }
            setSuccess(true);
          } catch (err) {
            setError('Payment succeeded but booking failed - please contact the hospital.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User closed the checkout without paying - not an error, just let them retry.
          ondismiss: () => setLoading(false)
        }
      });
      razorpay.open();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <AppNavbar role="public" />

      <div className="booking-hero">
        <div
          className="booking-hero-photo"
          style={{ backgroundImage: `url(${TENANT_CONFIG.bookingBgImage})` }}
          aria-hidden="true"
        />
        <div className="booking-hero-scrim" aria-hidden="true" />
        <div className="booking-hero-content">
          <span className="hero-badge">
            <Icon name="stethoscope" size={15} /> {TENANT_CONFIG.doctorName} &middot; MBBS, MS
          </span>
        </div>
      </div>

      <div className="booking-page-bg">
        <div className="page page-narrow">
          <Card variant="elevated">
          {success ? (
            <>
              <IconBadge name="check-circle" variant="success" />
              <h2 className="section-title">Request Sent</h2>
              <p>
                Thanks, {form.patientName}. Your payment was received and your appointment request has been
                sent to the hospital - they'll confirm it shortly by phone.
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <IconBadge name="calendar" />
              <h2 className="section-title">Book an Appointment</h2>
              <p className="text-muted" style={{ marginTop: '-12px', marginBottom: '8px' }}>
                A consultation fee of {CONSULTATION_FEE_DISPLAY} is collected online to confirm your slot.
              </p>
              <p className="text-muted" style={{ marginTop: 0, marginBottom: '20px', fontSize: '0.88rem' }}>
                OPD hours: {OPD_HOURS_SUMMARY} &middot; Closed Sundays
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
                <input id="preferredDate" className="ui-input" type="date" min={TODAY} value={form.preferredDate} onChange={handleDateChange} />
              </Field>

              <Field label="Preferred Time" required htmlFor="preferredTimeSlot">
                <select id="preferredTimeSlot" className="ui-select" value={form.preferredTimeSlot} onChange={handleChange('preferredTimeSlot')}>
                  <option value="">Select a time slot</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Reason for visit" htmlFor="reason">
                <textarea id="reason" className="ui-textarea" rows={3} value={form.reason} onChange={handleChange('reason')} />
              </Field>

              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Processing...' : `Pay ${CONSULTATION_FEE_DISPLAY} & Request Appointment`}
              </Button>
            </form>
          )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
