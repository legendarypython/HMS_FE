import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import IconBadge from '../ui/IconBadge';
import { AddPatientForm } from './AddPatient';
import AddDocumentsUploader from './AddDocumentsUploader';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import { TENANT_ID } from '../../config/tenant';
import './AddPatient.css';
const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };

const AddPatientPageRoute = () => {
  const role = sessionStorage.getItem('userRole');
  const [step, setStep] = useState('phone'); // phone | existing | abha | new
  const [phone, setPhone] = useState('');
  const [existingPatient, setExistingPatient] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const [abhaSubStep, setAbhaSubStep] = useState('input'); // input | otp | select-account
  const [abhaIdentifier, setAbhaIdentifier] = useState('');
  const [abhaOtp, setAbhaOtp] = useState('');
  const [abhaTxnId, setAbhaTxnId] = useState('');
  const [abhaProfile, setAbhaProfile] = useState(null);
  const [abhaError, setAbhaError] = useState('');
  const [abhaLoading, setAbhaLoading] = useState(false);
  const [abhaAccounts, setAbhaAccounts] = useState([]);
  const [abhaTransferToken, setAbhaTransferToken] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  // Creating a brand-new ABHA (patient doesn't have one yet) is a separate
  // flow from verifying an existing one above - own mode/sub-step/state so
  // the two don't interfere with each other.
  const [abhaMode, setAbhaMode] = useState('verify'); // verify | create
  const [createAadhaar, setCreateAadhaar] = useState('');
  // consent -> input -> mobile-otp (only if communication mobile isn't the
  // Aadhaar-linked one) -> otp -> address-picker
  const [createSubStep, setCreateSubStep] = useState('consent');
  const [createOtp, setCreateOtp] = useState('');
  const [createTxnId, setCreateTxnId] = useState('');
  const [createConsentAgreed, setCreateConsentAgreed] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpTxnId, setMobileOtpTxnId] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [customAddress, setCustomAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [pendingAbhaProfile, setPendingAbhaProfile] = useState(null);

  // Per ABDM's resend requirement: at most 2 resends, each gated by a
  // 60-second cooldown after the previous send.
  useEffect(() => {
    if (resendSecondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setChecking(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/patients/check-phone?phone=${phone}`, { headers: getAuthHeader() });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Could not check this number');
        return;
      }
      if (json.data.exists) {
        setExistingPatient(json.data.patient);
        setStep('existing');
      } else if (TENANT_ID === 'demo') {
        setAbhaIdentifier(phone);
        setStep('abha');
      } else {
        // ABDM/ABHA verify-or-create hasn't cleared M1 certification (see
        // PROGRESS.md) - demo tenant only, same reasoning as /scan-qr. Real
        // patient registration must keep working regardless, so skip
        // straight to the manual form instead of blocking this page - the
        // backend route guard (requireDemoTenant on abhaRoutes) is the real
        // enforcement if this is ever bypassed.
        setStep('new');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleAbhaRequestOtp = async (e) => {
    e.preventDefault();
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ abhaNumberOrMobile: abhaIdentifier }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'Could not send OTP');
        return;
      }
      setAbhaTxnId(json.data?.txnId || '');
      setAbhaSubStep('otp');
      setResendCount(0);
      setResendSecondsLeft(60);
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleAbhaResendOtp = async () => {
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ abhaNumberOrMobile: abhaIdentifier }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'Could not resend OTP');
        return;
      }
      setAbhaTxnId(json.data?.txnId || '');
      setResendCount((c) => c + 1);
      setResendSecondsLeft(60);
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleAbhaVerifyOtp = async (e) => {
    e.preventDefault();
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ abhaNumberOrMobile: abhaIdentifier, transactionId: abhaTxnId, otp: abhaOtp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'OTP verification failed');
        return;
      }
      if (json.data?.multipleAccounts) {
        setAbhaAccounts(json.data.accounts || []);
        setAbhaTransferToken(json.data.transferToken || '');
        setAbhaTxnId(json.data.txnId || abhaTxnId);
        setAbhaSubStep('select-account');
        return;
      }
      setAbhaProfile(json.data || null);
      setStep('new');
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleSelectAccount = async (account) => {
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ transferToken: abhaTransferToken, txnId: abhaTxnId, account }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'Could not confirm ABHA selection');
        return;
      }
      setAbhaProfile(json.data || null);
      setStep('new');
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleAbhaSkip = () => {
    setAbhaProfile(null);
    setStep('new');
  };

  // CRT_ABHA_109 (Mandatory): the ABDM request-otp response names the
  // masked last 4 digits of the Aadhaar-linked mobile ("...ending with
  // ******1234") - compared against the communication mobile (`phone`,
  // already collected) to decide whether it needs its own separate OTP
  // verification before being attached to the new account, or whether it
  // can skip straight through (CRT_ABHA_108's optional shortcut, since
  // Aadhaar OTP verification already proves control of that number).
  const mobileNeedsOwnVerification = (message) => {
    const match = /(\d{4})\s*$/.exec((message || '').replace(/[^\d\s]/g, ' ').trim());
    const lastFour = match ? match[1] : '';
    return !lastFour || lastFour !== phone.slice(-4);
  };

  const handleCreateRequestOtp = async (e) => {
    e.preventDefault();
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/enrol/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ aadhaarNumber: createAadhaar }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'Could not send OTP');
        return;
      }
      const aadhaarTxnId = json.data?.txnId || '';
      setCreateTxnId(aadhaarTxnId);
      setResendCount(0);
      setResendSecondsLeft(60);
      if (mobileNeedsOwnVerification(json.data?.message)) {
        // Pass the just-fetched txnId directly rather than relying on
        // createTxnId from state - setCreateTxnId above doesn't apply
        // synchronously, so reading state here would still see the stale
        // (empty) value from before this render. Bug found live: the
        // backend correctly rejected the resulting empty enrollmentTxnId.
        await requestMobileOtp(aadhaarTxnId);
      } else {
        setCreateSubStep('otp');
      }
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const requestMobileOtp = async (enrollmentTxnId = createTxnId) => {
    const res = await apiFetch(`${API_BASE}/api/abha/enrol/mobile/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ mobile: phone, enrollmentTxnId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setAbhaError(json.message || 'Could not send OTP to communication mobile');
      return;
    }
    setMobileOtpTxnId(json.data?.txnId || '');
    setCreateSubStep('mobile-otp');
  };

  const handleMobileVerifyOtp = async (e) => {
    e.preventDefault();
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/enrol/mobile/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ transactionId: mobileOtpTxnId, otp: mobileOtp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'Mobile verification failed');
        return;
      }
      // The Aadhaar OTP (from the earlier request-otp call) was already
      // dispatched and is still pending entry - this just moves on to
      // asking for it now that the communication mobile is verified too.
      setCreateSubStep('otp');
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleCreateResendOtp = async () => {
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/enrol/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ aadhaarNumber: createAadhaar }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'Could not resend OTP');
        return;
      }
      setCreateTxnId(json.data?.txnId || '');
      setResendCount((c) => c + 1);
      setResendSecondsLeft(60);
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleCreateVerifyOtp = async (e) => {
    e.preventDefault();
    setAbhaError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/enrol/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ transactionId: createTxnId, otp: createOtp, mobile: phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAbhaError(json.message || 'ABHA creation failed');
        return;
      }
      // ABDM never echoes the raw Aadhaar number back in any response (by
      // design - it's masked/withheld for privacy) - the only place it
      // exists is what staff already typed in to start this flow, so
      // carry it through here rather than leaving the patient form's
      // Aadhar field empty after an otherwise fully auto-filled profile.
      const profile = json.data ? { ...json.data, aadhar: createAadhaar } : null;
      setPendingAbhaProfile(profile);

      // CRT_ABHA_112 (Mandatory for Private): offer suggestions instead of
      // silently keeping the default ABDM just auto-assigned. Best-effort -
      // if suggestions can't be fetched for any reason, don't block the
      // whole registration on it, just proceed with the default address.
      try {
        const suggestRes = await apiFetch(`${API_BASE}/api/abha/enrol/address-suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ transactionId: createTxnId }),
        });
        const suggestJson = await suggestRes.json();
        if (suggestRes.ok && Array.isArray(suggestJson.data?.abhaAddressList) && suggestJson.data.abhaAddressList.length > 0) {
          setAddressSuggestions(suggestJson.data.abhaAddressList);
          setCreateSubStep('address-picker');
          return;
        }
      } catch (suggestErr) {
        // fall through to finishing with the default address
      }
      setAbhaProfile(profile);
      setStep('new');
    } catch (err) {
      setAbhaError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const finishWithAddress = (abhaAddress) => {
    const profile = { ...pendingAbhaProfile, abhaAddress };
    setAbhaProfile(profile);
    setStep('new');
  };

  const handleChooseAddress = async (address) => {
    setAddressError('');
    setAbhaLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/abha/enrol/address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ transactionId: createTxnId, abhaAddress: address }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddressError(json.message || 'Could not set ABHA address');
        return;
      }
      finishWithAddress(address);
    } catch (err) {
      setAddressError('Network error. Please try again.');
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleKeepDefaultAddress = () => {
    finishWithAddress(pendingAbhaProfile?.abhaAddress);
  };

  const handleStartOver = () => {
    setStep('phone');
    setPhone('');
    setExistingPatient(null);
    setError('');
    setAbhaSubStep('input');
    setAbhaIdentifier('');
    setAbhaOtp('');
    setAbhaTxnId('');
    setAbhaProfile(null);
    setAbhaError('');
    setResendCount(0);
    setResendSecondsLeft(0);
    setAbhaAccounts([]);
    setAbhaTransferToken('');
    setAbhaMode('verify');
    setCreateAadhaar('');
    setCreateSubStep('consent');
    setCreateOtp('');
    setCreateTxnId('');
    setCreateConsentAgreed(false);
    setMobileOtp('');
    setMobileOtpTxnId('');
    setAddressSuggestions([]);
    setCustomAddress('');
    setAddressError('');
    setPendingAbhaProfile(null);
  };

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        {step === 'phone' && (
          <Card variant="elevated" style={{ maxWidth: 480, margin: '0 auto' }}>
            <IconBadge name="user" />
            <span className="ui-eyebrow">Patient Records</span>
            <h2 className="section-title">Add New Patient</h2>
            <p className="text-muted" style={{ marginTop: -8, marginBottom: 24 }}>
              Enter the patient's mobile number first - we'll check whether they already have a record.
            </p>
            <form onSubmit={handlePhoneSubmit}>
              {error && <div className="ui-banner ui-banner-error">{error}</div>}
              <Field label="Mobile Number" required htmlFor="checkPhone">
                <input
                  id="checkPhone"
                  className="ui-input"
                  type="tel"
                  pattern="\d{10}"
                  title="10-digit mobile number"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </Field>
              <div className="patient-form-actions">
                <Button type="submit" disabled={checking}>{checking ? 'Checking...' : 'Continue'}</Button>
                <Link to="/patients"><Button type="button" variant="ghost">Cancel</Button></Link>
              </div>
            </form>
          </Card>
        )}

        {step === 'existing' && existingPatient && (
          <Card variant="elevated" style={{ maxWidth: 640, margin: '0 auto' }}>
            <span className="ui-eyebrow">Existing Patient Found</span>
            <div className="patient-detail-header">
              <span className="ui-avatar patient-detail-avatar">
                {`${(existingPatient.firstName || '')[0] || ''}${(existingPatient.lastName || '')[0] || ''}`.toUpperCase()}
              </span>
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>{existingPatient.firstName} {existingPatient.lastName}</h2>
                <Badge variant="primary">{CASE_TYPE_LABELS[existingPatient.caseType] || '-'}</Badge>
              </div>
            </div>
            <p className="text-muted">
              A patient with this mobile number already exists. You can add documents to their record,
              {role === 'owner' ? ' edit their details,' : ''} or go back and try a different number.
            </p>

            <div className="record-grid">
              <div><div className="record-field-label">Phone Number</div><div className="record-field-value">{existingPatient.phone}</div></div>
              <div><div className="record-field-label">Address</div><div className="record-field-value">{existingPatient.address}</div></div>
              <div><div className="record-field-label">Date of Admission</div><div className="record-field-value">{new Date(existingPatient.dateOfAdmission).toLocaleDateString()}</div></div>
            </div>

            <h3 className="record-section-title">Add Documents</h3>
            <AddDocumentsUploader patientId={existingPatient.patientId} />

            <div className="patient-form-actions">
              {role === 'owner' && (
                <Link to={`/patients/view/${existingPatient.patientId}`}><Button variant="secondary">Edit Patient</Button></Link>
              )}
              <Link to={`/patients/view/${existingPatient.patientId}`}><Button variant="ghost">View Full Record</Button></Link>
              <Button variant="ghost" onClick={handleStartOver}>Try a Different Number</Button>
            </div>
          </Card>
        )}

        {step === 'abha' && (
          <Card variant="elevated" style={{ maxWidth: 480, margin: '0 auto' }}>
            <IconBadge name="shield" />
            <span className="ui-eyebrow">Patient Records</span>
            <h2 className="section-title">{abhaMode === 'create' ? 'Create ABHA ID (Optional)' : 'Verify ABHA ID (Optional)'}</h2>
            <p className="text-muted" style={{ marginTop: -8, marginBottom: 24 }}>
              {abhaMode === 'create'
                ? "Create a new ABHA using the patient's Aadhaar number - an OTP goes to whatever mobile is linked to that Aadhaar."
                : "No record found for this number. Verify the patient's ABHA number, ABHA address, mobile, or Aadhaar number to auto-fill their details, or skip and enter them manually."}
            </p>

            {abhaMode === 'verify' && abhaSubStep === 'input' && (
              <form onSubmit={handleAbhaRequestOtp}>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                <Field label="ABHA Number, ABHA Address, Mobile, or Aadhaar Number" required htmlFor="abhaIdentifier">
                  <input
                    id="abhaIdentifier"
                    className="ui-input"
                    value={abhaIdentifier}
                    onChange={(e) => setAbhaIdentifier(e.target.value)}
                    autoFocus
                  />
                </Field>
                <div className="patient-form-actions">
                  <Button type="submit" disabled={abhaLoading}>{abhaLoading ? 'Sending...' : 'Send OTP'}</Button>
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85em', marginTop: 12 }}>
                  Patient doesn't have an ABHA yet?{' '}
                  <button type="button" className="link-button" onClick={() => { setAbhaError(''); setAbhaMode('create'); setCreateSubStep('consent'); }}>
                    Create one using Aadhaar
                  </button>
                </p>
              </form>
            )}

            {abhaMode === 'verify' && abhaSubStep === 'otp' && (
              <form onSubmit={handleAbhaVerifyOtp}>
                <p className="login-hint">An OTP was sent to {abhaIdentifier}.</p>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                <Field label="One-Time Password" required htmlFor="abhaOtp">
                  <input
                    id="abhaOtp"
                    className="ui-input"
                    type="text"
                    placeholder="OTP"
                    value={abhaOtp}
                    onChange={(e) => setAbhaOtp(e.target.value)}
                    autoFocus
                  />
                </Field>
                <div className="patient-form-actions">
                  <Button type="submit" disabled={abhaLoading}>{abhaLoading ? 'Verifying...' : 'Verify'}</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={abhaLoading || resendSecondsLeft > 0 || resendCount >= 2}
                    onClick={handleAbhaResendOtp}
                  >
                    {resendSecondsLeft > 0 ? `Resend OTP (${resendSecondsLeft}s)` : 'Resend OTP'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
              </form>
            )}

            {abhaMode === 'verify' && abhaSubStep === 'select-account' && (
              <div>
                <p className="login-hint">This mobile number has {abhaAccounts.length} linked ABHA accounts - select the patient's.</p>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                {abhaAccounts.map((account) => (
                  <Card
                    key={account.ABHANumber}
                    variant="interactive"
                    style={{ marginBottom: 12, cursor: abhaLoading ? 'default' : 'pointer', opacity: abhaLoading ? 0.6 : 1 }}
                    onClick={() => !abhaLoading && handleSelectAccount(account)}
                  >
                    <div className="patient-detail-header" style={{ marginBottom: 0 }}>
                      {account.profilePhoto ? (
                        <img
                          src={`data:image/jpeg;base64,${account.profilePhoto}`}
                          alt={account.name}
                          className="ui-avatar"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="ui-avatar">
                          {`${(account.name || '')[0] || ''}`.toUpperCase()}
                        </span>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{account.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.85em' }}>{account.ABHANumber}</div>
                        {account.preferredAbhaAddress && (
                          <div className="text-muted" style={{ fontSize: '0.85em' }}>{account.preferredAbhaAddress}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                <div className="patient-form-actions">
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
              </div>
            )}

            {abhaMode === 'create' && createSubStep === 'consent' && (
              <div>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                <div
                  className="text-muted"
                  style={{ fontSize: '0.85em', maxHeight: 260, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12 }}
                >
                  I, hereby declare that I am voluntarily sharing my Aadhaar number and demographic information
                  issued by UIDAI, with National Health Authority (NHA) for the sole purpose of creation of ABHA
                  number. I understand that my ABHA number can be used and shared for purposes as may be notified
                  by ABDM from time to time including provision of healthcare services. Further, I am aware that my
                  personal identifiable information (Name, Address, Age, Date of Birth, Gender and Photograph) may
                  be made available to the entities working in the National Digital Health Ecosystem (NDHE) which
                  inter alia includes stakeholders and entities such as healthcare professionals (e.g. doctors),
                  facilities (e.g. hospitals, laboratories) and data fiduciaries (e.g. health programmes), which are
                  registered with or linked to the Ayushman Bharat Digital Mission (ABDM), and various processes
                  there under. I authorize NHA to use my Aadhaar number for performing Aadhaar based authentication
                  with UIDAI as per the provisions of the Aadhaar (Targeted Delivery of Financial and other
                  Subsidies, Benefits and Services) Act, 2016 for the aforesaid purpose. I understand that UIDAI
                  will share my e-KYC details, or response of "Yes" with NHA upon successful authentication. I have
                  been duly informed about the option of using other IDs apart from Aadhaar; however, I consciously
                  choose to use Aadhaar number for the purpose of availing benefits across the NDHE. I am aware that
                  my personal identifiable information excluding Aadhaar number / VID number can be used and shared
                  for purposes as mentioned above. I reserve the right to revoke the given consent at any point of
                  time as per provisions of Aadhaar Act and Regulations.
                </div>
                <label className="ui-checkbox-field" htmlFor="createConsentAgreed">
                  <input
                    type="checkbox"
                    id="createConsentAgreed"
                    checked={createConsentAgreed}
                    onChange={(e) => setCreateConsentAgreed(e.target.checked)}
                  />
                  <span>I agree</span>
                </label>
                <div className="patient-form-actions">
                  <Button
                    type="button"
                    disabled={!createConsentAgreed}
                    onClick={() => setCreateSubStep('input')}
                  >
                    Continue
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
              </div>
            )}

            {abhaMode === 'create' && createSubStep === 'input' && (
              <form onSubmit={handleCreateRequestOtp}>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                <Field label="Aadhaar Number" required htmlFor="createAadhaar">
                  <input
                    id="createAadhaar"
                    className="ui-input"
                    inputMode="numeric"
                    pattern="\d{12}"
                    title="12-digit Aadhaar number"
                    value={createAadhaar}
                    onChange={(e) => setCreateAadhaar(e.target.value)}
                    autoFocus
                  />
                </Field>
                <div className="patient-form-actions">
                  <Button type="submit" disabled={abhaLoading}>{abhaLoading ? 'Sending...' : 'Send OTP'}</Button>
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85em', marginTop: 12 }}>
                  Patient already has an ABHA?{' '}
                  <button type="button" className="link-button" onClick={() => { setAbhaError(''); setAbhaMode('verify'); }}>
                    Verify it instead
                  </button>
                </p>
              </form>
            )}

            {abhaMode === 'create' && createSubStep === 'mobile-otp' && (
              <form onSubmit={handleMobileVerifyOtp}>
                <p className="login-hint">
                  The communication mobile ({phone}) is different from the Aadhaar-linked one - an OTP was sent to
                  it separately to verify it.
                </p>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                <Field label="One-Time Password" required htmlFor="mobileOtp">
                  <input
                    id="mobileOtp"
                    className="ui-input"
                    type="text"
                    placeholder="OTP"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    autoFocus
                  />
                </Field>
                <div className="patient-form-actions">
                  <Button type="submit" disabled={abhaLoading}>{abhaLoading ? 'Verifying...' : 'Verify Mobile'}</Button>
                  <Button type="button" variant="ghost" disabled={abhaLoading} onClick={() => requestMobileOtp()}>Resend OTP</Button>
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
              </form>
            )}

            {abhaMode === 'create' && createSubStep === 'otp' && (
              <form onSubmit={handleCreateVerifyOtp}>
                <p className="login-hint">An OTP was sent to the Aadhaar-linked mobile number.</p>
                {abhaError && <div className="ui-banner ui-banner-error">{abhaError}</div>}
                <Field label="One-Time Password" required htmlFor="createOtp">
                  <input
                    id="createOtp"
                    className="ui-input"
                    type="text"
                    placeholder="OTP"
                    value={createOtp}
                    onChange={(e) => setCreateOtp(e.target.value)}
                    autoFocus
                  />
                </Field>
                <div className="patient-form-actions">
                  <Button type="submit" disabled={abhaLoading}>{abhaLoading ? 'Creating...' : 'Create ABHA'}</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={abhaLoading || resendSecondsLeft > 0 || resendCount >= 2}
                    onClick={handleCreateResendOtp}
                  >
                    {resendSecondsLeft > 0 ? `Resend OTP (${resendSecondsLeft}s)` : 'Resend OTP'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleAbhaSkip}>Skip - Enter Manually</Button>
                </div>
              </form>
            )}

            {abhaMode === 'create' && createSubStep === 'address-picker' && (
              <div>
                <p className="login-hint">
                  ABHA created - default address <strong>{pendingAbhaProfile?.abhaAddress}</strong>. Pick a
                  suggestion below or enter a custom one, or keep the default.
                </p>
                {addressError && <div className="ui-banner ui-banner-error">{addressError}</div>}
                {addressSuggestions.map((address) => (
                  <Card
                    key={address}
                    variant="interactive"
                    style={{ marginBottom: 8, padding: 10, cursor: abhaLoading ? 'default' : 'pointer', opacity: abhaLoading ? 0.6 : 1 }}
                    onClick={() => !abhaLoading && handleChooseAddress(address)}
                  >
                    {address}
                  </Card>
                ))}
                <Field label="Or enter a custom ABHA address" htmlFor="customAddress">
                  <input
                    id="customAddress"
                    className="ui-input"
                    minLength={8}
                    maxLength={18}
                    pattern="^[a-zA-Z0-9]+([._][a-zA-Z0-9]+)*$"
                    title="8-18 characters, letters/numbers with optional single . or _ in the middle"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                  />
                </Field>
                <div className="patient-form-actions">
                  <Button
                    type="button"
                    disabled={abhaLoading || customAddress.length < 8}
                    onClick={() => handleChooseAddress(customAddress)}
                  >
                    Use Custom Address
                  </Button>
                  <Button type="button" variant="ghost" disabled={abhaLoading} onClick={handleKeepDefaultAddress}>
                    Keep Default
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {step === 'new' && (
          checking ? <Spinner fullPage label="Checking..." /> : (
            <AddPatientForm initialPhone={phone} initialAbhaProfile={abhaProfile} initialAbhaIdentifier={abhaIdentifier} />
          )
        )}
      </div>
    </div>
  );
};

export default AddPatientPageRoute;
