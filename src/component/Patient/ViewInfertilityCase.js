import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/ViewInfertilityDetails.css'; // Assuming you have specific styles for infertility details

const ViewInfertilityForm = () => {
  const { patientId } = useParams();
  const [infertilityDetails, setInfertilityDetails] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    const fetchInfertilityDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:6000/api/infertility/getByPatientId`, {
          params: {
            patientId: patientId
          }
        });
        if (response.status === 200) {
          setInfertilityDetails(response.data.data);
        } else {
          console.error('Failed to fetch infertility details');
        }
      } catch (error) {
        console.error('Error fetching infertility details:', error);
      }
    };

    fetchInfertilityDetails();
  }, [patientId]);

  const renderInvestigationDocuments = (investigation) => {


    const docs = investigation.split('.').reduce((obj,key)=> {
if (obj && obj[key] !== undefined) {
    return obj[key]; // Access the next nested property
  } else {
    return undefined; // Return undefined if property doesn't exist or obj is null/undefined
  }    }, infertilityDetails).documents;
  console.log(docs);
    //console.log(investigation, infertilityDetails.primaryHistory.investigations.bloodInvestigation);
    return (
      <div className="documents-preview">
        <h4 style={{ color: 'green' }}>Documents</h4>
        {infertilityDetails && docs.length > 0 ? (
          <ul className="document-list" >
            {docs.map((doc, index) => (
              <li key={index}  onClick={() => handleDocumentPreview(doc)}>
                {doc.filename}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'red' }}>No documents uploaded</p>
        )}
      </div>
    );
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
  if (!infertilityDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="background-container">
      <div className="infertility-details-form-container">
        <h2>Infertility Details</h2>

        {/* Primary History */}
        {/* <div className="form-group">
          <label>Primary History:</label>
          <span>{infertilityDetails.primaryHistory}</span>
        </div> */}

        {/* Secondary History */}
        <div className="form-group">
          <label>Obstetric History:</label>
          <span>{infertilityDetails.secondaryHistory.obstetricHistory}</span>
        </div>

        {/* Blood Investigation */}
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

        {/* Ultrasound Investigation */}
        <div className="form-group">
          <label>Ultrasound Investigation:</label>
          <span>{infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.details}</span>
          {renderInvestigationDocuments('primaryHistory.investigations.ultrasoundInvestigation')}
        </div>

        {/* X-ray Investigation */}
        <div className="form-group">
          <label>X-ray Investigation:</label>
          <span>{infertilityDetails.primaryHistory.investigations.xrayInvestigation.details}</span>
          {renderInvestigationDocuments('primaryHistory.investigations.xrayInvestigation')}
        </div>

        {/* Submit Button and Back Link */}
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

export default ViewInfertilityForm;
