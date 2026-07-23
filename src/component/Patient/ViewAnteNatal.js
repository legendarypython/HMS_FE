import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import '../../styles/caseForms.css';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';

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
    return (
        <div className="documents-preview">
        <h4>Documents</h4>
        {antenatalDetails && antenatalDetails.investigations[investigation].documents.length > 0 ? (
          <ul className="document-list">
            {antenatalDetails.investigations[investigation].documents.map((doc, index) => (
              <li key={index} onClick={() => handleDocumentPreview(doc)}>
                {doc.filename}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No documents uploaded</p>
        )}
      </div>
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
          <Link to="/dashboard"><Button variant="ghost">Back to Patients</Button></Link>
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
        <div className="form-group">
          <label>Obstetric History:</label>
          <span>{antenatalDetails.obstetricHistory}</span>
        </div>
        <div className="form-group">
          <label>Last Menstrual Period (LMP):</label>
          <span>{antenatalDetails.LMP}</span>
        </div>
        <div className="form-group">
          <label>Expected Date of Delivery:</label>
          <span>{antenatalDetails.expectedDateOfDelivery}</span>
        </div>
        <div className="form-group">
          <label>Pregnancy Complications:</label>
          <span>{antenatalDetails.specificHistory.pregnancyComplications}</span>
        </div>
        <div className="form-group">
          <label>Previous Delivery By:</label>
          <span>{antenatalDetails.specificHistory.previousDeliveryBy}</span>
        </div>
        <div className="form-group">
          <label>Heart Disease:</label>
          <span>{antenatalDetails.medicalComplications.heartDisease}</span>
        </div>
        <div className="form-group">
          <label>Liver Disease:</label>
          <span>{antenatalDetails.medicalComplications.liverDisease}</span>
        </div>
        <div className="form-group">
          <label>Gastrointestinal Tract (GIT) Disease:</label>
          <span>{antenatalDetails.medicalComplications.GIT}</span>
        </div>
        <div className="form-group">
          <label>Kidney Disease:</label>
          <span>{antenatalDetails.medicalComplications.Kidney}</span>
        </div>
        <div className="form-group">
          <label>Spine Problem:</label>
          <span>{antenatalDetails.medicalComplications.SpineProblem}</span>
        </div>
        <div className="form-group">
          <label>Other Medical Complications:</label>
          <span>{antenatalDetails.medicalComplications.Others}</span>
        </div>
        <div className="form-group">
          <label>Blood Investigation:</label>
          <span>{antenatalDetails.investigations.bloodInvestigation.details}</span>
          {renderInvestigationDocuments('bloodInvestigation')}
        </div>
        <div className="form-group">
          <label>Urine Investigation:</label>
          <span>{antenatalDetails.investigations.urineInvestigation.details}</span>
          {renderInvestigationDocuments('urineInvestigation')}
        </div>
        <div className="form-group">
          <label>Ultrasound Investigation:</label>
          <span>{antenatalDetails.investigations.ultrasoundInvestigation.details}</span>
          {renderInvestigationDocuments('ultrasoundInvestigation')}
        </div>
        <div className="form-group">
          <label>X-ray Investigation:</label>
          <span>{antenatalDetails.investigations.xrayInvestigation.details}</span>
          {renderInvestigationDocuments('xrayInvestigation')}
        </div>
        <Link to="/dashboard"><Button variant="ghost">Back</Button></Link>
      </div>

      <DocumentPreviewModal document={previewDocument} onClose={closePreview} />
      </div>
    </div>
  );
};

export default ViewAntenatalForm;
