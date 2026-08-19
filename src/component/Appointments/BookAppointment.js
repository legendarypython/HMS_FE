import React, { useState, useEffect, useRef } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import IconBadge from '../ui/IconBadge';
import Select from '../ui/Select';
import DateInput from '../ui/DateInput';
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

// Step-by-step wizard instead of one long scrolling form - one decision at a
// time reads better on mobile, which is where most patients actually book
// from. "doctor" is skipped entirely when there's only one doctor (this
// practice's real case) rather than showing a pointless single-option step.
const STEPS_MULTI_DOCTOR = ['doctor', 'slot', 'details', 'confirm'];
const STEPS_SINGLE_DOCTOR = ['slot', 'details', 'confirm'];
const STEP_LABELS = { doctor: 'Select Doctor', slot: 'Choose Slot', details: 'Your Details', confirm: 'Confirmation' };

const formatDateLong = (isoDate) => {
  if (!isoDate) return '-';
  // T00:00:00 (not a bare date string) avoids the UTC-shift-near-midnight
  // bug the rest of this codebase already works around the same way.
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patientName: '', patientPhone: '', email: '', doctorId: '', preferredDate: '', preferredTimeSlot: '', reason: '' });
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
  // True when this booking skipped payment entirely (free 7-day follow-up) -
  // changes the success message, since "your payment was received" would be
  // false for these.
  const [isFreeFollowup, setIsFreeFollowup] = useState(false);
  // null = not yet fetched for the current date (show the full static list
  // so the dropdown isn't empty before a date is picked); array = the real,
  // doctor-availability-filtered set for that specific date.
  const [availableSlots, setAvailableSlots] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const pollRef = useRef(null);

  const steps = doctors.length > 1 ? STEPS_MULTI_DOCTOR : STEPS_SINGLE_DOCTOR;
  // Guards against a stale index if `doctors` resolves from >1 to 1 (or vice
  // versa) after the initial fetch, between renders.
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];

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

  // Once both a doctor and a date are known, ask the backend which slots are
  // actually bookable that day (OPD hours minus whatever the doctor's
  // blocked via the Availability grid) - narrows the dropdown to real
  // options instead of letting a patient pick a slot that only fails later,
  // at payment time.
  useEffect(() => {
    if (!form.doctorId || !form.preferredDate) {
      setAvailableSlots(null);
      return;
    }
    let cancelled = false;
    apiFetch(`${API_BASE}/api/doctors/${form.doctorId}/available-slots?date=${form.preferredDate}`)
      .then(res => res.json())
      .then(json => {
        if (cancelled) return;
        setAvailableSlots(json.data?.availableSlots || []);
      })
      .catch(err => {
        console.error('Error fetching available slots:', err);
        if (!cancelled) setAvailableSlots(null);
      });
    return () => { cancelled = true; };
  }, [form.doctorId, form.preferredDate]);

  // If the previously-picked slot is no longer in the freshly-fetched
  // available list (e.g. someone just blocked it, or it changed with the
  // date), clear the stale selection rather than silently submit it.
  useEffect(() => {
    if (availableSlots && form.preferredTimeSlot && !availableSlots.includes(form.preferredTimeSlot)) {
      setForm(f => ({ ...f, preferredTimeSlot: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSlots]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (isClinicClosed(value, TENANT_CONFIG.closedDays)) {
      setError('The clinic is closed on this day - please choose another date.');
      setForm({ ...form, preferredDate: '' });
      return;
    }
    setError('');
    setForm({ ...form, preferredDate: value, preferredTimeSlot: '' });
  };

  const visibleSlots = availableSlots === null
    ? TIME_SLOTS
    : TIME_SLOTS.filter(slot => availableSlots.includes(slot.value));

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

      if (json.data.freeFollowup) {
        setIsFreeFollowup(true);
        setConfirmedName(json.data.patientName || form.patientName);
        setSuccess(true);
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

  // Per-step validation before advancing - same rules handleSubmit already
  // enforces as a final backstop, just surfaced earlier so a patient finds
  // out about a missing field on the step that actually needs it instead of
  // only at the very end.
  const goNext = () => {
    setError('');
    if (currentStep === 'doctor' && !form.doctorId) {
      setError('Please select a doctor');
      return;
    }
    if (currentStep === 'slot' && (!form.preferredDate || !form.preferredTimeSlot)) {
      setError('Please select a preferred date and time');
      return;
    }
    if (currentStep === 'details') {
      if (!form.patientName.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!/^\d{10}$/.test(form.patientPhone)) {
        setError('Enter a valid 10-digit phone number');
        return;
      }
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => {
    setError('');
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const selectedDoctor = doctors.find((d) => d._id === form.doctorId);
  const selectedSlotLabel = TIME_SLOTS.find((s) => s.value === form.preferredTimeSlot)?.label;

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
          {!success && !confirming && (
            <div className="booking-steps">
              {steps.map((key, idx) => (
                <React.Fragment key={key}>
                  {idx > 0 && <span className="booking-step-divider">&mdash;</span>}
                  <span className={`booking-step ${idx === stepIndex ? 'booking-step-active' : ''} ${idx < stepIndex ? 'booking-step-complete' : ''}`}>
                    <span className="booking-step-num">{idx < stepIndex ? <Icon name="check-circle" size={12} /> : idx + 1}</span>
                    <span className="booking-step-label">{STEP_LABELS[key]}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
          {success ? (
            <>
              <IconBadge name="check-circle" variant="success" />
              <h2 className="section-title">{isFreeFollowup ? 'Appointment Confirmed' : 'Request Sent'}</h2>
              {isFreeFollowup ? (
                <p>
                  Thanks, {confirmedName || form.patientName}. Since you visited within the last 7 days, this follow-up
                  is <strong>free</strong> - no payment needed. Your appointment is confirmed.
                </p>
              ) : (
                <p>
                  Thanks, {confirmedName || form.patientName}. Your payment was received and your appointment request has been
                  sent to the hospital - they'll confirm it shortly by phone.
                </p>
              )}
            </>
          ) : confirming ? (
            <>
              <IconBadge name="calendar" className="confirming-icon-pulse" />
              <h2 className="section-title">Confirming your payment&hellip;</h2>
              <p className="text-muted">This usually takes just a few seconds. Please don't close this page.</p>
              {error && <div className="ui-banner ui-banner-error" style={{ marginTop: '16px' }}>{error}</div>}
            </>
          ) : (
            <>
              {error && <div className="ui-banner ui-banner-error">{error}</div>}

              {currentStep === 'doctor' && (
                <div>
                  <IconBadge name="stethoscope" />
                  <h2 className="section-title">Select Your Doctor</h2>
                  <Field label="Doctor" required htmlFor="doctorId">
                    <Select id="doctorId" value={form.doctorId} onChange={handleChange('doctorId')}>
                      <option value="">Select a doctor</option>
                      {doctors.map(doc => (
                        <option key={doc._id} value={doc._id}>{doc.name} - {doc.specialization}</option>
                      ))}
                    </Select>
                  </Field>
                  <div className="booking-step-actions">
                    <Button size="lg" style={{ width: '100%' }} onClick={goNext}>
                      Continue <Icon name="arrow-right" size={18} />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 'slot' && (
                <div>
                  <IconBadge name="calendar" />
                  <h2 className="section-title">Choose Date &amp; Time</h2>
                  <p className="text-muted" style={{ marginTop: '-12px', marginBottom: '20px', fontSize: '0.88rem' }}>
                    OPD hours: {OPD_HOURS_SUMMARY} &middot; Closed Sundays
                  </p>

                  <Field label="Preferred Date" required htmlFor="preferredDate">
                    <DateInput id="preferredDate" min={TODAY} value={form.preferredDate} onChange={handleDateChange} />
                  </Field>

                  <Field label="Preferred Time" required htmlFor="preferredTimeSlot">
                    <Select id="preferredTimeSlot" value={form.preferredTimeSlot} onChange={handleChange('preferredTimeSlot')} disabled={!form.preferredDate}>
                      <option value="">{form.preferredDate ? 'Select a time slot' : 'Pick a date first'}</option>
                      {visibleSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </Select>
                    {form.preferredDate && availableSlots !== null && visibleSlots.length === 0 && (
                      <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '6px' }}>
                        No slots available this day - please pick another date.
                      </p>
                    )}
                  </Field>

                  <div className="booking-step-actions">
                    {stepIndex > 0 && <Button variant="ghost" onClick={goBack}>Back</Button>}
                    <Button size="lg" style={{ flex: 1 }} onClick={goNext}>
                      Continue <Icon name="arrow-right" size={18} />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 'details' && (
                <div>
                  <IconBadge name="calendar" />
                  <h2 className="section-title">Your Details</h2>

                  <Field label="Your Name" required htmlFor="patientName">
                    <input id="patientName" className="ui-input" value={form.patientName} onChange={handleChange('patientName')} />
                  </Field>

                  <Field label="Phone Number" required htmlFor="patientPhone">
                    <input id="patientPhone" className="ui-input" type="tel" value={form.patientPhone} onChange={handleChange('patientPhone')} />
                  </Field>

                  <Field label="Email" htmlFor="email">
                    <input id="email" className="ui-input" type="email" value={form.email} onChange={handleChange('email')} />
                  </Field>

                  <Field label="Reason for visit" htmlFor="reason">
                    <textarea id="reason" className="ui-textarea" rows={3} value={form.reason} onChange={handleChange('reason')} />
                  </Field>

                  <div className="booking-step-actions">
                    <Button variant="ghost" onClick={goBack}>Back</Button>
                    <Button size="lg" style={{ flex: 1 }} onClick={goNext}>
                      Continue <Icon name="arrow-right" size={18} />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 'confirm' && (
                <form onSubmit={handleSubmit}>
                  <IconBadge name="check-circle" />
                  <h2 className="section-title">Confirm &amp; Pay</h2>
                  <p className="text-muted" style={{ marginTop: '-12px', marginBottom: '20px' }}>
                    A consultation fee of {CONSULTATION_FEE_DISPLAY} is collected online to confirm your slot.
                  </p>

                  <div className="booking-summary">
                    <div className="booking-summary-row"><span>Doctor</span><strong>{selectedDoctor ? selectedDoctor.name : '-'}</strong></div>
                    <div className="booking-summary-row"><span>Date</span><strong>{formatDateLong(form.preferredDate)}</strong></div>
                    <div className="booking-summary-row"><span>Time</span><strong>{selectedSlotLabel || '-'}</strong></div>
                    <div className="booking-summary-row"><span>Name</span><strong>{form.patientName}</strong></div>
                    <div className="booking-summary-row"><span>Phone</span><strong>{form.patientPhone}</strong></div>
                    {form.reason && <div className="booking-summary-row"><span>Reason</span><strong>{form.reason}</strong></div>}
                  </div>

                  <Button type="submit" size="lg" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Processing...' : `Pay ${CONSULTATION_FEE_DISPLAY} & Request Appointment`}
                  </Button>
                  {/* Reassurance right at the point of payment - a first-time patient
                      paying a small clinic online has no prior trust signal to lean
                      on, and the actual mechanics (webhook-verified, auto-confirmed,
                      WhatsApp notified) already happen instantly - just not stated
                      anywhere before this. */}
                  <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="lock" size={13} /> Secure payment &middot; Instant confirmation on WhatsApp
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px', textAlign: 'center' }}>
                    By paying, you agree to our <a href="/terms">Terms & Conditions</a> and <a href="/refund-policy">Refund Policy</a>.
                  </p>

                  <div className="booking-step-actions">
                    <Button type="button" variant="ghost" onClick={goBack} disabled={loading}>Back</Button>
                  </div>
                </form>
              )}
            </>
          )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
