import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import { AddPatientForm } from './AddPatient';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';
import './PatientDetails.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };

const PatientDetails = () => {
  const role = sessionStorage.getItem('userRole');
  const { patientId } = useParams();
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editMode, setEditMode] = useState(false);

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

  if (error) {
    return (
      <div>
        <AppNavbar role={role} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">{error}</div>
          <Link to="/dashboard"><Button variant="ghost">Back to Patients</Button></Link>
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
          <AddPatientForm initialPatientDetails={patientDetails} onSaved={handleSaved} />
        ) : (
          <Card>
            <div className="patient-detail-header">
              <h2 className="section-title" style={{ margin: 0 }}>{patientDetails.firstName} {patientDetails.lastName}</h2>
              <Badge variant="primary">{CASE_TYPE_LABELS[patientDetails.caseType] || '-'}</Badge>
            </div>

            <div className="record-grid">
              <div><div className="record-field-label">Husband's Name</div><div className="record-field-value">{patientDetails.husbandFirstName} {patientDetails.husbandLastName}</div></div>
              <div><div className="record-field-label">Date of Birth</div><div className="record-field-value">{patientDetails.dateOfBirth}</div></div>
              <div><div className="record-field-label">Address</div><div className="record-field-value">{patientDetails.address}</div></div>
              <div><div className="record-field-label">Aadhar Number</div><div className="record-field-value">{patientDetails.aadhar}</div></div>
              <div><div className="record-field-label">Phone Number</div><div className="record-field-value">{patientDetails.phone}</div></div>
              <div><div className="record-field-label">Email</div><div className="record-field-value">{patientDetails.email || '-'}</div></div>
              <div><div className="record-field-label">Married For (Years)</div><div className="record-field-value">{patientDetails.marriedFor}</div></div>
              <div><div className="record-field-label">Date of Admission</div><div className="record-field-value">{new Date(patientDetails.dateOfAdmission).toLocaleDateString()}</div></div>
              <div><div className="record-field-label">Is New Patient</div><div className="record-field-value">{patientDetails.isNewPatient ? 'Yes' : 'No'}</div></div>
            </div>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div className="record-field-label">Diagnosis</div>
              <div className="record-field-value">{patientDetails.diagnosis || '-'}</div>
            </div>

            <h3 className="record-section-title">Documents</h3>
            {patientDetails.documents && patientDetails.documents.length > 0 ? (
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
            )}

            <div className="patient-detail-actions">
              {role === 'owner' && <Button onClick={() => setEditMode(true)}>Edit</Button>}
              {patientDetails.caseType === 1 && (
                <Link to={`/patients/view/anteNatalForm/${patientId}`}><Button variant="secondary">View AnteNatal Form</Button></Link>
              )}
              {patientDetails.caseType === 2 && (
                <Link to={`/patients/view/infertilityForm/${patientId}`}><Button variant="secondary">View Infertility Form</Button></Link>
              )}
              <Link to="/dashboard"><Button variant="ghost">Back</Button></Link>
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
