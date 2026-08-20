import React, { useState, useEffect } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import DocumentPreviewModal from '../Shared/DocumentPreviewModal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import Tabs from '../ui/Tabs';
import { AddPatientForm, DETAIL_TABS } from './AddPatient';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';
import './PatientDetails.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
const CASE_TYPE_BADGE_VARIANT = { 1: 'primary', 2: 'accent', 3: 'neutral' };
// Same flat fee used everywhere else revenue is shown (WeekSummary.js,
// BookAppointment.js) - no per-visit amount is actually stored, so a paid
// billing-history entry's real amount is always this constant, never
// invented per row.
const CONSULTATION_FEE = 500;
const APPOINTMENT_STATUS_VARIANT = { appointment_confirmed: 'success', appointment_pending: 'warning', appointment_rejected: 'danger' };
const APPOINTMENT_STATUS_LABEL = { appointment_confirmed: 'Confirmed', appointment_pending: 'Pending', appointment_rejected: 'Rejected' };

const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

const formatNoteDate = (iso) => {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Today · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Only the "contact-ish" fields get an icon - keeps the grid scannable
// instead of every single field competing for attention with one.
const FIELD_ICONS = {
  phone: 'phone',
  email: 'mail',
  address: 'map-pin',
  dob: 'calendar',
  admission: 'calendar',
};

const RecordField = ({ label, value, icon }) => (
  <div className="record-field">
    {icon && <Icon name={icon} size={15} className="record-field-icon" />}
    <div>
      <div className="record-field-label">{label}</div>
      <div className="record-field-value">{value}</div>
    </div>
  </div>
);

const PatientDetails = () => {
  const role = sessionStorage.getItem('userRole');
  const { patientId } = useParams();
  const history = useHistory();
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  // Real appointment history for this patient - the same activity feed
  // PatientQuickView's drawer already uses, filtered down to just the
  // appointment_* events (that endpoint also returns AuditLog entries like
  // "record updated", which belong in an activity feed but not here).
  // null = still loading.
  const [appointmentEvents, setAppointmentEvents] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/patients/${patientId}`, { headers: getAuthHeader() });
      setPatientDetails(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this patient record.');
    }
  };

  useEffect(() => { fetchPatientDetails(); }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    axios.get(`${API_BASE}/api/patients/${patientId}/activity`, { headers: getAuthHeader() })
      .then(res => setAppointmentEvents((res.data.data || []).filter(e => e.action.startsWith('appointment_'))))
      .catch(() => setAppointmentEvents([])); // Non-critical - the rest of the page still works without it.
  }, [patientId]);

  // Deliberately standalone from editing the patient (see Patients.js's own
  // model comment) - just type and save, no visit date or payment status
  // involved, per the doctor's explicit preference.
  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    setNoteError(null);
    setSavingNote(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/patients/${patientId}/diagnosis-notes`,
        { text: noteText.trim(), author: sessionStorage.getItem('userName') || '' },
        { headers: getAuthHeader() }
      );
      setPatientDetails(response.data.data);
      setNoteText('');
    } catch (err) {
      setNoteError(err.response?.data?.message || 'Could not save the note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDocumentPreview = async (document) => {
    try {
      const response = await axios.get(`${API_BASE}/api/documents/${document._id}`, {
        responseType: 'blob',
        headers: getAuthHeader()
      });
      const documentUrl = URL.createObjectURL(response.data);
      setPreviewDocument({ name: document.filename, url: documentUrl });
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const handleSaved = () => {
    setEditMode(false);
    fetchPatientDetails();
  };

  // Owner-only (matches the backend route). Plain window.confirm, same
  // reasoning as the appointment Delete action - the only two destructive
  // actions in the app, not worth a shared dialog component for just these.
  const handleDelete = async () => {
    if (!window.confirm(`Delete ${patientDetails.firstName} ${patientDetails.lastName}'s record? This can't be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      // axios throws on any non-2xx status, so reaching here means it
      // genuinely succeeded - no separate success flag in this API's
      // response shape to check.
      await axios.delete(`${API_BASE}/api/patients/${patientId}`, { headers: getAuthHeader() });
      history.push('/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this patient.');
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div>
        <AppNavbar role={role} />
        <div className="page page-narrow">
          <div className="ui-banner ui-banner-error">{error}</div>
          <Link to="/patients"><Button variant="ghost">Back to Patients</Button></Link>
        </div>
      </div>
    );
  }

  if (!patientDetails) {
    return (
      <div>
        <AppNavbar role={role} />
        <Spinner fullPage label="Loading patient record..." />
      </div>
    );
  }

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        {editMode ? (
          <AddPatientForm
            initialPatientDetails={patientDetails}
            onSaved={handleSaved}
            initialTab={activeTab}
            onPreviewDocument={handleDocumentPreview}
          />
        ) : (
          <Card variant="elevated">
            <div className="patient-detail-header">
              <span className="ui-avatar patient-detail-avatar">
                {getInitials(patientDetails.firstName, patientDetails.lastName)}
              </span>
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>{patientDetails.firstName} {patientDetails.lastName}</h2>
                <Badge variant={CASE_TYPE_BADGE_VARIANT[patientDetails.caseType] || 'neutral'}>
                  {CASE_TYPE_LABELS[patientDetails.caseType] || '-'}
                </Badge>
              </div>
            </div>

            <Tabs tabs={DETAIL_TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'personal' && (
              <div className="record-grid">
                <RecordField label="Date of Birth" value={patientDetails.dateOfBirth} icon={FIELD_ICONS.dob} />
                <RecordField label="Address" value={patientDetails.address} icon={FIELD_ICONS.address} />
                <RecordField label="Aadhar Number" value={patientDetails.aadhar} />
                <RecordField label="Phone Number" value={patientDetails.phone} icon={FIELD_ICONS.phone} />
                <RecordField label="Email" value={patientDetails.email || '-'} icon={FIELD_ICONS.email} />
              </div>
            )}

            {activeTab === 'family' && (
              <div className="record-grid">
                <div className="record-field">
                  <div>
                    <div className="record-field-label">Marital Status</div>
                    <Badge variant={patientDetails.maritalStatus === 'married' ? 'primary' : 'neutral'}>
                      {patientDetails.maritalStatus === 'unmarried' ? 'Unmarried' : 'Married'}
                    </Badge>
                  </div>
                </div>
                {patientDetails.maritalStatus !== 'unmarried' && (
                  <RecordField label="Married For (Years)" value={patientDetails.marriedFor} />
                )}
                <RecordField label="Husband's Name" value={`${patientDetails.husbandFirstName} ${patientDetails.husbandLastName}`} />
              </div>
            )}

            {activeTab === 'visit' && (
              <div className="record-grid">
                <RecordField label="Date of Appointment" value={new Date(patientDetails.dateOfAdmission).toLocaleDateString()} icon={FIELD_ICONS.admission} />
                <div className="record-field">
                  <div>
                    <div className="record-field-label">Patient Status</div>
                    <Badge variant={patientDetails.isNewPatient ? 'primary' : 'neutral'}>
                      {patientDetails.isNewPatient ? 'New' : 'Returning'}
                    </Badge>
                  </div>
                </div>
                <div className="record-field">
                  <div>
                    <div className="record-field-label">Payment Status</div>
                    <Badge variant={patientDetails.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {patientDetails.paymentStatus === 'paid'
                        ? `Paid (${patientDetails.paymentMethod === 'online' ? 'Online' : 'Offline'})`
                        : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              patientDetails.documents && patientDetails.documents.length > 0 ? (
                <div className="record-documents">
                  {patientDetails.documents.map((document) => (
                    <button key={document._id} className="record-document-item" onClick={() => handleDocumentPreview(document)}>
                      <Icon name="file" size={18} />
                      {document.filename}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ui-empty-state">
                  <Icon name="inbox" size={28} />
                  <p>No documents uploaded.</p>
                </div>
              )
            )}

            {/* Recent Appointments/Billing History/Medical Notes stay visible
                regardless of which tab is active, same reasoning as the
                Diagnosis callout this replaced - real clinical/financial
                history shouldn't require a click to see. */}
            <div className="record-history-grid">
              <div className="record-history-card">
                <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <Icon name="calendar" size={16} className="record-section-title-icon" /> Recent Appointments
                </h3>
                {appointmentEvents === null ? (
                  <div className="text-muted">Loading...</div>
                ) : appointmentEvents.length === 0 ? (
                  <div className="ui-empty-state ui-empty-state-sm">
                    <Icon name="calendar" size={22} />
                    <p>No online appointments yet.</p>
                  </div>
                ) : (
                  <div className="record-history-list">
                    {appointmentEvents.map((event, i) => (
                      <div className="record-history-row" key={i}>
                        <div>
                          <div className="record-history-row-title">{event.detail || 'Appointment'}</div>
                          <div className="text-muted record-history-row-date">{formatNoteDate(event.timestamp)}</div>
                        </div>
                        <Badge variant={APPOINTMENT_STATUS_VARIANT[event.action] || 'neutral'}>
                          {APPOINTMENT_STATUS_LABEL[event.action] || event.action}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="record-history-card">
                <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <Icon name="wallet" size={16} className="record-section-title-icon" /> Billing History
                </h3>
                {!patientDetails.visitHistory || patientDetails.visitHistory.length === 0 ? (
                  <div className="ui-empty-state ui-empty-state-sm">
                    <Icon name="wallet" size={22} />
                    <p>No visits recorded yet.</p>
                  </div>
                ) : (
                  <div className="record-history-list">
                    {[...patientDetails.visitHistory].reverse().map((visit, i) => (
                      <div className="record-history-row" key={visit._id || i}>
                        <div>
                          <div className="record-history-row-title">
                            Visit · {visit.paymentMethod === 'online' ? 'Online' : 'Offline'}
                          </div>
                          <div className="text-muted record-history-row-date">{new Date(visit.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div className="record-history-row-amount">
                          <div>{visit.paymentStatus === 'paid' ? `₹${CONSULTATION_FEE}` : '-'}</div>
                          <Badge variant={visit.paymentStatus === 'paid' ? 'success' : 'warning'}>
                            {visit.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="record-history-card record-notes-card">
              <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <Icon name="edit" size={16} className="record-section-title-icon" /> Medical Notes
              </h3>
              <form className="record-add-note-form" onSubmit={handleAddNote}>
                <textarea
                  className="ui-textarea"
                  rows={2}
                  placeholder="Add a clinical note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                {noteError && <div className="ui-banner ui-banner-error">{noteError}</div>}
                <Button type="submit" size="sm" disabled={savingNote || !noteText.trim()}>
                  {savingNote ? 'Saving...' : 'Add Note'}
                </Button>
              </form>
              {!patientDetails.diagnosisNotes || patientDetails.diagnosisNotes.length === 0 ? (
                <div className="ui-empty-state ui-empty-state-sm">
                  <Icon name="inbox" size={22} />
                  <p>No notes yet.</p>
                </div>
              ) : (
                <div className="record-notes-list">
                  {[...patientDetails.diagnosisNotes].reverse().map((note, i) => (
                    <div className="record-note-item" key={note._id || i}>
                      <div className="record-note-item-text">{note.text}</div>
                      <div className="text-muted record-note-item-meta">
                        {note.author ? `${note.author} · ` : ''}{formatNoteDate(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="patient-detail-actions">
              {role === 'owner' && <Button onClick={() => setEditMode(true)}>Edit</Button>}
              {role === 'owner' && (
                <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Patient'}
                </Button>
              )}
              {patientDetails.caseType === 1 && (
                <Link to={`/patients/view/anteNatalForm/${patientId}`}><Button variant="secondary">View AnteNatal Form</Button></Link>
              )}
              {patientDetails.caseType === 2 && (
                <Link to={`/patients/view/infertilityForm/${patientId}`}><Button variant="secondary">View Infertility Form</Button></Link>
              )}
              <Link to="/patients"><Button variant="ghost">Back</Button></Link>
            </div>
          </Card>
        )}

        <DocumentPreviewModal
          document={previewDocument}
          documents={patientDetails?.documents || []}
          onSelect={handleDocumentPreview}
          onClose={() => setPreviewDocument(null)}
        />
      </div>
    </div>
  );
};

export default PatientDetails;
