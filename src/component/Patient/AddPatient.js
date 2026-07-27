import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import Icon from '../ui/Icon';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import './AddPatient.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
const CASE_TYPE_ENUM = { AnteNatal: 1, Infertility: 2, General: 3 };

const AddPatientForm = ({ initialPatientDetails, initialPhone, initialAbhaProfile, initialAbhaIdentifier, onSaved }) => {
  const isEditMode = Boolean(initialPatientDetails);
  const history = useHistory();

  const [form, setForm] = useState(() => ({
    firstName: initialPatientDetails?.firstName || initialAbhaProfile?.firstName || '',
    lastName: initialPatientDetails?.lastName || initialAbhaProfile?.lastName || '',
    husbandFirstName: initialPatientDetails?.husbandFirstName || '',
    husbandLastName: initialPatientDetails?.husbandLastName || '',
    dateOfBirth: initialPatientDetails?.dateOfBirth || initialAbhaProfile?.dateOfBirth || '',
    address: initialPatientDetails?.address || initialAbhaProfile?.address || '',
    aadhar: initialPatientDetails?.aadhar || '',
    phone: initialPatientDetails?.phone || initialPhone || '',
    email: initialPatientDetails?.email || '',
    marriedFor: initialPatientDetails?.marriedFor || '',
    diagnosis: initialPatientDetails?.diagnosis || '',
    dateOfAdmission: initialPatientDetails?.dateOfAdmission ? initialPatientDetails.dateOfAdmission.slice(0, 10) : '',
    caseType: initialPatientDetails ? '' : '',
    isNewPatient: initialPatientDetails ? initialPatientDetails.isNewPatient : true,
    abhaNumber: initialPatientDetails?.abhaNumber || initialAbhaProfile?.abhaNumber || '',
    abhaAddress: initialPatientDetails?.abhaAddress || initialAbhaProfile?.abhaAddress || ''
  }));
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [abhaConflict, setAbhaConflict] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardDownloading, setCardDownloading] = useState(false);
  const [cardError, setCardError] = useState(null);

  // Mandatory-for-Private M1 requirement: "View and Download ABHA details."
  // Only available right after a fresh verification (initialAbhaProfile
  // carries the short-lived xToken from that verify) - re-verifying is
  // needed to download again later, since ABDM doesn't offer a persistent
  // "fetch anytime" credential for this.
  const handleDownloadAbhaCard = async () => {
    setCardError(null);
    setCardDownloading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/abha/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ abhaNumberOrMobile: initialAbhaIdentifier, xToken: initialAbhaProfile?.xToken })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setCardError(errorData.message || 'Could not download ABHA card');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'abha-card.pdf';
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

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setAbhaConflict(null);
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'caseType') return;
        formData.append(key, value);
      });
      formData.set('isNewPatient', form.isNewPatient.toString());
      formData.append('caseTypeEnum', CASE_TYPE_ENUM[form.caseType] || '');
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
            history.push('/dashboard');
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

  return (
    <Card variant="elevated" style={{ maxWidth: 720, margin: '0 auto' }}>
      <IconBadge name="user" />
      <span className="ui-eyebrow">Patient Records</span>
      <h2 className="section-title">{isEditMode ? 'Edit Patient' : 'Add New Patient'}</h2>
      {error && <div className="ui-banner ui-banner-error">{error}</div>}
      {abhaConflict && (
        <div className="ui-banner ui-banner-error">
          This ABHA number is already linked to {abhaConflict.firstName} {abhaConflict.lastName} -{' '}
          <Link to={`/patients/view/${abhaConflict.patientId}`}>view their record</Link> instead of creating a duplicate.
        </div>
      )}
      {success && <div className="ui-banner ui-banner-success">{isEditMode ? 'Patient updated successfully' : 'Patient added successfully'}</div>}

      <form onSubmit={isEditMode ? handleEditSubmit : handleCreateSubmit}>
        <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Personal Details</h3>
        <div className="patient-form-grid">
          <Field label="First Name" required htmlFor="firstName">
            <input className="ui-input" id="firstName" value={form.firstName} onChange={handleChange('firstName')} required />
          </Field>
          <Field label="Last Name" required htmlFor="lastName">
            <input className="ui-input" id="lastName" value={form.lastName} onChange={handleChange('lastName')} required />
          </Field>
          <Field label="Date of Birth" required htmlFor="dateOfBirth">
            <input className="ui-input" type="date" id="dateOfBirth" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} required />
          </Field>
          <Field label="Aadhar Number" required htmlFor="aadhar">
            <input className="ui-input" id="aadhar" value={form.aadhar} onChange={handleChange('aadhar')} required />
          </Field>
          <Field label="Husband's First Name" htmlFor="husbandFirstName">
            <input className="ui-input" id="husbandFirstName" value={form.husbandFirstName} onChange={handleChange('husbandFirstName')} />
          </Field>
          <Field label="Husband's Last Name" htmlFor="husbandLastName">
            <input className="ui-input" id="husbandLastName" value={form.husbandLastName} onChange={handleChange('husbandLastName')} />
          </Field>
          <Field label="Married For (Years)" required htmlFor="marriedFor">
            <input className="ui-input" type="number" id="marriedFor" value={form.marriedFor} onChange={handleChange('marriedFor')} required />
          </Field>
          {form.abhaNumber && (
            <Field label="ABHA Number (Verified)" htmlFor="abhaNumber">
              <input className="ui-input" id="abhaNumber" value={form.abhaNumber} disabled />
            </Field>
          )}
        </div>

        {initialAbhaProfile?.xToken && (
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

        <h3 className="record-section-title">Medical &amp; Admission Details</h3>
        <div className="patient-form-grid">
          <Field label="Date of Admission" required htmlFor="dateOfAdmission">
            <input className="ui-input" type="date" id="dateOfAdmission" value={form.dateOfAdmission} onChange={handleChange('dateOfAdmission')} required />
          </Field>

          {isEditMode ? (
            <Field label="Case Type" htmlFor="caseTypeDisplay">
              <input className="ui-input" id="caseTypeDisplay" value={CASE_TYPE_LABELS[initialPatientDetails.caseType] || ''} disabled />
            </Field>
          ) : (
            <Field label="Case Type" required htmlFor="caseType">
              <select className="ui-select" id="caseType" value={form.caseType} onChange={handleChange('caseType')} required>
                <option value="">Select Case Type</option>
                <option value="AnteNatal">AnteNatal</option>
                <option value="Infertility">Infertility</option>
                <option value="General">General</option>
              </select>
            </Field>
          )}

          <Field label="Diagnosis" htmlFor="diagnosis" className="patient-form-grid-full">
            <textarea className="ui-textarea" id="diagnosis" rows={4} value={form.diagnosis} onChange={handleChange('diagnosis')} />
          </Field>
        </div>

        {!isEditMode && (
          <>
            <h3 className="record-section-title">Documents</h3>
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
        )}

        <label className="ui-checkbox-field" htmlFor="isNewPatient">
          <input type="checkbox" id="isNewPatient" checked={form.isNewPatient} onChange={handleChange('isNewPatient')} />
          <span>Is New Patient</span>
        </label>

        <div className="patient-form-actions">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Next')}</Button>
          <Link to="/dashboard"><Button type="button" variant="ghost">Cancel</Button></Link>
        </div>
      </form>
    </Card>
  );
};

const AddPatientPage = () => (
  <Link to="/patients/add" className="add-patient">Add New</Link>
);

export { AddPatientForm, AddPatientPage };
