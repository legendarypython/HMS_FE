// InfertilityDetailsForm.js

import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '../../styles/AddInfertilityCase.css'; // Assuming you have specific styles for infertility form

const InfertilityDetailsForm = () => {
  const { patientId } = useParams();
  const history = useHistory();

  // Initialize state for infertility details
  const [infertilityDetails, setInfertilityDetails] = useState({
    patientId: patientId,
    primaryHistory: {
      investigations: {
        bloodInvestigation: {
          details: '',
          documents: []
        },
        urineInvestigation: {
          details: '',
          documents: []
        },
        ultrasoundInvestigation: {
          details: '',
          documents: []
        },
        xrayInvestigation: {
          details: '',
          documents: []
        }
      }
    },
    secondaryHistory: {
      obstetricHistory: '',
      investigations: {
        bloodInvestigation: {
          details: '',
          documents: []
        },
        ultrasoundInvestigation: {
          details: '',
          documents: []
        },
        urineInvestigation: {
            details: '',
            documents: []
          },
        xrayInvestigation: {
          details: '',
          documents: []
        }
      }
    }
  });
  useEffect(() => {
    console.log('Component re-rendered with updated state:', infertilityDetails);
  }, [infertilityDetails]);
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      const formData = new FormData();
  
      // Append patientId
      formData.append('patientId', infertilityDetails.patientId);
  
      // Append primary history details and documents
      appendInvestigationDetails(formData, 'primaryHistory', infertilityDetails.primaryHistory);
  
      // Append secondary history details including ObstetricHistory
      formData.append('secondaryHistory.obstetricHistory', infertilityDetails.secondaryHistory.obstetricHistory);
  
      // Append secondary history investigations details and documents
      appendInvestigationDetails(formData, 'secondaryHistory', infertilityDetails.secondaryHistory);
  
      const response = await fetch('http://localhost:6000/api/infertility/create', {
        method: 'POST',
        body: formData
      });
  
      if (response.ok) {
        // Submission successful
        history.push( `/administrator/login/admin_home`); // Redirect to success page
      } else {
        // Handle error response
        const errorData = await response.json();
        console.log(errorData); // Log error response
      }
    } catch (error) {
      console.error('Error submitting infertility details:', error);
    }
  };
  
  // Helper function to append investigation details and documents to FormData
  const appendInvestigationDetails = (formData, historyType, historyDetails) => {
    // Iterate over investigations (blood, urine, ultrasound, xray)
    Object.keys(historyDetails.investigations).forEach((category) => {
      const investigation = historyDetails.investigations[category];
  
      // Append investigation details
      formData.append(`${historyType}.investigations.${category}.details`, investigation.details);
  
      // Append investigation documents
      investigation.documents.forEach((doc) => {
        formData.append(`${historyType}.investigations.${category}.documents`, doc.file);
      });
    });
  };
  
  const handleChange = (event) => {
    const { name, value } = event.target;
  
    // Split the name attribute by '.' to get nested property names
    const nameParts = name.split('.');
  
    // Identify the main category (e.g., primaryHistory or secondaryHistory)
    const mainCategory = nameParts[0];
  
    // Determine the nested property path within the main category
    const nestedPath = nameParts.slice(1); // Exclude the first part (main category)
  
    // Update state based on the main category and nested property path
    setInfertilityDetails((prevState) => ({
      ...prevState,
      [mainCategory]: updateNestedProperty(prevState[mainCategory], nestedPath, value)
    }));
  };
  
  // Helper function to update nested properties dynamically
  const updateNestedProperty = (obj, path, value) => {
    const newObj = { ...obj };
  
    let current = newObj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
  
    current[path[path.length - 1]] = value;
  
    return newObj;
  };
  
  const handleFileChange = (event) => {
    
    const { name, files } = event.target;
    console.log(name);
    const [category, subCategory, nestedCategory] = name.split('.');
    const newDocuments = Array.from(files).map((file) => ({ name: file.name, file }));
    console.log(name,category, subCategory, nestedCategory)
    setInfertilityDetails((prevState) => ({
      ...prevState,
      [category]: {
        ...prevState[category],
        investigations: {
          ...prevState[category].investigations,
          [nestedCategory]: {
            ...prevState[category].investigations[nestedCategory],
            documents: [...prevState[category].investigations[nestedCategory].documents, ...newDocuments]
          }
        }
      }
    }));
  };

  const removeDocument = (index, investigationType) => {
    const updatedDocuments = infertilityDetails.primaryHistory.investigations[investigationType].documents.slice();
    updatedDocuments.splice(index, 1);

    setInfertilityDetails((prevState) => ({
      ...prevState,
      primaryHistory: {
        ...prevState.primaryHistory,
        investigations: {
          ...prevState.primaryHistory.investigations,
          [investigationType]: {
            ...prevState.primaryHistory.investigations[investigationType],
            documents: updatedDocuments
          }
        }
      }
    }));
  };

  return (
    <div className="background-container">
      <div className="infertility-details-form-container">
        <h2>Infertility Details Form</h2>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="patientId" value={patientId} />
          <div className="history-section">
          <h3 style={{color: 'red'}}>Primary History</h3>
          {/* Blood Investigation */}
          <div className="form-group">  
            <label htmlFor="bloodInvestigation">Blood Investigation</label>
            <textarea
              id="bloodInvestigation"
              name="primaryHistory.investigations.bloodInvestigation.details"
              value={infertilityDetails.primaryHistory.investigations.bloodInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="bloodInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="bloodInvestigationDocs"
              name="primaryHistory.investigations.bloodInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.primaryHistory.investigations.bloodInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'bloodInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

            {/* Urine Investigation */}
            <div className="form-group">
            <label htmlFor="urineInvestigation">Urine Investigation</label>
            <textarea
              id="urineInvestigation"
              name="primaryHistory.investigations.urineInvestigation.details"
              value={infertilityDetails.primaryHistory.investigations.urineInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="urineInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="urineInvestigationDocs"
              name="primaryHistory.investigations.urineInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.primaryHistory.investigations.urineInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'urineInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

{/* Ultrasound Investigation */}
<div className="form-group">
            <label htmlFor="ultrasoundInvestigation">UltraSound Investigation</label>
            <textarea
              id="ultrasoundInvestigation"
              name="primaryHistory.investigations.ultrasoundInvestigation.details"
              value={infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="ultrasoundInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="ultrasoundInvestigationDocs"
              name="primaryHistory.investigations.ultrasoundInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'ultrasoundInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

{/* Xray Investigation */}
<div className="form-group">
            <label htmlFor="xrayInvestigation">X-ray Investigation</label>
            <textarea
              id="xrayInvestigation"
              name="primaryHistory.investigations.xrayInvestigation.details"
              value={infertilityDetails.primaryHistory.investigations.xrayInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="xrayInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="xrayInvestigationDocs"
              name="primaryHistory.investigations.xrayInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.primaryHistory.investigations.xrayInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'xrayInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          </div>
           {/* Secondary History Section */}
           <div className="history-section">
            <h3 style={{color: 'red'}}>Secondary History</h3>
            <div className="form-group">
              <label htmlFor="obstetricHistory">Obstetric History</label>
              <select
                id="obstetricHistory"
                name="secondaryHistory.obstetricHistory"
                value={infertilityDetails.secondaryHistory.obstetricHistory}
                onChange={handleChange}
              >
                <option value="">Select Obstetric History</option>
                <option value="G">G</option>
                <option value="P">P</option>
                <option value="A">A</option>
                <option value="L">L</option>
              </select>
            </div>

            {/* Include secondary history investigations here */}
            {/* Blood Investigation */}
            <div className="form-group">
              <label htmlFor="bloodInvestigation">Blood Investigation</label>
              <textarea
                id="bloodInvestigation"
                name="secondaryHistory.investigations.bloodInvestigation.details"
                value={infertilityDetails.secondaryHistory.investigations.bloodInvestigation.details}
                onChange={handleChange}
              />
              <label htmlFor="shbloodInvestigationDocs">Choose Documents</label>
              <input
                type="file"
                id="shbloodInvestigationDocs"
                name="secondaryHistory.investigations.bloodInvestigation.documents"
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
              {/* Display uploaded documents */}
              <div className="uploaded-documents">
                {infertilityDetails.secondaryHistory.investigations.bloodInvestigation.documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <span>{doc.name}</span>
                    <button
                      type="button"
                      className="removeButton"
                      onClick={() => removeDocument(index, 'bloodInvestigation')}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
             {/* Urine Investigation */}
             <div className="form-group">
            <label htmlFor="urineInvestigation">Urine Investigation</label>
            <textarea
              id="urineInvestigation"
              name="secondaryHistory.investigations.urineInvestigation.details"
              value={infertilityDetails.secondaryHistory.investigations.urineInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="shurineInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="shurineInvestigationDocs"
              name="secondaryHistory.investigations.urineInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.secondaryHistory.investigations.urineInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'urineInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

{/* Ultrasound Investigation */}
<div className="form-group">
            <label htmlFor="ultrasoundInvestigation">UltraSound Investigation</label>
            <textarea
              id="ultrasoundInvestigation"
              name="secondaryHistory.investigations.ultrasoundInvestigation.details"
              value={infertilityDetails.secondaryHistory.investigations.ultrasoundInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="shultrasoundInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="shultrasoundInvestigationDocs"
              name="secondaryHistory.investigations.ultrasoundInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.secondaryHistory.investigations.ultrasoundInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'ultrasoundInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

{/* Xray Investigation */}
<div className="form-group">
            <label htmlFor="shxrayInvestigation">X-ray Investigation</label>
            <textarea
              id="xrayInvestigation"
              name="secondaryHistory.investigations.xrayInvestigation.details"
              value={infertilityDetails.secondaryHistory.investigations.xrayInvestigation.details}
              onChange={handleChange}
            />
            <label htmlFor="shxrayInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="shxrayInvestigationDocs"
              name="secondaryHistory.investigations.xrayInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {/* Display uploaded documents */}
            <div className="uploaded-documents">
              {infertilityDetails.secondaryHistory.investigations.xrayInvestigation.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    className='removeButton'
                    onClick={() => removeDocument(index, 'xrayInvestigation')}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Add Submit Button */}
          <button type="submit" className="submit-btn">
            Submit Infertility Details
          </button>
          <Link to="/administrator/login/admin_home" className="cancel-btn">
              Cancel
              </Link>
        </form>
      </div>
    </div>
  );
};

export default InfertilityDetailsForm;
