import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
const CASE_TYPE_BADGE_VARIANT = { 1: 'primary', 2: 'accent', 3: 'neutral' };

const ACTION_LABELS = {
  patient_created: 'Patient record created',
  patient_updated: 'Record updated',
  document_added: 'Document added',
  appointment_pending: 'Appointment requested',
  appointment_confirmed: 'Appointment confirmed',
  appointment_rejected: 'Appointment rejected',
};

const formatEventDate = (iso) => {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return `Today · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString();
};

const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// Quick-glance content for the patient drawer - deliberately a subset of
// what the full record page shows (no edit form, no document upload), so
// staff can check who someone is without leaving the list they were
// searching/filtering. "Open Full Record" is the way out to everything
// this drawer intentionally leaves out.
const PatientQuickView = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState(null); // null = loading, [] = loaded-empty

  useEffect(() => {
    if (!patientId) return;
    setPatient(null);
    setError(null);
    setActivity(null);
    axios.get(`${API_BASE}/api/patients/${patientId}`, { headers: getAuthHeader() })
      .then(res => setPatient(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load this patient record.'));
    axios.get(`${API_BASE}/api/patients/${patientId}/activity`, { headers: getAuthHeader() })
      .then(res => setActivity(res.data.data || []))
      .catch(() => setActivity([])); // Non-critical - the rest of the drawer still works without it.
  }, [patientId]);

  if (error) {
    return <div className="ui-banner ui-banner-error">{error}</div>;
  }

  if (!patient) {
    return <Spinner label="Loading patient..." />;
  }

  return (
    <div className="patient-quick-view">
      <div className="patient-quick-view-header">
        <span className="ui-avatar patient-quick-view-avatar" aria-hidden="true">
          {getInitials(patient.firstName, patient.lastName)}
        </span>
        <div>
          <div className="patient-quick-view-name">{patient.firstName} {patient.lastName}</div>
          <div className="text-muted">#{patient.patientId} &middot; {calculateAge(patient.dateOfBirth)} yrs</div>
        </div>
      </div>

      <div className="patient-quick-view-badges">
        <Badge variant={CASE_TYPE_BADGE_VARIANT[patient.caseType] || 'neutral'}>
          {CASE_TYPE_LABELS[patient.caseType] || 'Unclassified'}
        </Badge>
        <Badge variant={patient.isNewPatient ? 'primary' : 'neutral'}>
          {patient.isNewPatient ? 'New' : 'Returning'}
        </Badge>
        <Badge variant={patient.paymentMethod === 'waived' ? 'primary' : patient.paymentStatus === 'paid' ? 'success' : 'warning'}>
          {patient.paymentMethod === 'waived'
            ? 'Waived'
            : patient.paymentStatus === 'paid'
            ? `Paid (${patient.paymentMethod === 'online' ? 'Online' : 'Offline'})`
            : 'Payment Pending'}
        </Badge>
      </div>

      <h4 className="patient-quick-view-section-title">Contact</h4>
      <div className="patient-quick-view-row"><Icon name="phone" size={14} /> {patient.phone}</div>
      {patient.email && <div className="patient-quick-view-row"><Icon name="mail" size={14} /> {patient.email}</div>}
      <div className="patient-quick-view-row"><Icon name="map-pin" size={14} /> {patient.address}</div>

      <h4 className="patient-quick-view-section-title">Admission</h4>
      <div className="patient-quick-view-row">
        <Icon name="calendar" size={14} /> {new Date(patient.dateOfAdmission).toLocaleDateString()}
      </div>
      {patient.diagnosis && (
        <div className="patient-quick-view-diagnosis text-muted">{patient.diagnosis}</div>
      )}
      <div className="patient-quick-view-row text-muted">
        <Icon name="file" size={14} /> {patient.documents?.length || 0} document{patient.documents?.length === 1 ? '' : 's'}
      </div>

      <h4 className="patient-quick-view-section-title">Recent Activity</h4>
      {activity === null ? (
        <div className="text-muted patient-quick-view-activity-loading">Loading...</div>
      ) : activity.length === 0 ? (
        <div className="text-muted patient-quick-view-activity-loading">Nothing recorded yet.</div>
      ) : (
        <div className="patient-quick-view-timeline">
          {activity.map((event, i) => (
            <div className="patient-quick-view-timeline-item" key={i}>
              <span className="patient-quick-view-timeline-dot" aria-hidden="true" />
              <div>
                <div className="patient-quick-view-timeline-label">
                  {ACTION_LABELS[event.action] || event.action}
                </div>
                {event.detail && <div className="text-muted patient-quick-view-timeline-detail">{event.detail}</div>}
                <div className="text-muted patient-quick-view-timeline-date">{formatEventDate(event.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="patient-quick-view-actions">
        <Link to={`/patients/view/${patient.patientId}`} onClick={onClose}>
          <Button style={{ width: '100%' }}>Open Full Record</Button>
        </Link>
      </div>
    </div>
  );
};

export default PatientQuickView;
