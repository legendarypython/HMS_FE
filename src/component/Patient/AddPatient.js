import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Select from '../ui/Select';
import DateInput from '../ui/DateInput';
import IconBadge from '../ui/IconBadge';
import Icon from '../ui/Icon';
import Tabs from '../ui/Tabs';
import StepTracker from '../ui/StepTracker';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import './AddPatient.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
const CASE_TYPE_ENUM = { AnteNatal: 1, Infertility: 2, General: 3 };
// yyyy-mm-dd, local timezone - same pattern already used in BookAppointment
// (its TODAY) and DoctorAvailability (dateStringForOffset), so Date of
// Birth can't be picked in the future without a hardcoded, drifts-by-a-day
// UTC conversion.
const TODAY = new Date().toLocaleDateString('en-CA');

// Exported (not kept local to PatientDetails.js, which imports this file -
// defining it there instead would make a circular import) so the read
// view's tabs, this form's edit-mode tabs, and its create-mode wizard steps
// are always the exact same list, not definitions that can quietly drift
// apart.
const DETAIL_TABS = [
  { key: 'personal', label: 'Personal Info', icon: 'user' },
  { key: 'family', label: 'Family & Marriage', icon: 'heart' },
  { key: 'visit', label: 'Visit & Payment', icon: 'calendar' },
  { key: 'documents', label: 'Documents', icon: 'file' },
];

const AddPatientForm = ({ initialPatientDetails, initialPhone, initialAbhaProfile, initialAbhaIdentifier, initialTab, onPreviewDocument, onSaved }) => {
  const isEditMode = Boolean(initialPatientDetails);
  const history = useHistory();
  const formRef = useRef(null);

  // Real bug this fixes: edit mode used to always be one long flat scroll
  // starting at "Personal Details", no matter which tab you were reading
  // when you clicked Edit - PatientDetails.js passes the tab you were on in
  // as initialTab so this reopens where you actually were, not the top.
  const [editTab, setEditTab] = useState(initialTab || 'personal');

  // Create mode is a guided step-by-step wizard instead - there's no "where
  // you came from" to reopen on, but a brand-new patient record has a lot of
  // fields, and a receptionist asked for the same kind of section structure
  // the read/edit views already have rather than one long scroll. Next
  // validates the *current* step (native reportValidity() on the form only
  // ever sees whichever step's fields are actually mounted, which
  // conveniently scopes it to just that step) before advancing furthestStep,
  // and the StepTracker only lets you click a step you've already reached -
  // free jumping is allowed backward/sideways within that, but not forward
  // past validation, so jumping straight to Documents and hitting Save can't
  // silently skip a required field on an earlier step.
  const [wizardStep, setWizardStep] = useState('personal');
  const [furthestStep, setFurthestStep] = useState(0);

  const activeSection = isEditMode ? editTab : wizardStep;
  const showSection = (tabKey) => activeSection === tabKey;

  const [form, setForm] = useState(() => ({
    firstName: initialPatientDetails?.firstName || initialAbhaProfile?.firstName || '',
    lastName: initialPatientDetails?.lastName || initialAbhaProfile?.lastName || '',
    husbandFirstName: initialPatientDetails?.husbandFirstName || '',
    husbandLastName: initialPatientDetails?.husbandLastName || '',
    dateOfBirth: initialPatientDetails?.dateOfBirth || initialAbhaProfile?.dateOfBirth || '',
    address: initialPatientDetails?.address || initialAbhaProfile?.address || '',
    aadhar: initialPatientDetails?.aadhar || initialAbhaProfile?.aadhar || '',
    phone: initialPatientDetails?.phone || initialPhone || '',
    email: initialPatientDetails?.email || '',
    maritalStatus: initialPatientDetails?.maritalStatus || 'married',
    marriedFor: initialPatientDetails?.marriedFor || '',
    diagnosis: initialPatientDetails?.diagnosis || '',
    dateOfAdmission: initialPatientDetails?.dateOfAdmission ? initialPatientDetails.dateOfAdmission.slice(0, 10) : '',
    caseType: initialPatientDetails ? '' : '',
    isNewPatient: initialPatientDetails ? initialPatientDetails.isNewPatient : true,
    abhaNumber: initialPatientDetails?.abhaNumber || initialAbhaProfile?.abhaNumber || '',
    abhaAddress: initialPatientDetails?.abhaAddress || initialAbhaProfile?.abhaAddress || '',
    paymentStatus: initialPatientDetails?.paymentStatus || 'pending',
    paymentMethod: initialPatientDetails?.paymentMethod || 'offline'
  }));
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [abhaConflict, setAbhaConflict] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardDownloading, setCardDownloading] = useState(false);
  const [cardError, setCardError] = useState(null);
  const errorBannerRef = useRef(null);

  // This form is long enough that the submit button can be well below the
  // fold - a validation error rendered up at the top next to the heading
  // is invisible unless something scrolls it into view, same problem the
  // browser's own native "please fill out this field" tooltip solves for
  // free on plain inputs (caught live: this is what made a missing Case
  // Type selection look like clicking Save Patient did nothing).
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Mandatory-for-Private M1 requirement: "View and Download ABHA details."
  // Only available right after a fresh verification (initialAbhaProfile
  // carries the refreshToken from that verify, exchanged backend-side for
  // a real access token) - re-verifying is needed to download again later,
  // since ABDM doesn't offer a persistent "fetch anytime" credential.
  const handleDownloadAbhaCard = async () => {
    setCardError(null);
    setCardDownloading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/abha/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ abhaNumberOrMobile: initialAbhaIdentifier, refreshToken: initialAbhaProfile?.refreshToken })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setCardError(errorData.message || 'Could not download ABHA card');
        return;
      }
      const blob = await response.blob();
      // Real bug found live: this used to hardcode ".pdf" regardless of
      // the actual file type - the backend serves image/png, so the saved
      // file had the wrong extension and the OS tried to open it with a
      // PDF viewer, which failed. Use the filename the backend already
      // computed correctly (Content-Disposition), falling back to
      // deriving one from the blob's real MIME type if that's ever missing.
      const disposition = response.headers.get('content-disposition') || '';
      const filenameMatch = /filename="([^"]+)"/.exec(disposition);
      const extension = blob.type.includes('png') ? 'png' : blob.type.includes('svg') ? 'svg' : 'pdf';
      const filename = filenameMatch ? filenameMatch[1] : `abha-card.${extension}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setCardError('Network error. Please try again.');
    } finally {
      setCardDownloading(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Original on-load value, not the live form.dateOfAdmission - what the
  // reset below (and the free-followup hint) need to know is "has staff
  // actually moved this visit's date away from the one that was already
  // saved", not "does it currently differ from whatever it was a moment
  // ago".
  const initialDateOfAdmission = initialPatientDetails?.dateOfAdmission
    ? initialPatientDetails.dateOfAdmission.slice(0, 10)
    : '';
  // Fires the paymentStatus/paymentMethod reset (below) at most once per
  // edit session, so a second date tweak after staff has already made a
  // deliberate payment choice doesn't silently wipe it out again.
  const dateResetApplied = useRef(false);

  const handleDateOfAdmissionChange = (e) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, dateOfAdmission: value };
      // Real gap this closes: moving this field forward means "record a
      // new visit" (see the helper text right below the field), but
      // paymentStatus/paymentMethod used to just carry over unchanged from
      // whichever visit was saved last - a patient who paid last time kept
      // showing "Paid" for a visit that hasn't been paid for yet. Reset to
      // the safe default the moment the date first genuinely moves, so
      // staff have to make a fresh call for *this* visit instead of
      // inheriting the old one.
      if (isEditMode && !dateResetApplied.current && value && value !== initialDateOfAdmission) {
        dateResetApplied.current = true;
        next.paymentStatus = 'pending';
        next.paymentMethod = 'offline';
      }
      return next;
    });
  };

  // Same 7-day free-follow-up concept as the online-booking flow's own
  // isEligibleForFreeFollowup (HMS/src/controllers/appointmentController.js),
  // applied here to this patient's real visitHistory - a hint only, never
  // auto-applied, since only staff can judge whether this particular return
  // visit is actually the doctor-agreed free follow-up.
  const FREE_FOLLOWUP_WINDOW_DAYS = 7;
  const priorPaidVisit = isEditMode
    ? (initialPatientDetails.visitHistory || [])
        .filter(v => v.paymentStatus === 'paid' && v.date && v.date.slice(0, 10) < form.dateOfAdmission)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    : null;
  const daysSincePriorPaidVisit = priorPaidVisit && form.dateOfAdmission
    ? Math.round((new Date(form.dateOfAdmission) - new Date(priorPaidVisit.date.slice(0, 10))) / 86400000)
    : null;
  const showFreeFollowupHint = daysSincePriorPaidVisit !== null
    && daysSincePriorPaidVisit >= 0
    && daysSincePriorPaidVisit <= FREE_FOLLOWUP_WINDOW_DAYS;

  const handleFileChange = (event) => {
    const files = event.target.files;
    const newDocuments = Array.from(files).map((file) => ({ name: file.name, file }));
    setDocuments([...documents, ...newDocuments]);
  };

  const removeDocument = (index) => {
    const updated = [...documents];
    updated.splice(index, 1);
    setDocuments(updated);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { caseType, ...editableFields } = form;
      const response = await apiFetch(`${API_BASE}/api/patients/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          data: {
            patientId: initialPatientDetails.patientId,
            ...editableFields
          }
        })
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message || 'Failed to update patient');
        return;
      }
      setSuccess(true);
      if (onSaved) onSaved(json.data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // event is optional - the wizard's own Save Patient button calls this
  // directly (see the real-bug comment on the wizard-nav buttons below)
  // rather than relying on native type="submit" form submission.
  const handleCreateSubmit = async (event) => {
    if (event) event.preventDefault();
    setError(null);
    setAbhaConflict(null);
    // The native <select required> this field used to have enforced this
    // at the browser level for free - the custom Select component (styling
    // fix, see ui/Select.js) doesn't support native constraint validation,
    // so this check has to happen here too (goNext below checks it as the
    // wizard leaves the Visit & Payment step, but this is still the real
    // backstop - the only thing that can't be bypassed). Missing this let a
    // patient get created with no case type at all (caught live in
    // production - the record had to be corrected by hand).
    if (!form.caseType) {
      setError('Please select a case type.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'caseType') return;
        // Backend already guards against this too, but skip it here as well
        // rather than sending a stale/blank number for a field the form
        // itself hides once marital status is "unmarried".
        if (key === 'marriedFor' && form.maritalStatus !== 'married') return;
        formData.append(key, value);
      });
      formData.set('isNewPatient', form.isNewPatient.toString());
      formData.append('caseTypeEnum', CASE_TYPE_ENUM[form.caseType] || '');
      // Display label for this patient's very first diagnosisNotes[] entry
      // (see createPatient) - sessionStorage already has this at login, no
      // need to look up the logged-in user's name server-side for it.
      formData.append('diagnosisAuthor', sessionStorage.getItem('userName') || '');
      documents.forEach((doc) => formData.append('documents', doc.file));

      const response = await apiFetch(`${API_BASE}/api/patients/create`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        const newPatientId = responseData.patient.patientId;
        setSuccess(true);
        setDocuments([]);
        switch (form.caseType) {
          case 'AnteNatal':
            history.push(`/patients/add/anteNatalForm/${newPatientId}`);
            break;
          case 'Infertility':
            history.push(`/patients/add/infertilityForm/${newPatientId}`);
            break;
          default:
            history.push('/patients');
            break;
        }
      } else {
        const errorData = await response.json();
        if (response.status === 409 && errorData.data?.existingPatient) {
          setAbhaConflict(errorData.data.existingPatient);
        } else {
          setError(errorData.message || 'Failed to add patient');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const wizardStepIndex = DETAIL_TABS.findIndex((s) => s.key === wizardStep);
  const isLastWizardStep = wizardStepIndex === DETAIL_TABS.length - 1;

  // Native reportValidity() only ever inspects whichever fields are
  // currently mounted - since only the active step's inputs render at a
  // time, this naturally scopes validation to just this step without any
  // manual per-field bookkeeping.
  const goNext = () => {
    if (formRef.current && !formRef.current.reportValidity()) return;
    if (wizardStep === 'visit' && !form.caseType) {
      setError('Please select a case type.');
      return;
    }
    setError(null);
    const nextIndex = wizardStepIndex + 1;
    setFurthestStep((f) => Math.max(f, nextIndex));
    setWizardStep(DETAIL_TABS[nextIndex].key);
  };

  const goBack = () => {
    if (wizardStepIndex > 0) setWizardStep(DETAIL_TABS[wizardStepIndex - 1].key);
  };

  const jumpToStep = (key) => {
    const idx = DETAIL_TABS.findIndex((s) => s.key === key);
    if (idx <= furthestStep) setWizardStep(key);
  };

  const renderPersonalSection = () => (
    <>
      <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Personal Details</h3>
      <div className="patient-form-grid">
        <Field label="First Name" required htmlFor="firstName">
          <input className="ui-input" id="firstName" value={form.firstName} onChange={handleChange('firstName')} required />
        </Field>
        <Field label="Last Name" required htmlFor="lastName">
          <input className="ui-input" id="lastName" value={form.lastName} onChange={handleChange('lastName')} required />
        </Field>
        <Field label="Date of Birth" required htmlFor="dateOfBirth">
          <DateInput id="dateOfBirth" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} max={TODAY} required />
        </Field>
        <Field label="Aadhar Number" required htmlFor="aadhar">
          <input className="ui-input" id="aadhar" value={form.aadhar} onChange={handleChange('aadhar')} required />
        </Field>
        {form.abhaNumber && (
          <Field label="ABHA Number (Verified)" htmlFor="abhaNumber">
            <input className="ui-input" id="abhaNumber" value={form.abhaNumber} disabled />
          </Field>
        )}
        {form.abhaAddress && (
          <Field label="ABHA Address" htmlFor="abhaAddress">
            <input className="ui-input" id="abhaAddress" value={form.abhaAddress} disabled />
          </Field>
        )}
      </div>

      {initialAbhaProfile?.refreshToken && (
        <div style={{ marginBottom: 16 }}>
          {cardError && <div className="ui-banner ui-banner-error">{cardError}</div>}
          <Button type="button" variant="secondary" disabled={cardDownloading} onClick={handleDownloadAbhaCard}>
            {cardDownloading ? 'Downloading...' : 'Download ABHA Card'}
          </Button>
        </div>
      )}

      <h3 className="record-section-title">Contact Details</h3>
      <div className="patient-form-grid">
        <Field label="Phone Number" required htmlFor="phone">
          <input className="ui-input" type="tel" id="phone" pattern="\d{10}" title="10-digit mobile number" value={form.phone} onChange={handleChange('phone')} required />
        </Field>
        <Field label="Email" htmlFor="email">
          <input className="ui-input" type="email" id="email" value={form.email} onChange={handleChange('email')} />
        </Field>
        <Field label="Address" required htmlFor="address" className="patient-form-grid-full">
          <input className="ui-input" id="address" value={form.address} onChange={handleChange('address')} required />
        </Field>
      </div>
    </>
  );

  const renderFamilySection = () => (
    <>
      <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Family &amp; Marriage</h3>
      <div className="patient-form-grid">
        <Field label="Husband's First Name" htmlFor="husbandFirstName">
          <input className="ui-input" id="husbandFirstName" value={form.husbandFirstName} onChange={handleChange('husbandFirstName')} />
        </Field>
        <Field label="Husband's Last Name" htmlFor="husbandLastName">
          <input className="ui-input" id="husbandLastName" value={form.husbandLastName} onChange={handleChange('husbandLastName')} />
        </Field>
        <Field label="Marital Status" required htmlFor="maritalStatus">
          <Select id="maritalStatus" value={form.maritalStatus} onChange={handleChange('maritalStatus')}>
            <option value="married">Married</option>
            <option value="unmarried">Unmarried</option>
          </Select>
        </Field>
        {form.maritalStatus === 'married' && (
          <Field label="Married For (Years)" required htmlFor="marriedFor">
            <input className="ui-input" type="number" id="marriedFor" value={form.marriedFor} onChange={handleChange('marriedFor')} required />
          </Field>
        )}
      </div>
    </>
  );

  const renderVisitSection = () => (
    <>
      <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Medical &amp; Appointment Details</h3>
      <div className="patient-form-grid">
        <Field label="Date of Appointment" required htmlFor="dateOfAdmission">
          <DateInput id="dateOfAdmission" value={form.dateOfAdmission} onChange={isEditMode ? handleDateOfAdmissionChange : handleChange('dateOfAdmission')} required />
          {isEditMode && (
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
              For a returning patient's next visit, update this to today's date instead of creating a new record.
            </p>
          )}
        </Field>

        {showFreeFollowupHint && (
          <div className="ui-banner ui-banner-warning patient-form-grid-full">
            Last paid visit was {daysSincePriorPaidVisit === 0 ? 'today' : `${daysSincePriorPaidVisit} day${daysSincePriorPaidVisit === 1 ? '' : 's'} ago`} ({priorPaidVisit.date.slice(0, 10)}) - within the {FREE_FOLLOWUP_WINDOW_DAYS}-day free follow-up window. If the doctor is waiving this visit, set Payment Status to Paid and Payment Method to Waived below.
          </div>
        )}

        <Field label="Payment Status" htmlFor="paymentStatus">
          <Select id="paymentStatus" value={form.paymentStatus} onChange={handleChange('paymentStatus')}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </Select>
        </Field>

        {form.paymentStatus === 'paid' && (
          <Field label="Payment Method" htmlFor="paymentMethod">
            <Select id="paymentMethod" value={form.paymentMethod} onChange={handleChange('paymentMethod')}>
              <option value="offline">Offline (cash/card at desk)</option>
              <option value="online">Online</option>
              <option value="waived">Waived (Free Follow-up)</option>
            </Select>
          </Field>
        )}

        {isEditMode ? (
          <Field label="Case Type" htmlFor="caseTypeDisplay">
            <input className="ui-input" id="caseTypeDisplay" value={CASE_TYPE_LABELS[initialPatientDetails.caseType] || ''} disabled />
          </Field>
        ) : (
          <Field label="Case Type" required htmlFor="caseType">
            <Select id="caseType" value={form.caseType} onChange={handleChange('caseType')}>
              <option value="">Select Case Type</option>
              <option value="AnteNatal">AnteNatal</option>
              <option value="Infertility">Infertility</option>
              <option value="General">General</option>
            </Select>
          </Field>
        )}

        {/* Create-only - a brand-new patient's initial reason for the visit
            is worth capturing at this same moment, but this becomes their
            first diagnosisNotes[] entry, not an editable flat field.
            Edit mode adds/reads notes from Patient Detail's own Medical
            Notes section instead (a standalone "type and save" action, on
            purpose never bundled with editing payment/visit-date here). */}
        {!isEditMode && (
          <Field label="Diagnosis" htmlFor="diagnosis" className="patient-form-grid-full">
            <textarea className="ui-textarea" id="diagnosis" rows={4} value={form.diagnosis} onChange={handleChange('diagnosis')} />
          </Field>
        )}
      </div>

      <label className="ui-checkbox-field" htmlFor="isNewPatient">
        <input type="checkbox" id="isNewPatient" checked={form.isNewPatient} onChange={handleChange('isNewPatient')} />
        <span>Is New Patient</span>
      </label>
    </>
  );

  const renderDocumentsUploadSection = () => (
    <>
      <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Documents</h3>
      <Field label="Upload Documents" htmlFor="documents">
        <label htmlFor="documents" className="ui-file-upload-label">
          <Icon name="file" size={16} /> Choose Documents
        </label>
        <input type="file" id="documents" multiple onChange={handleFileChange} className="ui-file-upload-input" />
        {documents.map((doc, index) => (
          <div key={index} className="ui-document-chip">
            <Icon name="file" size={16} />
            <span>{doc.name}</span>
            <button type="button" onClick={() => removeDocument(index)}>x</button>
          </div>
        ))}
      </Field>
    </>
  );

  // Edit mode can't attach/remove documents (the update endpoint doesn't
  // accept file uploads) - this tab just lets you get back to what's
  // already here without leaving the edit flow, same preview behavior as
  // the read view via the callback PatientDetails.js passes down.
  const renderDocumentsReadOnlySection = () => (
    <>
      <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Documents</h3>
      {initialPatientDetails.documents && initialPatientDetails.documents.length > 0 ? (
        <div className="record-documents">
          {initialPatientDetails.documents.map((document) => (
            <button
              key={document._id}
              type="button"
              className="record-document-item"
              onClick={() => onPreviewDocument && onPreviewDocument(document)}
            >
              <Icon name="file" size={18} />
              {document.filename}
            </button>
          ))}
        </div>
      ) : (
        <div className="ui-empty-state">
          <Icon name="inbox" size={28} />
          <p>No documents uploaded.</p>
        </div>
      )}
      <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 'var(--space-3)' }}>
        Documents can only be attached when a patient is first added, not from this edit form.
      </p>
    </>
  );

  const banners = (
    <>
      {error && <div className="ui-banner ui-banner-error" ref={errorBannerRef}>{error}</div>}
      {abhaConflict && (
        <div className="ui-banner ui-banner-error">
          This ABHA number is already linked to {abhaConflict.firstName} {abhaConflict.lastName} -{' '}
          <Link to={`/patients/view/${abhaConflict.patientId}`}>view their record</Link> instead of creating a duplicate.
        </div>
      )}
      {success && <div className="ui-banner ui-banner-success">{isEditMode ? 'Patient updated successfully' : 'Patient added successfully'}</div>}
    </>
  );

  if (isEditMode) {
    return (
      <Card variant="elevated" style={{ maxWidth: 720, margin: '0 auto' }}>
        <IconBadge name="user" />
        <span className="ui-eyebrow">Patient Records</span>
        <h2 className="section-title">Edit Patient</h2>
        {banners}
        <Tabs tabs={DETAIL_TABS} active={editTab} onChange={setEditTab} />
        <form onSubmit={handleEditSubmit}>
          {showSection('personal') && renderPersonalSection()}
          {showSection('family') && renderFamilySection()}
          {showSection('visit') && renderVisitSection()}
          {showSection('documents') && renderDocumentsReadOnlySection()}
          <div className="patient-form-actions">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Link to="/patients"><Button type="button" variant="ghost">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="wizard-layout">
      <div className="wizard-tracker-col">
        <StepTracker steps={DETAIL_TABS} active={wizardStep} furthestStep={furthestStep} onChange={jumpToStep} />
      </div>
      <Card variant="elevated" className="wizard-card">
        <IconBadge name="user" />
        <span className="ui-eyebrow">Patient Records</span>
        <h2 className="section-title">Add New Patient</h2>
        {banners}
        <form ref={formRef} onSubmit={handleCreateSubmit}>
          {showSection('personal') && renderPersonalSection()}
          {showSection('family') && renderFamilySection()}
          {showSection('visit') && renderVisitSection()}
          {showSection('documents') && renderDocumentsUploadSection()}

          <div className="wizard-nav">
            <Button type="button" variant="ghost" onClick={goBack} disabled={wizardStepIndex === 0}>
              <Icon name="arrow-left" size={16} /> Previous
            </Button>
            {/* Real bug found live: this used to be type="submit" on the last
                step. React reuses the same <button> DOM node across a
                re-render at the same JSX position, so the instant Next's
                click handler advanced wizardStep to the last step,
                isLastWizardStep flipped true and React mutated THAT SAME
                node's type from "button" to "submit" mid-click - the
                browser then ran ITS native default action (form submit)
                against the now-submit-typed node, since that's evaluated
                after React's own synchronous re-render commits. One click
                silently created a real patient a step early. Always
                type="button" now; the last step calls handleCreateSubmit
                directly instead of trusting native submit semantics. */}
            <Button type="button" onClick={isLastWizardStep ? () => handleCreateSubmit() : goNext} disabled={saving}>
              {isLastWizardStep ? (saving ? 'Saving...' : 'Save Patient') : 'Next'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const AddPatientPage = () => (
  <Link to="/patients/add" className="add-patient">Add New</Link>
);

export { AddPatientForm, AddPatientPage, DETAIL_TABS };
