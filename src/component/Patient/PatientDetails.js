import React, { useState, useEffect } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/PatientDetails.css';
import {AddPatientForm} from './AddPatient'; // Import the modified AddPatientForm component

const PatientDetails = () => {
  const { patientId } = useParams();
  const [patientDetails, setPatientDetails] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const history = useHistory();
  const [editMode, setEditMode] = useState(false); // State to manage edit mode

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:6000/api/patients/${patientId}`);
        if (response.status === 200) {
          const data = response.data.data;
          setPatientDetails(data);
          setDocuments(data.documents || []);
        } else {
          console.error('Failed to fetch patient details');
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
      }
    };
  

    fetchPatientDetails();
  }, [patientId]);

 
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
  const handleEdit = () => {
    setEditMode(true); // Enable edit mode
  };

  const handleCancelEdit = () => {
    setEditMode(false); // Disable edit mode
  };
  if (!patientDetails) {
    return <div>Loading...</div>;
  }
 

  return (
    <div className="background-container">
      <div className='form-container'>
        <h2>Patient Details</h2>
    {!editMode && <><div className="patient-details">
                  <div>
                      <label>First Name:</label>
                      <span>{patientDetails.firstName}</span>
                  </div>
                  <div>
                      <label>Last Name:</label>
                      <span>{patientDetails.lastName}</span>
                  </div>
                  <div>
                      <label>Husband's First Name:</label>
                      <span>{patientDetails.husbandFirstName}</span>
                  </div>
                  <div>
                      <label>Husband's Last Name:</label>
                      <span>{patientDetails.husbandLastName}</span>
                  </div>
                  <div>
                      <label>Date of Birth:</label>
                      <span>{patientDetails.dateOfBirth}</span>
                  </div>
                  <div>
                      <label>Address:</label>
                      <span>{patientDetails.address}</span>
                  </div>
                  <div>
                      <label>Aadhar Number:</label>
                      <span>{patientDetails.aadhar}</span>
                  </div>
                  <div>
                      <label>Phone Number:</label>
                      <span>{patientDetails.phone}</span>
                  </div>
                  <div>
                      <label>Email:</label>
                      <span>{patientDetails.email}</span>
                  </div>
                  <div>
                      <label>Married For (Years):</label>
                      <span>{patientDetails.marriedFor}</span>
                  </div>
                  <div>
                      <label>Diagnosis:</label>
                      <span>{patientDetails.diagnosis}</span>
                  </div>
                  <div>
                      <label>Date of Admission:</label>
                      <span>{patientDetails.dateOfAdmission}</span>
                  </div>
                  <div>
                      <label>Case Type:</label>
                      <span>{patientDetails.caseType}</span>
                  </div>
                  <div>
                      <label>Is New Patient:</label>
                      <span>{patientDetails.isNewPatient ? 'Yes' : 'No'}</span>
                  </div>
              </div><div className="documents-preview">
                      <h3>Documents</h3>
                      {documents.length > 0 ? (
                          <ul className="document-list">
                              {documents.map((document, index) => (
                                  <li key={index} onClick={() => handleDocumentPreview(document)}>
                                      {document.filename}
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <p>No documents uploaded.</p>
                      )}
                  </div><button onClick={handleEdit} className='edit-btn'>Edit</button>
        {patientDetails.caseType === 1 &&
        <Link to= {`/patient/view/anteNatalForm/${patientId}`} className="cancel-btn">
          View AnteNatal Form 
        </Link>}
        {
          patientDetails.caseType === 2 &&
          <Link to= {`/patient/view/infertilityForm/${patientId}`} className="cancel-btn">
            View Infertility Form 
          </Link>  
        }
               

      
        <Link to="/administrator/login/admin_home" className="cancel-btn">
          Back
        </Link>
        </> }
        {editMode &&  <AddPatientForm
            initialPatientDetails={patientDetails}
          />}

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

export default PatientDetails;
