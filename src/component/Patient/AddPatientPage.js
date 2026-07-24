import React, { useState } from 'react';
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
import './AddPatient.css';
const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };

const AddPatientPageRoute = () => {
  const role = sessionStorage.getItem('userRole');
  const [step, setStep] = useState('phone'); // phone | existing | new
  const [phone, setPhone] = useState('');
  const [existingPatient, setExistingPatient] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        setStep('new');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleStartOver = () => {
    setStep('phone');
    setPhone('');
    setExistingPatient(null);
    setError('');
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
                <Link to="/dashboard"><Button type="button" variant="ghost">Cancel</Button></Link>
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

        {step === 'new' && (
          checking ? <Spinner fullPage label="Checking..." /> : <AddPatientForm initialPhone={phone} />
        )}
      </div>
    </div>
  );
};

export default AddPatientPageRoute;
