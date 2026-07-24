import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import '../../styles/caseForms.css';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';

const ViewInfertilityForm = () => {
  const { patientId } = useParams();
  const [infertilityDetails, setInfertilityDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    const fetchInfertilityDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/infertility/getByPatientId`, {
          params: {
            patientId: patientId
          },
          headers: getAuthHeader()
        });
        setInfertilityDetails(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'No infertility case found for this patient.');
      } finally {
        setLoading(false);
      }
    };

    fetchInfertilityDetails();
  }, [patientId]);

  const renderInvestigationDocuments = (investigation) => {
    const docs = investigation.split('.').reduce((obj, key) => {
      if (obj && obj[key] !== undefined) {
        return obj[key];
      } else {
        return undefined;
      }
    }, infertilityDetails).documents;

    return docs.length > 0 ? (
      <div className="record-documents">
        {docs.map((doc) => (
          <button key={doc._id} className="record-document-item" onClick={() => handleDocumentPreview(doc)}>
            <Icon name="file" size={18} />
            {doc.filename}
          </button>
        ))}
      </div>
    ) : (
      <p className="text-muted">No documents uploaded</p>
    );
  };

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

  const closePreview = () => {
    setPreviewDocument(null);
  };

  if (loading) {
    return (
      <div>
        <AppNavbar role={sessionStorage.getItem('userRole')} />
        <Spinner fullPage label="Loading infertility details..." />
      </div>
    );
  }

  if (error || !infertilityDetails) {
    return (
      <div>
        <AppNavbar role={sessionStorage.getItem('userRole')} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">{error || 'No infertility case found for this patient.'}</div>
          <Link to="/dashboard"><Button variant="ghost">Back to Patients</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar role={sessionStorage.getItem('userRole')} />
      <div className="background-container">
      <div className="infertility-details-form-container">
        <h2>Infertility Details</h2>

        <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Obstetric History</h3>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Obstetric History</div>
          <div className="record-field-value">{infertilityDetails.secondaryHistory.obstetricHistory || '-'}</div>
        </div>

        <h3 className="record-section-title">Investigations</h3>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Blood Investigation</div>
          <div className="record-field-value">{infertilityDetails.primaryHistory.investigations.bloodInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('primaryHistory.investigations.bloodInvestigation')}
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Urine Investigation</div>
          <div className="record-field-value">{infertilityDetails.primaryHistory.investigations.urineInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('primaryHistory.investigations.urineInvestigation')}
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Ultrasound Investigation</div>
          <div className="record-field-value">{infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('primaryHistory.investigations.ultrasoundInvestigation')}
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">X-ray Investigation</div>
          <div className="record-field-value">{infertilityDetails.primaryHistory.investigations.xrayInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('primaryHistory.investigations.xrayInvestigation')}
        </div>

        <Link to="/dashboard"><Button variant="ghost">Back</Button></Link>
      </div>

      <DocumentPreviewModal document={previewDocument} onClose={closePreview} />
      </div>
    </div>
  );
};

export default ViewInfertilityForm;
