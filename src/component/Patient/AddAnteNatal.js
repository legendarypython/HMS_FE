import React, { useState, useEffect, useRef } from 'react';
import { useHistory, Link } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Select from '../ui/Select';
import DateInput from '../ui/DateInput';
import IconBadge from '../ui/IconBadge';
import Spinner from '../ui/Spinner';
import InvestigationField from './InvestigationField';
import '../../styles/caseForms.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';

const BLANK_INVESTIGATIONS = {
  bloodInvestigation: { details: '', documents: [] },
  urineInvestigation: { details: '', documents: [] },
  ultrasoundInvestigation: { details: '', documents: [] },
  xrayInvestigation: { details: '', documents: [] },
};

const BLANK_DETAILS = (patientId) => ({
  patientId,
  obstetricHistory: { gravida: '', para: '', abortus: '', living: '' },
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
  investigations: JSON.parse(JSON.stringify(BLANK_INVESTIGATIONS)),
  treatments: '',
});

// Maps a populated Document object (from the backend) into the shape
// InvestigationField already knows how to display ({name, ...}) - existing
// docs are tagged `existing: true` so handleSubmit knows to send their id
// back rather than try to re-upload them (the update endpoint doesn't
// accept file uploads at all, only create does).
const mapExistingDocs = (docs) => (docs || []).map((doc) => ({
  _id: doc._id,
  name: doc.filename,
  existing: true,
}));

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

  // Real gap found live: a patient with an AnteNatal case type but no
  // submitted case yet (e.g. the original submit silently failed) had no
  // way back into this form - "View AnteNatal Form" only ever linked to
  // the read-only view, which 404s if nothing was ever saved, with no
  // fallback. This form now does double duty: loads any existing case for
  // this patientId on mount and switches into edit mode if one exists,
  // otherwise behaves exactly as the plain create form always has.
  const [caseId, setCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [antenatalDetails, setAntenatalDetails] = useState(() => BLANK_DETAILS(patientId));

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_BASE}/api/antenatal/getByPatientId?patientId=${patientId}`, { headers: getAuthHeader() })
      .then((res) => (res.status === 404 ? null : res.json()))
      .then((json) => {
        if (cancelled || !json?.data) return;
        const existing = json.data;
        setCaseId(existing.caseId);
        setAntenatalDetails({
          patientId,
          obstetricHistory: {
            gravida: existing.obstetricHistory?.gravida ?? 0,
            para: existing.obstetricHistory?.para ?? 0,
            abortus: existing.obstetricHistory?.abortus ?? 0,
            living: existing.obstetricHistory?.living ?? 0,
          },
          LMP: existing.LMP || '',
          expectedDateOfDelivery: existing.expectedDateOfDelivery ? existing.expectedDateOfDelivery.slice(0, 10) : '',
          specificHistory: {
            pregnancyComplications: existing.specificHistory?.pregnancyComplications || '',
            previousDeliveryBy: existing.specificHistory?.previousDeliveryBy || '',
          },
          medicalComplications: {
            heartDisease: existing.medicalComplications?.heartDisease || '',
            lungDisease: existing.medicalComplications?.lungDisease || '',
            liverDisease: existing.medicalComplications?.liverDisease || '',
            GIT: existing.medicalComplications?.GIT || '',
            Kidney: existing.medicalComplications?.Kidney || '',
            SpineProblem: existing.medicalComplications?.SpineProblem || '',
            Others: existing.medicalComplications?.Others || '',
          },
          investigations: {
            bloodInvestigation: {
              details: existing.investigations?.bloodInvestigation?.details || '',
              documents: mapExistingDocs(existing.investigations?.bloodInvestigation?.documents),
            },
            urineInvestigation: {
              details: existing.investigations?.urineInvestigation?.details || '',
              documents: mapExistingDocs(existing.investigations?.urineInvestigation?.documents),
            },
            ultrasoundInvestigation: {
              details: existing.investigations?.ultrasoundInvestigation?.details || '',
              documents: mapExistingDocs(existing.investigations?.ultrasoundInvestigation?.documents),
            },
            xrayInvestigation: {
              details: existing.investigations?.xrayInvestigation?.details || '',
              documents: mapExistingDocs(existing.investigations?.xrayInvestigation?.documents),
            },
          },
          treatments: existing.treatments || '',
        });
      })
      .catch((err) => console.error('Error checking for an existing antenatal case:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  const isEditMode = caseId !== null;

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData();

    // Append non-file data to formData
    formData.append('patientId', antenatalDetails.patientId);
    if (isEditMode) formData.append('caseId', caseId);
    formData.append('obstetricHistory.gravida', Number(antenatalDetails.obstetricHistory.gravida) || 0);
    formData.append('obstetricHistory.para', Number(antenatalDetails.obstetricHistory.para) || 0);
    formData.append('obstetricHistory.abortus', Number(antenatalDetails.obstetricHistory.abortus) || 0);
    formData.append('obstetricHistory.living', Number(antenatalDetails.obstetricHistory.living) || 0);
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

    // Append files to formData - each document is either a fresh local pick
    // ({name, file}, a real File to upload) or one already on the case from
    // before this edit ({name, _id, existing: true}). Existing ones aren't
    // re-uploaded - their ids go in a parallel "keep list" field instead, so
    // the backend knows which of the case's current documents survived this
    // save (anything not listed there was removed locally) alongside
    // whatever's newly attached here.
    const investigations = antenatalDetails.investigations;
    for (const key in investigations) {
      if (investigations.hasOwnProperty(key)) {
        formData.append(`investigations.${key}.details`, investigations[key].details);
        const keepIds = [];
        investigations[key].documents.forEach((doc) => {
          if (doc.existing) {
            keepIds.push(doc._id);
          } else {
            formData.append(`investigations.${key}.documents`, doc.file);
          }
        });
        if (isEditMode) formData.append(`investigations.${key}.keepDocumentIds`, JSON.stringify(keepIds));
      }
    }
    formData.append('treatments', antenatalDetails.treatments);

    try {
      const response = await axios.request({
        url: `${API_BASE}/api/antenatal/${isEditMode ? 'update' : 'create'}`,
        method: isEditMode ? 'PUT' : 'POST',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeader()
        }      });
      if (response.status === 200 || response.status === 201) {
        // Submission successful
        history.push(isEditMode ? `/patients/view/${patientId}` : '/patients');
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
      } else if (name.startsWith('obstetricHistory')) {
        const [category, subCategory] = name.split('.');
        setAntenatalDetails((prevState) => ({
          ...prevState,
          [category]: {
            ...prevState.obstetricHistory,
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

  if (loading) {
    return (
      <div>
        <AppNavbar role={sessionStorage.getItem('userRole')} />
        <div className="background-container">
          <Spinner fullPage label="Loading..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar role={sessionStorage.getItem('userRole')} />
      <div className="background-container">
        <Card variant="elevated" style={{ width: '100%', maxWidth: 680 }}>
          <IconBadge name="baby" />
          <span className="ui-eyebrow">Patient Records</span>
          <h2 className="section-title">{isEditMode ? 'Edit Antenatal Details' : 'Antenatal Details Form'}</h2>
          {error && <div className="ui-banner ui-banner-error" ref={errorBannerRef}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="patientId" value={patientId} />

            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Obstetric History</h3>
            <div className="patient-form-grid">
              <Field label="Gravida (total pregnancies)" htmlFor="obGravida">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obGravida"
                  name="obstetricHistory.gravida"
                  value={antenatalDetails.obstetricHistory.gravida}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Para (viable deliveries)" htmlFor="obPara">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obPara"
                  name="obstetricHistory.para"
                  value={antenatalDetails.obstetricHistory.para}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Abortus (losses)" htmlFor="obAbortus">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obAbortus"
                  name="obstetricHistory.abortus"
                  value={antenatalDetails.obstetricHistory.abortus}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Living (children alive)" htmlFor="obLiving">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obLiving"
                  name="obstetricHistory.living"
                  value={antenatalDetails.obstetricHistory.living}
                  onChange={handleChange}
                />
              </Field>
            </div>

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

            <h3 className="record-section-title">Treatments</h3>
            <Field label="Treatments" htmlFor="treatments">
              <textarea
                className="ui-textarea"
                id="treatments"
                name="treatments"
                rows={4}
                value={antenatalDetails.treatments}
                onChange={handleChange}
              />
            </Field>

            <div className="case-form-actions">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Submit Antenatal Details')}
              </Button>
              <Link to="/patients"><Button type="button" variant="ghost">Cancel</Button></Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AntenatalDetailsForm;
