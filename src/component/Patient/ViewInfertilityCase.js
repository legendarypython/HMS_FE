import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import Tabs from '../ui/Tabs';
import '../../styles/caseForms.css';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';

// obstetricHistory is four counts (Gravida/Para/Abortus/Living), not a
// single letter - see AnteNatalCases.js/InfertilityCases.js for why.
const formatObstetricHistory = (ob) => (ob ? `G${ob.gravida ?? 0} P${ob.para ?? 0} A${ob.abortus ?? 0} L${ob.living ?? 0}` : '-');

// Exported so AddInfertlityCase.js's edit-mode tabs are always the exact
// same list as this read view's, not two definitions that can drift apart.
export const INFERTILITY_TABS = [
  { key: 'obstetric', label: 'Obstetric History', icon: 'baby' },
  { key: 'investigations', label: 'Investigations', icon: 'file' },
  { key: 'treatments', label: 'Treatments', icon: 'edit' },
];

const ViewInfertilityForm = () => {
  const { patientId } = useParams();
  const [infertilityDetails, setInfertilityDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('obstetric');

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
    // Same gap found and fixed on ViewAnteNatal.js - this used to be a dead
    // end for a patient with no case submitted yet.
    return (
      <div>
        <AppNavbar role={sessionStorage.getItem('userRole')} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">No infertility details have been entered for this patient yet.</div>
          <div className="case-form-actions">
            <Link to={`/patients/add/infertilityForm/${patientId}`}><Button>Add Infertility Details</Button></Link>
            <Link to="/patients"><Button variant="ghost">Back to Patients</Button></Link>
          </div>
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

        <Tabs tabs={INFERTILITY_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'obstetric' && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div className="record-field-label">Obstetric History</div>
            <div className="record-field-value">{formatObstetricHistory(infertilityDetails.secondaryHistory.obstetricHistory)}</div>
          </div>
        )}

        {activeTab === 'investigations' && (
          <>
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
          </>
        )}

        {activeTab === 'treatments' && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div className="record-field-value">{infertilityDetails.treatments || '-'}</div>
          </div>
        )}

        <div className="case-form-actions">
          {/* Carries the tab you were reading via route state, same reasoning
              as ViewAnteNatal.js's own Edit link. */}
          <Link to={{ pathname: `/patients/add/infertilityForm/${patientId}`, state: { initialTab: activeTab } }}>
            <Button>Edit</Button>
          </Link>
          <Link to="/patients"><Button variant="ghost">Back</Button></Link>
        </div>
      </div>

      <DocumentPreviewModal document={previewDocument} onClose={closePreview} />
      </div>
    </div>
  );
};

export default ViewInfertilityForm;
