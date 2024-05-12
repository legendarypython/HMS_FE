import React, { useState, useEffect } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ViewAnteNatalDetails.css';

const ViewAntenatalForm = () => {
  const { patientId } = useParams();
  const history = useHistory();
  const [antenatalDetails, setAntenatalDetails] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    const fetchAntenatalDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:6000/api/antenatal/getByPatientId`, {
            params: {
                patientId: patientId
            }
        });
        if (response.status === 200) {
            console.log(JSON.stringify(response.data.data));
          setAntenatalDetails(response.data.data);
        } else {
          console.error('Failed to fetch antenatal details');
        }
      } catch (error) {
        console.error('Error fetching antenatal details:', error);
      }
    };

    fetchAntenatalDetails();
  }, [patientId]);

  const renderInvestigationDocuments = (investigation) => {
    return (
        <div className="documents-preview">
        <h4 style={{color: 'green'}}>Documents</h4>
        {antenatalDetails && antenatalDetails.investigations[investigation].documents.length > 0 ? (
          <ul className="document-list">
            {antenatalDetails.investigations[investigation].documents.map((doc, index) => (
              <li key={index} onClick={() => handleDocumentPreview(doc)}>
                {doc.filename}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{color: 'red'}}>No documents uploaded</p>
        )}
      </div>
    );
  };
  const applyStyles = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      const imgElement = iframeDocument.querySelector('img');
      if (imgElement) {
        // Apply styles to the img element
        imgElement.style.width = '100%';
        imgElement.style.height = '100%';
        imgElement.style.objectFit = 'contain'
      }
    }
  };

  const handleDocumentPreview = async (document) => {
    try {
      // Assuming 'document' contains the necessary information to fetch the document content
      const response = await axios.get(`http://localhost:6000/api/documents/${document._id}`, {
        responseType: 'blob' // Set the response type to 'blob' for binary data
      });

      // Create a URL for the blob content to use in iframe or other elements
      const documentUrl = URL.createObjectURL(response.data);
      setPreviewDocument({ name: document.name, url: documentUrl });
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };


  const closePreview = () => {
    setPreviewDocument(null);
  };

  if (!antenatalDetails) {
    return <div>Loading...</div>;
  }

  return (
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
        <Link to="/administrator/login/admin_home" className="cancel-btn">
          Back
        </Link>
      </div>

      {previewDocument && (
        <div className="document-preview-overlay">
          <div className="document-preview-container">
            <button className="close-preview-btn" onClick={closePreview}>
              Close Preview
            </button>
            <iframe src={previewDocument.url} title={previewDocument.name} onLoad={applyStyles} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAntenatalForm;
