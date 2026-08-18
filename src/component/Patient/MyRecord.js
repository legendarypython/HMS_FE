import React, { useState, useEffect } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import './MyRecord.css';
const CASE_TYPE_LABEL = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };

const Field = ({ label, value }) => (
  <div>
    <div className="record-field-label">{label}</div>
    <div className="record-field-value">{value || '-'}</div>
  </div>
);

const MyRecord = () => {
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/patients/me`, { headers: getAuthHeader() })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Could not load your record');
          return;
        }
        setPatient(json.data);
      })
      .catch(() => setError('Something went wrong loading your record'))
      .finally(() => setLoading(false));
  }, []);

  const handleDocumentPreview = async (doc) => {
    const res = await apiFetch(`${API_BASE}/api/documents/${doc._id}`, { headers: getAuthHeader() });
    if (!res.ok) return;
    const blob = await res.blob();
    setPreviewDoc({ name: doc.filename, url: URL.createObjectURL(blob) });
  };

  const initials = patient ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase() : '';

  return (
    <div>
      <AppNavbar role="patient" />
      <div className="page">
        {error && <div className="ui-banner ui-banner-error">{error}</div>}
        {loading && <Spinner label="Loading your record..." />}

        {patient && (
          <Card>
            <div className="record-header">
              <div className="record-avatar">{initials}</div>
              <div>
                <h2>{patient.firstName} {patient.lastName}</h2>
                <Badge variant="primary">{CASE_TYPE_LABEL[patient.caseType] || 'Patient'}</Badge>
              </div>
            </div>

            <div className="record-grid">
              <Field label="Date of Birth" value={patient.dateOfBirth} />
              <Field label="Phone" value={patient.phone} />
              <Field label="Address" value={patient.address} />
              <Field label="Date of Appointment" value={new Date(patient.dateOfAdmission).toLocaleDateString()} />
              <Field label="Diagnosis" value={patient.diagnosis} />
              <Field label="New Patient" value={patient.isNewPatient ? 'Yes' : 'No'} />
            </div>

            <h3 className="record-section-title">Documents</h3>
            {patient.documents && patient.documents.length > 0 ? (
              <div className="record-documents">
                {patient.documents.map((doc) => (
                  <button key={doc._id} className="record-document-item" onClick={() => handleDocumentPreview(doc)}>
                    <Icon name="file" size={18} />
                    {doc.filename}
                  </button>
                ))}
              </div>
            ) : (
              <div className="ui-empty-state">
                <Icon name="inbox" size={28} />
                <p>No documents have been uploaded to your record yet.</p>
              </div>
            )}
          </Card>
        )}

        <DocumentPreviewModal
          document={previewDoc}
          documents={patient?.documents || []}
          onSelect={handleDocumentPreview}
          onClose={() => setPreviewDoc(null)}
        />
      </div>
    </div>
  );
};

export default MyRecord;
