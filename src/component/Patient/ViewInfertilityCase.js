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

    return (
      <div className="documents-preview">
        <h4>Documents</h4>
        {infertilityDetails && docs.length > 0 ? (
          <ul className="document-list">
            {docs.map((doc, index) => (
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

        <div className="form-group">
          <label>Obstetric History:</label>
          <span>{infertilityDetails.secondaryHistory.obstetricHistory}</span>
        </div>

        <div className="form-group">
          <label>Blood Investigation:</label>
          <span>{infertilityDetails.primaryHistory.investigations.bloodInvestigation.details}</span>
          {renderInvestigationDocuments('primaryHistory.investigations.bloodInvestigation')}
        </div>

        <div className="form-group">
          <label>Urine Investigation:</label>
          <span>{infertilityDetails.primaryHistory.investigations.urineInvestigation.details}</span>
          {renderInvestigationDocuments('primaryHistory.investigations.urineInvestigation')}
        </div>

        <div className="form-group">
          <label>Ultrasound Investigation:</label>
          <span>{infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.details}</span>
          {renderInvestigationDocuments('primaryHistory.investigations.ultrasoundInvestigation')}
        </div>

        <div className="form-group">
          <label>X-ray Investigation:</label>
          <span>{infertilityDetails.primaryHistory.investigations.xrayInvestigation.details}</span>
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
