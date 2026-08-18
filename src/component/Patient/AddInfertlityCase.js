// InfertilityDetailsForm.js

import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import InvestigationField from './InvestigationField';
import '../../styles/caseForms.css';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';

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

      const response = await apiFetch(`${API_BASE}/api/infertility/create`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });

      if (response.ok) {
        // Submission successful
        history.push( `/patients`); // Redirect to the patient list
      } else {
        // Handle error response
        const errorData = await response.json();
        console.error('Error submitting infertility details:', errorData);
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
    const [category, , nestedCategory] = name.split('.');
    const newDocuments = Array.from(files).map((file) => ({ name: file.name, file }));
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

  // historyType ('primaryHistory' | 'secondaryHistory') is now passed in
  // explicitly - the original always mutated primaryHistory regardless of
  // which section the Remove button was actually clicked in.
  const removeDocument = (historyType, investigationType, index) => {
    const updatedDocuments = infertilityDetails[historyType].investigations[investigationType].documents.slice();
    updatedDocuments.splice(index, 1);

    setInfertilityDetails((prevState) => ({
      ...prevState,
      [historyType]: {
        ...prevState[historyType],
        investigations: {
          ...prevState[historyType].investigations,
          [investigationType]: {
            ...prevState[historyType].investigations[investigationType],
            documents: updatedDocuments
          }
        }
      }
    }));
  };

  return (
    <div>
      <AppNavbar role={sessionStorage.getItem('userRole')} />
      <div className="background-container">
        <Card variant="elevated" style={{ width: '100%', maxWidth: 680 }}>
          <IconBadge name="baby" />
          <span className="ui-eyebrow">Patient Records</span>
          <h2 className="section-title">Infertility Details Form</h2>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="patientId" value={patientId} />

            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Primary History</h3>
            <InvestigationField
              label="Blood Investigation"
              id="primaryBlood"
              name="primaryHistory.investigations.bloodInvestigation.details"
              fileFieldName="primaryHistory.investigations.bloodInvestigation.documents"
              value={infertilityDetails.primaryHistory.investigations.bloodInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.primaryHistory.investigations.bloodInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('primaryHistory', 'bloodInvestigation', index)}
            />
            <InvestigationField
              label="Urine Investigation"
              id="primaryUrine"
              name="primaryHistory.investigations.urineInvestigation.details"
              fileFieldName="primaryHistory.investigations.urineInvestigation.documents"
              value={infertilityDetails.primaryHistory.investigations.urineInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.primaryHistory.investigations.urineInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('primaryHistory', 'urineInvestigation', index)}
            />
            <InvestigationField
              label="Ultrasound Investigation"
              id="primaryUltrasound"
              name="primaryHistory.investigations.ultrasoundInvestigation.details"
              fileFieldName="primaryHistory.investigations.ultrasoundInvestigation.documents"
              value={infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.primaryHistory.investigations.ultrasoundInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('primaryHistory', 'ultrasoundInvestigation', index)}
            />
            <InvestigationField
              label="X-ray Investigation"
              id="primaryXray"
              name="primaryHistory.investigations.xrayInvestigation.details"
              fileFieldName="primaryHistory.investigations.xrayInvestigation.documents"
              value={infertilityDetails.primaryHistory.investigations.xrayInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.primaryHistory.investigations.xrayInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('primaryHistory', 'xrayInvestigation', index)}
            />

            <h3 className="record-section-title">Secondary History</h3>
            <Field label="Obstetric History" htmlFor="obstetricHistory">
              <select
                className="ui-select"
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
            </Field>

            <InvestigationField
              label="Blood Investigation"
              id="secondaryBlood"
              name="secondaryHistory.investigations.bloodInvestigation.details"
              fileFieldName="secondaryHistory.investigations.bloodInvestigation.documents"
              value={infertilityDetails.secondaryHistory.investigations.bloodInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.secondaryHistory.investigations.bloodInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('secondaryHistory', 'bloodInvestigation', index)}
            />
            <InvestigationField
              label="Urine Investigation"
              id="secondaryUrine"
              name="secondaryHistory.investigations.urineInvestigation.details"
              fileFieldName="secondaryHistory.investigations.urineInvestigation.documents"
              value={infertilityDetails.secondaryHistory.investigations.urineInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.secondaryHistory.investigations.urineInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('secondaryHistory', 'urineInvestigation', index)}
            />
            <InvestigationField
              label="Ultrasound Investigation"
              id="secondaryUltrasound"
              name="secondaryHistory.investigations.ultrasoundInvestigation.details"
              fileFieldName="secondaryHistory.investigations.ultrasoundInvestigation.documents"
              value={infertilityDetails.secondaryHistory.investigations.ultrasoundInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.secondaryHistory.investigations.ultrasoundInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('secondaryHistory', 'ultrasoundInvestigation', index)}
            />
            <InvestigationField
              label="X-ray Investigation"
              id="secondaryXray"
              name="secondaryHistory.investigations.xrayInvestigation.details"
              fileFieldName="secondaryHistory.investigations.xrayInvestigation.documents"
              value={infertilityDetails.secondaryHistory.investigations.xrayInvestigation.details}
              onChange={handleChange}
              documents={infertilityDetails.secondaryHistory.investigations.xrayInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument('secondaryHistory', 'xrayInvestigation', index)}
            />

            <div className="case-form-actions">
              <Button type="submit">Submit Infertility Details</Button>
              <Link to="/patients"><Button type="button" variant="ghost">Cancel</Button></Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default InfertilityDetailsForm;
