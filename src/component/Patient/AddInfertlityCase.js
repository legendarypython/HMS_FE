// InfertilityDetailsForm.js

import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import Spinner from '../ui/Spinner';
import Tabs from '../ui/Tabs';
import InvestigationField from './InvestigationField';
import { INFERTILITY_TABS } from './ViewInfertilityCase';
import '../../styles/caseForms.css';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';

const BLANK_INVESTIGATIONS = () => ({
  bloodInvestigation: { details: '', documents: [] },
  urineInvestigation: { details: '', documents: [] },
  ultrasoundInvestigation: { details: '', documents: [] },
  xrayInvestigation: { details: '', documents: [] },
});

const BLANK_DETAILS = (patientId) => ({
  patientId,
  primaryHistory: { investigations: BLANK_INVESTIGATIONS() },
  secondaryHistory: {
    obstetricHistory: { gravida: '', para: '', abortus: '', living: '' },
    investigations: BLANK_INVESTIGATIONS(),
  },
  treatments: '',
});

// Maps a populated Document object (from the backend) into the shape
// InvestigationField already knows how to display ({name, ...}) - existing
// docs are tagged `existing: true` so handleSubmit knows to send their id
// back rather than try to re-upload them.
const mapExistingDocs = (docs) => (docs || []).map((doc) => ({
  _id: doc._id,
  name: doc.filename,
  existing: true,
}));

const mapExistingInvestigations = (investigations) => ({
  bloodInvestigation: {
    details: investigations?.bloodInvestigation?.details || '',
    documents: mapExistingDocs(investigations?.bloodInvestigation?.documents),
  },
  urineInvestigation: {
    details: investigations?.urineInvestigation?.details || '',
    documents: mapExistingDocs(investigations?.urineInvestigation?.documents),
  },
  ultrasoundInvestigation: {
    details: investigations?.ultrasoundInvestigation?.details || '',
    documents: mapExistingDocs(investigations?.ultrasoundInvestigation?.documents),
  },
  xrayInvestigation: {
    details: investigations?.xrayInvestigation?.details || '',
    documents: mapExistingDocs(investigations?.xrayInvestigation?.documents),
  },
});

const InfertilityDetailsForm = () => {
  const { patientId } = useParams();
  const history = useHistory();
  const location = useLocation();
  // Same gap found and fixed on AddAnteNatal.js: a failed submit used to
  // only go to console.error, so it looked from the user's side like
  // clicking Submit did nothing at all.
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const errorBannerRef = useRef(null);

  // The submit button sits at the bottom of a long form - an error
  // rendered up at the top (next to the heading) is invisible unless
  // something scrolls it into view, same problem the browser's own native
  // "please fill out this field" tooltip solves for free on plain inputs.
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Same gap found and fixed on AddAnteNatal.js: a patient with an
  // Infertility case type but no submitted case yet had no way back into
  // this form - it now loads any existing case for this patientId on
  // mount and switches into edit mode if one exists.
  const [caseId, setCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [infertilityDetails, setInfertilityDetails] = useState(() => BLANK_DETAILS(patientId));

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_BASE}/api/infertility/getByPatientId?patientId=${patientId}`, { headers: getAuthHeader() })
      .then((res) => (res.status === 404 ? null : res.json()))
      .then((json) => {
        if (cancelled || !json?.data) return;
        const existing = json.data;
        setCaseId(existing.caseId);
        setInfertilityDetails({
          patientId,
          primaryHistory: {
            investigations: mapExistingInvestigations(existing.primaryHistory?.investigations),
          },
          secondaryHistory: {
            obstetricHistory: {
              gravida: existing.secondaryHistory?.obstetricHistory?.gravida ?? 0,
              para: existing.secondaryHistory?.obstetricHistory?.para ?? 0,
              abortus: existing.secondaryHistory?.obstetricHistory?.abortus ?? 0,
              living: existing.secondaryHistory?.obstetricHistory?.living ?? 0,
            },
            investigations: mapExistingInvestigations(existing.secondaryHistory?.investigations),
          },
          treatments: existing.treatments || '',
        });
      })
      .catch((err) => console.error('Error checking for an existing infertility case:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  const isEditMode = caseId !== null;
  // Same fix as AddAnteNatal.js: reopens on the tab you were reading on
  // ViewInfertilityCase.js (carried via route state on its Edit link)
  // instead of always landing at the top. The read view's "Investigations"
  // tab only ever displays primaryHistory - this form still edits both
  // primary and secondary investigations, just grouped together under that
  // same tab (see the render below), so no field loses its edit path.
  const [editTab, setEditTab] = useState(location.state?.initialTab || 'obstetric');
  const showSection = (tabKey) => !isEditMode || editTab === tabKey;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData = new FormData();

      // Append patientId
      formData.append('patientId', infertilityDetails.patientId);
      if (isEditMode) formData.append('caseId', caseId);

      // Append primary history details and documents
      appendInvestigationDetails(formData, 'primaryHistory', infertilityDetails.primaryHistory);

      // Append secondary history's obstetric-history counts (see
      // AnteNatalCases.js for why this is four numbers, not a single
      // G/P/A/L choice) and investigations details and documents
      const ob = infertilityDetails.secondaryHistory.obstetricHistory;
      formData.append('secondaryHistory.obstetricHistory.gravida', Number(ob.gravida) || 0);
      formData.append('secondaryHistory.obstetricHistory.para', Number(ob.para) || 0);
      formData.append('secondaryHistory.obstetricHistory.abortus', Number(ob.abortus) || 0);
      formData.append('secondaryHistory.obstetricHistory.living', Number(ob.living) || 0);
      appendInvestigationDetails(formData, 'secondaryHistory', infertilityDetails.secondaryHistory);
      formData.append('treatments', infertilityDetails.treatments);

      const response = await apiFetch(`${API_BASE}/api/infertility/${isEditMode ? 'update' : 'create'}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: getAuthHeader(),
        body: formData
      });

      if (response.ok) {
        // Submission successful
        history.push(isEditMode ? `/patients/view/${patientId}` : '/patients');
      } else {
        // Handle error response
        const errorData = await response.json();
        console.error('Error submitting infertility details:', errorData);
        setError(errorData?.message || 'Could not save infertility details. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting infertility details:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to append investigation details and documents to
  // FormData - existing (already-uploaded) documents aren't re-uploaded,
  // their ids go in a parallel "keep list" field instead (edit mode only),
  // so the backend knows which of the case's current documents survived
  // this save alongside whatever's newly attached here.
  const appendInvestigationDetails = (formData, historyType, historyDetails) => {
    Object.keys(historyDetails.investigations).forEach((category) => {
      const investigation = historyDetails.investigations[category];
      formData.append(`${historyType}.investigations.${category}.details`, investigation.details);

      const keepIds = [];
      investigation.documents.forEach((doc) => {
        if (doc.existing) {
          keepIds.push(doc._id);
        } else {
          formData.append(`${historyType}.investigations.${category}.documents`, doc.file);
        }
      });
      if (isEditMode) formData.append(`${historyType}.investigations.${category}.keepDocumentIds`, JSON.stringify(keepIds));
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

  // Separate from handleChange above - that one assumes every field name is
  // a dotted nested path (mainCategory.nested...) and would break on a flat
  // top-level field like this one (updateNestedProperty spreads its `obj`
  // argument, which only works for objects, not a plain string value).
  const handleTreatmentsChange = (event) => {
    const { value } = event.target;
    setInfertilityDetails((prevState) => ({ ...prevState, treatments: value }));
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
          <h2 className="section-title">{isEditMode ? 'Edit Infertility Details' : 'Infertility Details Form'}</h2>
          {error && <div className="ui-banner ui-banner-error" ref={errorBannerRef}>{error}</div>}
          {isEditMode && <Tabs tabs={INFERTILITY_TABS} active={editTab} onChange={setEditTab} />}
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="patientId" value={patientId} />

            {/* Grouped under the same "Investigations" tab as Secondary
                History's investigations below, even though they're two
                separate sections in the data model - the read view
                (ViewInfertilityCase.js) only has one Investigations tab, and
                this is the only place either ever gets edited. */}
            {showSection('investigations') && (
              <>
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
              </>
            )}

            {showSection('obstetric') && (
              <>
            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Obstetric History</h3>
            <div className="patient-form-grid">
              <Field label="Gravida (total pregnancies)" htmlFor="obGravida">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obGravida"
                  name="secondaryHistory.obstetricHistory.gravida"
                  value={infertilityDetails.secondaryHistory.obstetricHistory.gravida}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Para (viable deliveries)" htmlFor="obPara">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obPara"
                  name="secondaryHistory.obstetricHistory.para"
                  value={infertilityDetails.secondaryHistory.obstetricHistory.para}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Abortus (losses)" htmlFor="obAbortus">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obAbortus"
                  name="secondaryHistory.obstetricHistory.abortus"
                  value={infertilityDetails.secondaryHistory.obstetricHistory.abortus}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Living (children alive)" htmlFor="obLiving">
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  id="obLiving"
                  name="secondaryHistory.obstetricHistory.living"
                  value={infertilityDetails.secondaryHistory.obstetricHistory.living}
                  onChange={handleChange}
                />
              </Field>
            </div>
              </>
            )}

            {showSection('investigations') && (
              <>
            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Secondary History Investigations</h3>
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
              </>
            )}

            {showSection('treatments') && (
              <>
            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Treatments</h3>
            <Field label="Treatments" htmlFor="treatments">
              <textarea
                className="ui-textarea"
                id="treatments"
                name="treatments"
                rows={4}
                value={infertilityDetails.treatments}
                onChange={handleTreatmentsChange}
              />
            </Field>
              </>
            )}

            <div className="case-form-actions">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Submit Infertility Details')}
              </Button>
              <Link to="/patients"><Button type="button" variant="ghost">Cancel</Button></Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default InfertilityDetailsForm;
