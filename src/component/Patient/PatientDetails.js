import React, { useState, useEffect } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import Tabs from '../ui/Tabs';
import { AddPatientForm, DETAIL_TABS } from './AddPatient';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';
import './PatientDetails.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
const CASE_TYPE_BADGE_VARIANT = { 1: 'primary', 2: 'accent', 3: 'neutral' };

const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

// Only the "contact-ish" fields get an icon - keeps the grid scannable
// instead of every single field competing for attention with one.
const FIELD_ICONS = {
  phone: 'phone',
  email: 'mail',
  address: 'map-pin',
  dob: 'calendar',
  admission: 'calendar',
};

const RecordField = ({ label, value, icon }) => (
  <div className="record-field">
    {icon && <Icon name={icon} size={15} className="record-field-icon" />}
    <div>
      <div className="record-field-label">{label}</div>
      <div className="record-field-value">{value}</div>
    </div>
  </div>
);

const PatientDetails = () => {
  const role = sessionStorage.getItem('userRole');
  const { patientId } = useParams();
  const history = useHistory();
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/patients/${patientId}`, { headers: getAuthHeader() });
      setPatientDetails(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this patient record.');
    }
  };

  useEffect(() => { fetchPatientDetails(); }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDocumentPreview = async (document) => {
    try {
      const response = await axios.get(`${API_BASE}/api/documents/${document._id}`, {
        responseType: 'blob',
        headers: getAuthHeader()
      });
      const documentUrl = URL.createObjectURL(response.data);
      setPreviewDocument({ name: document.filename, url: documentUrl });
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const handleSaved = () => {
    setEditMode(false);
    fetchPatientDetails();
  };

  // Owner-only (matches the backend route). Plain window.confirm, same
  // reasoning as the appointment Delete action - the only two destructive
  // actions in the app, not worth a shared dialog component for just these.
  const handleDelete = async () => {
    if (!window.confirm(`Delete ${patientDetails.firstName} ${patientDetails.lastName}'s record? This can't be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      // axios throws on any non-2xx status, so reaching here means it
      // genuinely succeeded - no separate success flag in this API's
      // response shape to check.
      await axios.delete(`${API_BASE}/api/patients/${patientId}`, { headers: getAuthHeader() });
      history.push('/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this patient.');
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div>
        <AppNavbar role={role} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">{error}</div>
          <Link to="/patients"><Button variant="ghost">Back to Patients</Button></Link>
        </div>
      </div>
    );
  }

  if (!patientDetails) {
    return (
      <div>
        <AppNavbar role={role} />
        <Spinner fullPage label="Loading patient record..." />
      </div>
    );
  }

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        {editMode ? (
          <AddPatientForm
            initialPatientDetails={patientDetails}
            onSaved={handleSaved}
            initialTab={activeTab}
            onPreviewDocument={handleDocumentPreview}
          />
        ) : (
          <Card variant="elevated">
            <div className="patient-detail-header">
              <span className="ui-avatar patient-detail-avatar">
                {getInitials(patientDetails.firstName, patientDetails.lastName)}
              </span>
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>{patientDetails.firstName} {patientDetails.lastName}</h2>
                <Badge variant={CASE_TYPE_BADGE_VARIANT[patientDetails.caseType] || 'neutral'}>
                  {CASE_TYPE_LABELS[patientDetails.caseType] || '-'}
                </Badge>
              </div>
            </div>

            <Tabs tabs={DETAIL_TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'personal' && (
              <div className="record-grid">
                <RecordField label="Date of Birth" value={patientDetails.dateOfBirth} icon={FIELD_ICONS.dob} />
                <RecordField label="Address" value={patientDetails.address} icon={FIELD_ICONS.address} />
                <RecordField label="Aadhar Number" value={patientDetails.aadhar} />
                <RecordField label="Phone Number" value={patientDetails.phone} icon={FIELD_ICONS.phone} />
                <RecordField label="Email" value={patientDetails.email || '-'} icon={FIELD_ICONS.email} />
              </div>
            )}

            {activeTab === 'family' && (
              <div className="record-grid">
                <div className="record-field">
                  <div>
                    <div className="record-field-label">Marital Status</div>
                    <Badge variant={patientDetails.maritalStatus === 'married' ? 'primary' : 'neutral'}>
                      {patientDetails.maritalStatus === 'unmarried' ? 'Unmarried' : 'Married'}
                    </Badge>
                  </div>
                </div>
                {patientDetails.maritalStatus !== 'unmarried' && (
                  <RecordField label="Married For (Years)" value={patientDetails.marriedFor} />
                )}
                <RecordField label="Husband's Name" value={`${patientDetails.husbandFirstName} ${patientDetails.husbandLastName}`} />
              </div>
            )}

            {activeTab === 'visit' && (
              <div className="record-grid">
                <RecordField label="Date of Appointment" value={new Date(patientDetails.dateOfAdmission).toLocaleDateString()} icon={FIELD_ICONS.admission} />
                <div className="record-field">
                  <div>
                    <div className="record-field-label">Patient Status</div>
                    <Badge variant={patientDetails.isNewPatient ? 'primary' : 'neutral'}>
                      {patientDetails.isNewPatient ? 'New' : 'Returning'}
                    </Badge>
                  </div>
                </div>
                <div className="record-field">
                  <div>
                    <div className="record-field-label">Payment Status</div>
                    <Badge variant={patientDetails.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {patientDetails.paymentStatus === 'paid'
                        ? `Paid (${patientDetails.paymentMethod === 'online' ? 'Online' : 'Offline'})`
                        : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              patientDetails.documents && patientDetails.documents.length > 0 ? (
                <div className="record-documents">
                  {patientDetails.documents.map((document) => (
                    <button key={document._id} className="record-document-item" onClick={() => handleDocumentPreview(document)}>
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
              )
            )}

            {/* Diagnosis stays visible regardless of which tab is active - the
                highest-priority clinical info for staff, not something that
                should require a click to see (same reasoning the mockup
                itself uses for its always-visible vitals strip above its own
                tabs). */}
            <div className="record-diagnosis-callout">
              <div className="record-field-label">Diagnosis</div>
              <div className="record-field-value">{patientDetails.diagnosis || '-'}</div>
            </div>

            <div className="patient-detail-actions">
              {role === 'owner' && <Button onClick={() => setEditMode(true)}>Edit</Button>}
              {role === 'owner' && (
                <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Patient'}
                </Button>
              )}
              {patientDetails.caseType === 1 && (
                <Link to={`/patients/view/anteNatalForm/${patientId}`}><Button variant="secondary">View AnteNatal Form</Button></Link>
              )}
              {patientDetails.caseType === 2 && (
                <Link to={`/patients/view/infertilityForm/${patientId}`}><Button variant="secondary">View Infertility Form</Button></Link>
              )}
              <Link to="/patients"><Button variant="ghost">Back</Button></Link>
            </div>
          </Card>
        )}

        <DocumentPreviewModal
          document={previewDocument}
          documents={patientDetails?.documents || []}
          onSelect={handleDocumentPreview}
          onClose={() => setPreviewDocument(null)}
        />
      </div>
    </div>
  );
};

export default PatientDetails;
