import React, { useState, useEffect } from 'react';
import { useHistory,Link } from 'react-router-dom';
import '../../styles/AddAnteNatal.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const AntenatalDetailsForm = () => {
  const { patientId } = useParams();
  const history = useHistory();

  // Initialize state for antenatal details
  const [antenatalDetails, setAntenatalDetails] = useState({
    patientId: patientId,
    obstetricHistory: '',
    LMP: '',
    expectedDateOfDelivery: '',
    specificHistory: {
      pregnancyComplications: '',
      previousDeliveryBy: ''
    },
    medicalComplications: {
      heartDisease: '',
      lungDisease: '',
      liverDisease: '',
      GIT: '',
      Kidney: '',
      SpineProblem: '',
      Others: ''
    },
    investigations: {
        bloodInvestigation: {
          details: '',
          documents: [] // Array to store documents for blood investigation
        },
        urineInvestigation: {
          details: '',
          documents: [] // Array to store documents for urine investigation
        },
        ultrasoundInvestigation: {
          details: '',
          documents: [] // Array to store documents for ultrasound investigation
        },
        xrayInvestigation: {
          details: '',
          documents: [] // Array to store documents for x-ray investigation
        }
      }
  });

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();

    // Append non-file data to formData
    formData.append('patientId', antenatalDetails.patientId);
    formData.append('obstetricHistory', antenatalDetails.obstetricHistory);
    formData.append('LMP', antenatalDetails.LMP);
    formData.append('expectedDateOfDelivery', antenatalDetails.expectedDateOfDelivery);
    formData.append('specificHistory.pregnancyComplications', antenatalDetails.specificHistory.pregnancyComplications);
    formData.append('specificHistory.previousDeliveryBy', antenatalDetails.specificHistory.previousDeliveryBy);
    formData.append('medicalComplications.heartDisease', antenatalDetails.medicalComplications.heartDisease);
    formData.append('medicalComplications.liverDisease', antenatalDetails.medicalComplications.liverDisease);
    formData.append('medicalComplications.GIT', antenatalDetails.medicalComplications.GIT);
    formData.append('medicalComplications.Kidney', antenatalDetails.medicalComplications.Kidney);
    formData.append('medicalComplications.SpineProblem', antenatalDetails.medicalComplications.SpineProblem);
    formData.append('medicalComplications.Others', antenatalDetails.medicalComplications.Others);

    // Append files to formData
    const investigations = antenatalDetails.investigations;
    for (const key in investigations) {
      if (investigations.hasOwnProperty(key)) {
        formData.append(`investigations.${key}.details`, investigations[key].details);
        investigations[key].documents.forEach((doc) => {
          formData.append(`investigations.${key}.documents`, doc.file);
        });
      }
    }

    try {
      const response = await axios.post('http://localhost:6000/api/antenatal/create', formData, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data'
        }      });
      if (response.status === 201) {
        // Submission successful
        history.push( `/administrator/login/admin_home`); // Redirect to success page
      } else {
        // Handle error response
        const errorData =  response.data;
        console.log(errorData); // Log error response
      }
    } catch (error) {
      console.error('Error submitting antenatal details:', error);
    }
  };
  
  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    console.log('Handling change for:', name);
    console.log('New value:', value);
    // Update state based on input field name
    if (name.startsWith('investigations')) {

        const [category, nestedCategory, nestedProperty] = name.split('.');

        // Check if the input is for documents
        if (nestedProperty === 'details') {
          // Update the state for details of the investigation
          setAntenatalDetails((prevState) => ({
            ...prevState,
            investigations: {
              ...prevState.investigations,
              [nestedCategory]: {
                ...prevState.investigations[nestedCategory],
                [nestedProperty]: value
              }
            }
          }));
        }
    } else if (name.startsWith('medicalComplications')) {
      const [category, subCategory] = name.split('.');
      setAntenatalDetails((prevState) => ({
        ...prevState,
        [category]: {
          ...prevState.medicalComplications,
          [subCategory]: value
        }
      }));
    } else  if (name.startsWith('specificHistory')) {
        const [category, subCategory] = name.split('.');
        
        setAntenatalDetails((prevState) => ({
          ...prevState,
           [category]: {
            ...prevState.specificHistory,
            [subCategory]: value
          }
        }));
      }  else {
      setAntenatalDetails((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };
  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const newDocuments = Array.from(files).map((file) => ({ name: file.name, file }));
    
    const [category, subCategory] = name.split('.');

    const [nestedCategory, nestedProperty] = subCategory.split('.');     
    // Check if the input is for documents
    if (category === 'investigations') {
      // Update the state to append new documents to the specified investigation
      setAntenatalDetails((prevState) => ({
        ...prevState,
        [category]: {
          ...prevState.investigations,
          [nestedCategory]: {
            ...prevState.investigations[nestedCategory],
            documents: [...prevState.investigations[nestedCategory].documents, ...newDocuments]
          }
        }
      }));
    } 
  };

  const removeDocument = (index, name) => {
    const updatedDocuments =  antenatalDetails.investigations[name].documents;
    updatedDocuments.splice(index, 1);
    setAntenatalDetails((prevState) => ({
        ...prevState,
       investigations: {
          ...prevState.investigations,
          [name]: {
            ...prevState.investigations[name],
            documents: updatedDocuments
          }
        }
      }));    
  };
  
  useEffect(() => {
    console.log('Component re-rendered with updated state:', antenatalDetails);
  }, [antenatalDetails]);

  return (
    <div className="background-container">
      <div className="antenatal-details-form-container">
        <h2>Antenatal Details Form</h2>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="patientId" value={patientId} />

          {/* Obstetric History */}
          <div className="form-group">
            <label htmlFor="obstetricHistory">Obstetric History</label>
            <select
              id="obstetricHistory"
              name="obstetricHistory"
              value={antenatalDetails.obstetricHistory}
              onChange={handleChange}
              required
            >
              <option value="">Select Obstetric History</option>
              <option value="G">G</option>
              <option value="P">P</option>
              <option value="A">A</option>
              <option value="L">L</option>
            </select>
          </div>

          {/* LMP */}
          <div className="form-group">
            <label htmlFor="LMP">Last Menstrual Period (LMP)</label>
            <input
              type="date"
              id="LMP"
              name="LMP"
              value={antenatalDetails.LMP}
              onChange={handleChange}
              required
            />
          </div>

          {/* Expected Date of Delivery */}
          <div className="form-group">
            <label htmlFor="expectedDateOfDelivery">Expected Date of Delivery</label>
            <input
              type="date"
              id="expectedDateOfDelivery"
              name="expectedDateOfDelivery"
              value={antenatalDetails.expectedDateOfDelivery}
              onChange={handleChange}
              required
            />
          </div>

          {/* Specific History */}
          <div className="form-group">
            <label htmlFor="pregnancyComplications">Pregnancy Complications</label>
            <input
              type="text"
              id="pregnancyComplications"
              name="specificHistory.pregnancyComplications"
              value={antenatalDetails.specificHistory.pregnancyComplications}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="previousDeliveryBy">Previous Delivery By</label>
            <select
              id="previousDeliveryBy"
              name="specificHistory.previousDeliveryBy"
              value={antenatalDetails.specificHistory.previousDeliveryBy}
              onChange={handleChange}
            >
              <option value="">Select Previous Delivery By</option>
              <option value="Normal">Normal</option>
              <option value="Caesarean">Caesarean</option>
              <option value="Ventouse">Ventouse</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Medical Complications */}
          <div className="form-group">
            <label htmlFor="heartDisease">Heart Disease</label>
            <textarea
              type="text"
              id="heartDisease"
              name="medicalComplications.heartDisease"
              value={antenatalDetails.medicalComplications.heartDisease}
              onChange={handleChange}
            />
          </div>
        
          <div className="form-group">
            <label htmlFor="liverDisease">Liver Disease</label>
            <textarea
              type="text"
              id="liverDisease"
              name="medicalComplications.liverDisease"
              value={antenatalDetails.medicalComplications.liverDisease}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="GIT">GIT</label>
            <textarea
              type="text"
              id="GIT"
              name="medicalComplications.GIT"
              value={antenatalDetails.medicalComplications.GIT}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Kidney">Kidney Disease</label>
            <textarea
              type="text"
              id="Kidney"
              name="medicalComplications.Kidney"
              value={antenatalDetails.medicalComplications.Kidney}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="SpineProblem">Spine Problem</label>
            <textarea
              type="text"
              id="SpineProblem"
              name="medicalComplications.SpineProblem"
              value={antenatalDetails.medicalComplications.SpineProblem}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Others">Other Complications</label>
            <textarea
              type="text"
              id="Others"
              name="medicalComplications.Others"
              value={antenatalDetails.medicalComplications.Others}
              onChange={handleChange}
            />
          </div>

          {/* Blood Investigation */}
          <div className="form-group">
            <label htmlFor="bloodInvestigation">Blood Investigation</label>
            <textarea
    id="bloodInvestigation"
    name="investigations.bloodInvestigation.details"
    value={antenatalDetails.investigations.bloodInvestigation.details}
    onChange={handleChange}
  />

            <label htmlFor="bloodInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="bloodInvestigationDocs"
              name="investigations.bloodInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />

          {/* Display uploaded documents as a list */}
            <div className="uploaded-documents">
            {antenatalDetails.investigations.bloodInvestigation.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span>{doc.name}</span>
                <button type="button" name="bloodInvestigation" className='removeButton' onClick={() => removeDocument(index, "bloodInvestigation")}>
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
    name="investigations.urineInvestigation.details"
    value={antenatalDetails.investigations.urineInvestigation.details}
    onChange={handleChange}
  />

            <label htmlFor="urineInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="urineInvestigationDocs"
              name="investigations.urineInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />

          {/* Display uploaded documents as a list */}
            <div className="uploaded-documents">
            {antenatalDetails.investigations.urineInvestigation.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span>{doc.name}</span>
                <button type="button" name="urineInvestigation"  className='removeButton' onClick={() => removeDocument(index, "urineInvestigation")}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>  
         {/* UltraSound Investigation */}
         <div className="form-group">
            <label htmlFor="ultrasoundInvestigation">UltraSound Investigation</label>
            <textarea
    id="ultrasoundInvestigation"
    name="investigations.ultrasoundInvestigation.details"
    value={antenatalDetails.investigations.ultrasoundInvestigation.details}
    onChange={handleChange}
  />

            <label htmlFor="ultrasoundInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="ultrasoundInvestigationDocs"
              name="investigations.ultrasoundInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />

          {/* Display uploaded documents as a list */}
            <div className="uploaded-documents">
            {antenatalDetails.investigations.ultrasoundInvestigation.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span>{doc.name}</span>
                <button type="button" name="ultrasoundInvestigation"  className='removeButton' onClick={() => removeDocument(index, "ultrasoundInvestigation")}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>  
         {/* X-ray Investigation */}
         <div className="form-group">
            <label htmlFor="xrayInvestigation">X-ray Investigation</label>
            <textarea
    id="xrayInvestigation"
    name="investigations.xrayInvestigation.details"
    value={antenatalDetails.investigations.xrayInvestigation.details}
    onChange={handleChange}
  />

            <label htmlFor="xrayInvestigationDocs">Choose Documents</label>
            <input
              type="file"
              id="xrayInvestigationDocs"
              name="investigations.xrayInvestigation.documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />

          {/* Display uploaded documents as a list */}
            <div className="uploaded-documents">
            {antenatalDetails.investigations.xrayInvestigation.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span>{doc.name}</span>
                <button type="button" name="xrayInvestigation"  className='removeButton' onClick={() => removeDocument(index, "xrayInvestigation")}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>  
          <button type="submit" className="submit-btn">
            Submit Antenatal Details
          </button>
          <Link to="/administrator/login/admin_home" className="cancel-btn">
              Cancel
              </Link>
        </form>
      </div>
    </div>
  );
};

export default AntenatalDetailsForm;
