import React, {useState} from 'react';
import { Link, useHistory } from 'react-router-dom';
import '../../styles/AddPatient.css'; // Import your custom CSS file

const AddPatientForm = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [documents, setDocuments] = useState([]); // State to manage uploaded documents
  const [caseType, setCaseType] = useState(''); // State to manage selected case type
  const history = useHistory(); // Access history for navigation

  const handleSubmit = async (event) => {
    setError(null);
        event.preventDefault();
    const formData = new FormData(event.target);
    documents.forEach((doc) => {
      formData.append('documents', doc.file);
    });
    formData.append('caseTypeEnum', mapCaseTypeToEnum(caseType)); // Append caseType to form data
    const isNewPatient = event.target.elements.isNewPatient.checked;

    // Set isNewPatient directly in the FormData object
    formData.set('isNewPatient', isNewPatient.toString()); // Convert to string (true/false)
  
    try {
      const response = await fetch('http://localhost:6000/api/patients/create', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        const newPatientId = responseData.patient.patientId;
        console.log(newPatientId);
        // Form submitted successfully
        setSuccess(true);
        setError(null);
        setDocuments([]);
        switch (caseType) {
          case 'AnteNatal':
            history.push(`/patient/add/anteNatalForm/${newPatientId}`);
            break;
          case 'Infertility':
            history.push(`/patient/add/infertilityForm/${newPatientId}`);
            break;
          
          default:
            setError("Please select correct Case Type");
            history.push( `/administrator/login/admin_home`); // Redirect to success page
            break;
        } // Clear the list of uploaded documents

      } else {
        // Error handling for failed form submission
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add patient');
        setSuccess(false);
      }
    } catch (error) {
      // Network or other errors
      setError('Network error. Please try again.');
      setSuccess(false);
    }
  };
  const mapCaseTypeToEnum = (selectedType) => {
    switch (selectedType) {
      case 'AnteNatal':
        return 1;
      case 'Infertility':
        return 2;
      case 'General':
        return 3;
      default:
        return ''; // Handle default or unknown caseType
    }
  };
  const handleFileChange = (event) => {
    const files = event.target.files;
    const newDocuments = Array.from(files).map((file) => ({ name: file.name, file }));
    setDocuments([...documents, ...newDocuments]);
  };

  const removeDocument = (index) => {
    const updatedDocuments = [...documents];
    updatedDocuments.splice(index, 1);
    setDocuments(updatedDocuments);
  };

  return (
    <div className="background-container">
    <div className="form-container">
      <h2>Add New Patient</h2>
      {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            <span role="img" aria-label="checkmark">
              ✔️
            </span>{' '}
            Patient Added Successfully
          </div>
        )}
      <form onSubmit={handleSubmit}>
        {/* Input fields for patient information */}
        <div className="form-group">
          <label htmlFor="firstName">First Name<span>*</span></label>
          <input type="text" id="firstName" name="firstName" required />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name<span>*</span></label>
          <input type="text" id="lastName" name="lastName" required />
        </div>

        <div className="form-group">
          <label htmlFor="husbandFirstName">Husband's First Name</label>
          <input type="text" id="husbandFirstName" name="husbandFirstName" />
        </div>

        <div className="form-group">
          <label htmlFor="husbandLastName">Husband's Last Name</label>
          <input type="text" id="husbandLastName" name="husbandLastName" />
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth<span>*</span></label>
          <input type="date" id="dateOfBirth" name="dateOfBirth" required />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address<span>*</span></label>
          <input type="text" id="address" name="address" required />
        </div>

        <div className="form-group">
          <label htmlFor="aadhar">Aadhar Number<span>*</span></label>
          <input type="text" id="aadhar" name="aadhar" required />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" />
        </div>

        <div className="form-group">
          <label htmlFor="marriedFor">Married For (Years)<span>*</span></label>
          <input type="number" id="marriedFor" name="marriedFor" required />
        </div>

        <div className="form-group">
          <label htmlFor="diagnosis">Diagnosis</label>
          <textarea id="diagnosis" name="diagnosis" rows="4" cols="50" />
        </div>

        {/* File upload for documents */}
        <div className="form-group">
            <label htmlFor="documents">Choose Documents</label>
            <input
              type="file"
              id="documents"
              name="documents"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {/* Display uploaded documents as a list */}
          <div className="uploaded-documents">
            {documents.map((doc, index) => (
              <div key={index} className="document-item">
                <span>{doc.name}</span>
                <button type="button" onClick={() => removeDocument(index)}>
                  x
                </button>
              </div>
            ))}
          </div>
        <div className="form-group">
          <label htmlFor="dateOfAdmission">Date of Admission<span>*</span></label>
          <input type="date" id="dateOfAdmission" name="dateOfAdmission" required />
        </div>
        <div className="form-group">
            <label htmlFor="caseType">Case Type</label>
            <select
              id="caseType"
              name="caseType"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              required
            >
              <option value="">Select Case Type</option>
              <option value="AnteNatal">AnteNatal</option>
              <option value="Infertility">Infertility</option>
              <option value="General">General</option>
            </select>
          
          </div>

        <div className="form-group">
          <label htmlFor="isNewPatient">Is New Patient<span>*</span></label>
          <input type="checkbox" id="isNewPatient" name="isNewPatient" defaultChecked />
        </div>

        <button type="submit" className="submit-btn">Next</button> {/* Cancel button that navigates to the homepage */}
            <Link to="/administrator/login/admin_home" className="cancel-btn">
              Cancel
              </Link>

      </form>
    </div>
    </div>
  );
};

const AddPatientPage = () => {
  return (
    <div>
      <Link to="/patient/add" className='add-patient'>Add New</Link>
    </div>
  );
};

export { AddPatientForm, AddPatientPage };