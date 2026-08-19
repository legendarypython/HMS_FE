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

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');
// obstetricHistory is four counts (Gravida/Para/Abortus/Living), not the
// single letter it used to be - see AnteNatalCases.js for why.
const formatObstetricHistory = (ob) => (ob ? `G${ob.gravida ?? 0} P${ob.para ?? 0} A${ob.abortus ?? 0} L${ob.living ?? 0}` : '-');

// Exported so AddAnteNatal.js's edit-mode tabs are always the exact same
// list as this read view's, not two definitions that can drift apart.
export const ANTENATAL_TABS = [
  { key: 'obstetric', label: 'Obstetric History', icon: 'baby' },
  { key: 'medical', label: 'Medical History', icon: 'heart' },
  { key: 'investigations', label: 'Investigations', icon: 'file' },
  { key: 'treatments', label: 'Treatments', icon: 'edit' },
];

const ViewAntenatalForm = () => {
  const { patientId } = useParams();
  const [antenatalDetails, setAntenatalDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('obstetric');

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
    // Real gap found live: this used to be a dead end - a patient with an
    // AnteNatal case type but no submitted case yet (e.g. the original
    // submit silently failed) had no way back in from here, since this was
    // the only link PatientDetails.js offered. Now offers the actual next
    // step instead of just reporting the 404.
    return (
      <div>
        <AppNavbar role={sessionStorage.getItem('userRole')} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">No antenatal details have been entered for this patient yet.</div>
          <div className="case-form-actions">
            <Link to={`/patients/add/anteNatalForm/${patientId}`}><Button>Add Antenatal Details</Button></Link>
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
      <div className="antenatal-details-form-container">
        <h2>Antenatal Details</h2>

        <Tabs tabs={ANTENATAL_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'obstetric' && (
          <>
            <div className="record-grid">
              <div><div className="record-field-label">Obstetric History</div><div className="record-field-value">{formatObstetricHistory(antenatalDetails.obstetricHistory)}</div></div>
              <div><div className="record-field-label">Last Menstrual Period (LMP)</div><div className="record-field-value">{antenatalDetails.LMP || '-'}</div></div>
              <div><div className="record-field-label">Expected Date of Delivery</div><div className="record-field-value">{formatDate(antenatalDetails.expectedDateOfDelivery)}</div></div>
              <div><div className="record-field-label">Previous Delivery By</div><div className="record-field-value">{antenatalDetails.specificHistory.previousDeliveryBy || '-'}</div></div>
            </div>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div className="record-field-label">Pregnancy Complications</div>
              <div className="record-field-value">{antenatalDetails.specificHistory.pregnancyComplications || '-'}</div>
            </div>
          </>
        )}

        {activeTab === 'medical' && (
          <div className="record-grid">
            <div><div className="record-field-label">Heart Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.heartDisease || '-'}</div></div>
            <div><div className="record-field-label">Liver Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.liverDisease || '-'}</div></div>
            <div><div className="record-field-label">Gastrointestinal Tract (GIT) Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.GIT || '-'}</div></div>
            <div><div className="record-field-label">Kidney Disease</div><div className="record-field-value">{antenatalDetails.medicalComplications.Kidney || '-'}</div></div>
            <div><div className="record-field-label">Spine Problem</div><div className="record-field-value">{antenatalDetails.medicalComplications.SpineProblem || '-'}</div></div>
            <div><div className="record-field-label">Other Medical Complications</div><div className="record-field-value">{antenatalDetails.medicalComplications.Others || '-'}</div></div>
          </div>
        )}

        {activeTab === 'investigations' && (
          <>
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
          </>
        )}

        {activeTab === 'treatments' && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div className="record-field-value">{antenatalDetails.treatments || '-'}</div>
          </div>
        )}

        <div className="case-form-actions">
          {/* Carries the tab you were reading via route state (a real page
              navigation, not an in-place swap like PatientDetails.js's own
              Edit - so there's no component state to just pass as a prop) so
              the edit form can reopen on the same section instead of always
              landing on Obstetric History. */}
          <Link to={{ pathname: `/patients/add/anteNatalForm/${patientId}`, state: { initialTab: activeTab } }}>
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

export default ViewAntenatalForm;
