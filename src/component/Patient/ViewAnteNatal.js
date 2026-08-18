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

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');

const ViewAntenatalForm = () => {
  const { patientId } = useParams();
  const [antenatalDetails, setAntenatalDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    const fetchAntenatalDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/antenatal/getByPatientId`, {
            params: {
                patientId: patientId
            },
            headers: getAuthHeader()
        });
        setAntenatalDetails(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'No antenatal case found for this patient.');
      } finally {
        setLoading(false);
      }
    };

    fetchAntenatalDetails();
  }, [patientId]);

  const renderInvestigationDocuments = (investigation) => {
    const documents = antenatalDetails.investigations[investigation].documents;
    return documents.length > 0 ? (
      <div className="record-documents">
        {documents.map((doc) => (
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
      // Assuming 'document' contains the necessary information to fetch the document content
      const response = await axios.get(`${API_BASE}/api/documents/${document._id}`, {
        responseType: 'blob', // Set the response type to 'blob' for binary data
        headers: getAuthHeader()
      });

      // Create a URL for the blob content to use in iframe or other elements
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
        <Spinner fullPage label="Loading antenatal details..." />
      </div>
    );
  }

  if (error || !antenatalDetails) {
    return (
      <div>
        <AppNavbar role={sessionStorage.getItem('userRole')} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">{error || 'No antenatal case found for this patient.'}</div>
          <Link to="/patients"><Button variant="ghost">Back to Patients</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar role={sessionStorage.getItem('userRole')} />
      <div className="background-container">
      <div className="antenatal-details-form-container">
        <h2>Antenatal Details</h2>

        <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Obstetric History</h3>
        <div className="record-grid">
          <div><div className="record-field-label">Obstetric History</div><div className="record-field-value">{antenatalDetails.obstetricHistory || '-'}</div></div>
          <div><div className="record-field-label">Last Menstrual Period (LMP)</div><div className="record-field-value">{antenatalDetails.LMP || '-'}</div></div>
          <div><div className="record-field-label">Expected Date of Delivery</div><div className="record-field-value">{formatDate(antenatalDetails.expectedDateOfDelivery)}</div></div>
          <div><div className="record-field-label">Previous Delivery By</div><div className="record-field-value">{antenatalDetails.specificHistory.previousDeliveryBy || '-'}</div></div>
        </div>
        <div style={{ marginTop: 'var(--space-5)' }}>
          <div className="record-field-label">Pregnancy Complications</div>
          <div className="record-field-value">{antenatalDetails.specificHistory.pregnancyComplications || '-'}</div>
        </div>

        <h3 className="record-section-title">Medical History</h3>
        <div className="record-grid">
          <div><div className="record-field-label">Heart Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.heartDisease || '-'}</div></div>
          <div><div className="record-field-label">Liver Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.liverDisease || '-'}</div></div>
          <div><div className="record-field-label">Gastrointestinal Tract (GIT) Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.GIT || '-'}</div></div>
          <div><div className="record-field-label">Kidney Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.Kidney || '-'}</div></div>
          <div><div className="record-field-label">Spine Problem</div><div className="record-field-value">{antenatalDetails.medicalComplications.SpineProblem || '-'}</div></div>
          <div><div className="record-field-label">Other Medical Complications</div><div className="record-field-value">{antenatalDetails.medicalComplications.Others || '-'}</div></div>
        </div>

        <h3 className="record-section-title">Investigations</h3>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Blood Investigation</div>
          <div className="record-field-value">{antenatalDetails.investigations.bloodInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('bloodInvestigation')}
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Urine Investigation</div>
          <div className="record-field-value">{antenatalDetails.investigations.urineInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('urineInvestigation')}
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">Ultrasound Investigation</div>
          <div className="record-field-value">{antenatalDetails.investigations.ultrasoundInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('ultrasoundInvestigation')}
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="record-field-label">X-ray Investigation</div>
          <div className="record-field-value">{antenatalDetails.investigations.xrayInvestigation.details || '-'}</div>
          {renderInvestigationDocuments('xrayInvestigation')}
        </div>

        <Link to="/patients"><Button variant="ghost">Back</Button></Link>
      </div>

      <DocumentPreviewModal document={previewDocument} onClose={closePreview} />
      </div>
    </div>
  );
};

export default ViewAntenatalForm;
