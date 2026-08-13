import React, { useState, useEffect, useRef } from 'react';
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
const TIME_SLOTS = generateTimeSlots(TENANT_CONFIG.opdWindows);
const OPD_HOURS_SUMMARY = formatWindowsSummary(TENANT_CONFIG.opdWindows);
const TODAY = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd, local timezone

// How long to keep polling payment-status after the checkout modal closes
// before giving up and falling back to "we'll confirm by phone" copy -
// generous, since Instamojo's webhook can occasionally lag a few seconds.
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 100; // ~5 minutes

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patientName: '', patientPhone: '', doctorId: '', preferredDate: '', preferredTimeSlot: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  // Set once checkout opens - drives the "confirming your payment..." state
  // while polling waits for Instamojo's webhook to land server-side.
  const [confirming, setConfirming] = useState(false);
  // Instamojo's redirect_url is only reachable after a full page reload (see
  // effect below), which wipes form state - captured separately from
  // payment-status so the success message still has a name to show.
  const [confirmedName, setConfirmedName] = useState('');
  const pollRef = useRef(null);

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

  // Don't leave a polling interval running after the component unmounts
  // (e.g. patient navigates away mid-payment).
  useEffect(() => () => clearInterval(pollRef.current), []);

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

  // Polls the backend for whether Instamojo's webhook has confirmed payment
  // yet - this, not anything the Instamojo checkout modal reports client-side,
  // is what actually reveals whether the Appointment was created. Mirrors the
  // same never-trust-the-client principle the backend's webhook handler uses.
  const pollPaymentStatus = (paymentRequestId) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await apiFetch(`${API_BASE}/api/appointments/payment-status/${paymentRequestId}`);
        const json = await res.json();
        if (json.data?.status === 'paid') {
          clearInterval(pollRef.current);
          setConfirming(false);
          setConfirmedName(json.data.patientName || '');
          setSuccess(true);
          return;
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(pollRef.current);
        setConfirming(false);
        // Payment may still be processing on Instamojo's side even though we
        // gave up polling - don't tell the patient it failed when we simply
        // don't know yet.
        setError("We're still confirming your payment - if it went through, the hospital will reach out to confirm your appointment. If you're unsure, please call us.");
      }
    }, POLL_INTERVAL_MS);
  };

  // Instamojo's checkout does a real top-level redirect back to redirect_url
  // once payment completes - not just closing an in-page overlay - appending
  // payment_id/payment_status/payment_request_id as query params. That
  // reloads the whole page (React state is gone), so this is the *primary*
  // way completion is detected, not just a fallback to the in-memory polling
  // above (which only helps if the modal is somehow dismissed without a
  // redirect, e.g. the patient closes it manually).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentRequestId = params.get('payment_request_id');
    const paymentStatus = params.get('payment_status');
    if (!paymentRequestId) return;

    // Strip the query params immediately - a refresh/back shouldn't re-run
    // this, and the URL shouldn't carry a payment ID around indefinitely.
    window.history.replaceState({}, '', window.location.pathname);

    if (paymentStatus !== 'Credit') {
      setError('Your payment did not go through. Please try again.');
      return;
    }
    setConfirming(true);
    pollPaymentStatus(paymentRequestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const res = await apiFetch(`${API_BASE}/api/appointments/create-payment-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Could not start payment');
        return;
      }

      const { longurl, paymentRequestId } = json.data;
      if (!window.Instamojo) {
        setError('Payment could not load. Please refresh and try again.');
        return;
      }

      // Best-effort UX hook - Instamojo's checkout.js fires this when the
      // modal closes (whether paid, failed, or just dismissed). The actual
      // source of truth is still the poll below regardless of what this
      // reports, same reasoning as not trusting a client-side redirect.
      window.Instamojo.configure({
        handlers: {
          onClose: () => setConfirming(true),
        },
      });
      window.Instamojo.open(longurl);
      setConfirming(true);
      pollPaymentStatus(paymentRequestId);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
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
                Thanks, {confirmedName || form.patientName}. Your payment was received and your appointment request has been
                sent to the hospital - they'll confirm it shortly by phone.
              </p>
            </>
          ) : confirming ? (
            <>
              <IconBadge name="calendar" />
              <h2 className="section-title">Confirming your payment&hellip;</h2>
              <p className="text-muted">This usually takes just a few seconds. Please don't close this page.</p>
              {error && <div className="ui-banner ui-banner-error" style={{ marginTop: '16px' }}>{error}</div>}
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
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>
                By paying, you agree to our <a href="/terms">Terms & Conditions</a> and <a href="/refund-policy">Refund Policy</a>.
              </p>
            </form>
          )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
