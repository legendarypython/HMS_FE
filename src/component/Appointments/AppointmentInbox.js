import React, { useState, useEffect } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import PageHeader from '../ui/PageHeader';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import { formatSlotLabel } from '../../utils/timeSlots';

const STATUS_VARIANT = { pending: 'warning', confirmed: 'success', rejected: 'danger' };

const AppointmentInbox = () => {
  const role = sessionStorage.getItem('userRole');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = () => {
    setLoading(true);
    apiFetch(`${API_BASE}/api/appointments/all`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => setAppointments(json.data || []))
      .catch(err => console.error('Error fetching appointments:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id, status) => {
    await apiFetch(`${API_BASE}/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status })
    });
    fetchAppointments();
  };

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        <PageHeader icon="calendar" title="Appointment Requests" />
        {loading ? (
          <Spinner label="Loading appointments..." />
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Doctor</th>
                  <th>Preferred Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt._id}>
                    <td data-label="Patient">{appt.patientName}</td>
                    <td data-label="Phone">{appt.patientPhone}</td>
                    <td data-label="Doctor">{appt.doctorId ? `${appt.doctorId.name}` : '-'}</td>
                    <td data-label="Preferred Date">{new Date(appt.preferredDate).toLocaleDateString()}</td>
                    <td data-label="Time">{formatSlotLabel(appt.preferredTimeSlot)}</td>
                    <td data-label="Reason">{appt.reason || '-'}</td>
                    <td data-label="Payment"><Badge variant={appt.paymentStatus === 'paid' ? 'success' : 'neutral'}>{appt.paymentStatus}</Badge></td>
                    <td data-label="Status"><Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge></td>
                    <td data-label="Actions">
                      {appt.status === 'pending' && (
                        <div className="ui-action-group">
                          <Button size="sm" variant="success" onClick={() => updateStatus(appt._id, 'confirmed')}>Confirm</Button>
                          <Button size="sm" variant="danger" onClick={() => updateStatus(appt._id, 'rejected')}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && (
              <div className="ui-table-empty">
                <Icon name="inbox" size={28} />
                No appointment requests yet — they'll show up here the moment a patient books online.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentInbox;
