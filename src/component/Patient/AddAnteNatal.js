import React, { useState, useEffect, useRef } from 'react';
import { useHistory, Link } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Select from '../ui/Select';
import DateInput from '../ui/DateInput';
import IconBadge from '../ui/IconBadge';
import InvestigationField from './InvestigationField';
import '../../styles/caseForms.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';

const AntenatalDetailsForm = () => {
  const { patientId } = useParams();
  const history = useHistory();
  // Errors used to only go to console.error, so a failed submit (missing
  // obstetric history, or a genuine backend rejection) looked from the
  // user's side like clicking Submit did nothing at all - caught live,
  // this is what actually surfaces it now.
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const errorBannerRef = useRef(null);

  // The submit button sits at the bottom of a long form - a validation
  // error rendered up at the top (next to the heading) is invisible unless
  // something scrolls it into view, same problem the browser's own native
  // "please fill out this field" tooltip solves for free on plain inputs.
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

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
    setError(null);
    // The native <select required> this field used to have enforced this
    // at the browser level for free - the custom Select component (styling
    // fix, see ui/Select.js) doesn't support native constraint validation,
    // so this check has to happen here now instead (same gap found and
    // fixed on AddPatient.js's Case Type field).
    if (!antenatalDetails.obstetricHistory) {
      setError('Please select an obstetric history.');
      return;
    }
    setSaving(true);
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
      const response = await axios.post(`${API_BASE}/api/antenatal/create`, formData, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeader()
        }      });
      if (response.status === 201) {
        // Submission successful
        history.push( `/patients`); // Redirect to the patient list
      } else {
        // Handle error response
        console.error('Error submitting antenatal details:', response.data);
        setError(response.data?.message || 'Could not save antenatal details. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting antenatal details:', err);
      setError(err.response?.data?.message || 'Could not save antenatal details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    // Update state based on input field name
    if (name.startsWith('investigations')) {

        const [, nestedCategory, nestedProperty] = name.split('.');

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

    const [nestedCategory] = subCategory.split('.');
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

  return (
    <div>
      <AppNavbar role={sessionStorage.getItem('userRole')} />
      <div className="background-container">
        <Card variant="elevated" style={{ width: '100%', maxWidth: 680 }}>
          <IconBadge name="baby" />
          <span className="ui-eyebrow">Patient Records</span>
          <h2 className="section-title">Antenatal Details Form</h2>
          {error && <div className="ui-banner ui-banner-error" ref={errorBannerRef}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="patientId" value={patientId} />

            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Obstetric History</h3>
            <Field label="Obstetric History" required htmlFor="obstetricHistory">
              <Select
                id="obstetricHistory"
                name="obstetricHistory"
                value={antenatalDetails.obstetricHistory}
                onChange={handleChange}
              >
                <option value="">Select Obstetric History</option>
                <option value="G">G</option>
                <option value="P">P</option>
                <option value="A">A</option>
                <option value="L">L</option>
              </Select>
            </Field>

            <Field label="Last Menstrual Period (LMP)" required htmlFor="LMP">
              <DateInput
                id="LMP"
                name="LMP"
                value={antenatalDetails.LMP}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Expected Date of Delivery" required htmlFor="expectedDateOfDelivery">
              <DateInput
                id="expectedDateOfDelivery"
                name="expectedDateOfDelivery"
                value={antenatalDetails.expectedDateOfDelivery}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Pregnancy Complications" required htmlFor="pregnancyComplications">
              <input
                className="ui-input"
                type="text"
                id="pregnancyComplications"
                name="specificHistory.pregnancyComplications"
                value={antenatalDetails.specificHistory.pregnancyComplications}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Previous Delivery By" htmlFor="previousDeliveryBy">
              <Select
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
              </Select>
            </Field>

            <h3 className="record-section-title">Medical History</h3>
            <Field label="Heart Disease" htmlFor="heartDisease">
              <textarea
                className="ui-textarea"
                id="heartDisease"
                name="medicalComplications.heartDisease"
                rows={2}
                value={antenatalDetails.medicalComplications.heartDisease}
                onChange={handleChange}
              />
            </Field>

            <Field label="Liver Disease" htmlFor="liverDisease">
              <textarea
                className="ui-textarea"
                id="liverDisease"
                name="medicalComplications.liverDisease"
                rows={2}
                value={antenatalDetails.medicalComplications.liverDisease}
                onChange={handleChange}
              />
            </Field>

            <Field label="Gastrointestinal Tract (GIT) Disease" htmlFor="GIT">
              <textarea
                className="ui-textarea"
                id="GIT"
                name="medicalComplications.GIT"
                rows={2}
                value={antenatalDetails.medicalComplications.GIT}
                onChange={handleChange}
              />
            </Field>

            <Field label="Kidney Disease" htmlFor="Kidney">
              <textarea
                className="ui-textarea"
                id="Kidney"
                name="medicalComplications.Kidney"
                rows={2}
                value={antenatalDetails.medicalComplications.Kidney}
                onChange={handleChange}
              />
            </Field>

            <Field label="Spine Problem" htmlFor="SpineProblem">
              <textarea
                className="ui-textarea"
                id="SpineProblem"
                name="medicalComplications.SpineProblem"
                rows={2}
                value={antenatalDetails.medicalComplications.SpineProblem}
                onChange={handleChange}
              />
            </Field>

            <Field label="Other Medical Complications" htmlFor="Others">
              <textarea
                className="ui-textarea"
                id="Others"
                name="medicalComplications.Others"
                rows={2}
                value={antenatalDetails.medicalComplications.Others}
                onChange={handleChange}
              />
            </Field>

            <h3 className="record-section-title">Investigations</h3>
            <InvestigationField
              label="Blood Investigation"
              id="bloodInvestigation"
              name="investigations.bloodInvestigation.details"
              fileFieldName="investigations.bloodInvestigation.documents"
              value={antenatalDetails.investigations.bloodInvestigation.details}
              onChange={handleChange}
              documents={antenatalDetails.investigations.bloodInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument(index, 'bloodInvestigation')}
            />
            <InvestigationField
              label="Urine Investigation"
              id="urineInvestigation"
              name="investigations.urineInvestigation.details"
              fileFieldName="investigations.urineInvestigation.documents"
              value={antenatalDetails.investigations.urineInvestigation.details}
              onChange={handleChange}
              documents={antenatalDetails.investigations.urineInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument(index, 'urineInvestigation')}
            />
            <InvestigationField
              label="Ultrasound Investigation"
              id="ultrasoundInvestigation"
              name="investigations.ultrasoundInvestigation.details"
              fileFieldName="investigations.ultrasoundInvestigation.documents"
              value={antenatalDetails.investigations.ultrasoundInvestigation.details}
              onChange={handleChange}
              documents={antenatalDetails.investigations.ultrasoundInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument(index, 'ultrasoundInvestigation')}
            />
            <InvestigationField
              label="X-ray Investigation"
              id="xrayInvestigation"
              name="investigations.xrayInvestigation.details"
              fileFieldName="investigations.xrayInvestigation.documents"
              value={antenatalDetails.investigations.xrayInvestigation.details}
              onChange={handleChange}
              documents={antenatalDetails.investigations.xrayInvestigation.documents}
              onFileChange={handleFileChange}
              onRemoveDocument={(index) => removeDocument(index, 'xrayInvestigation')}
            />

            <div className="case-form-actions">
              <Button type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Antenatal Details'}</Button>
              <Link to="/patients"><Button type="button" variant="ghost">Cancel</Button></Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AntenatalDetailsForm;
