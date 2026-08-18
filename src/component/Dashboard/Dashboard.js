import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AppNavbar from '../Shared/AppNavbar';
import Footer from '../Footer';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';
import Spinner from '../ui/Spinner';
import PageHeader from '../ui/PageHeader';
import WeekSummary from '../Admin/WeekSummary';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import { formatSlotLabel } from '../../utils/timeSlots';
import './Dashboard.css';

const STATUS_VARIANT = { pending: 'warning', confirmed: 'success', rejected: 'danger' };

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// The real operational landing page - what's happening today - rather than
// the patient-management table that used to live at this route (moved to
// /patients). No fabricated name in the greeting - sessionStorage only ever
// stores the role and token at login, not a display name, so "Good
// morning, Dr. Sharma" isn't something this app can actually say.
const Dashboard = () => {
  const role = sessionStorage.getItem('userRole');
  const [totalPatientCount, setTotalPatientCount] = useState(null);
  const [appointments, setAppointments] = useState(null); // null = loading

  useEffect(() => {
    axios.post(`${API_BASE}/api/patients/search`, {
      name: '', sortBy: 'firstName', order: 'asc', page: 1, limit: 1, filters: {}
    }, { headers: getAuthHeader() })
      .then(response => setTotalPatientCount(response.data.pagination.total))
      .catch(() => setTotalPatientCount(null));
  }, []);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/appointments/all`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => setAppointments(json.data || []))
      .catch(() => setAppointments([]));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAppointments = (appointments || [])
    .filter(a => {
      const d = new Date(a.preferredDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
    .sort((a, b) => a.preferredTimeSlot.localeCompare(b.preferredTimeSlot));

  const pendingCount = (appointments || []).filter(a => a.status === 'pending').length;
  const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        <PageHeader icon="home" title={getGreeting()} subtitle={dateLabel} />

        {totalPatientCount !== null && <WeekSummary totalPatients={totalPatientCount} />}

        <div className="dashboard-columns">
          <div className="dashboard-main-col">
            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              Today&apos;s appointments
            </h3>
            {appointments === null ? (
              <Spinner label="Loading appointments..." />
            ) : todayAppointments.length === 0 ? (
              <div className="ui-card dashboard-empty">
                <Icon name="calendar" size={22} />
                Nothing on the books for today.
              </div>
            ) : (
              <div className="dashboard-today-list">
                {todayAppointments.map(appt => (
                  <div className="dashboard-today-item" key={appt._id}>
                    <div className="dashboard-today-time">{formatSlotLabel(appt.preferredTimeSlot)}</div>
                    <div className="dashboard-today-info">
                      <div className="dashboard-today-name">{appt.patientName}</div>
                      <div className="text-muted">{appt.doctorId ? appt.doctorId.name : 'Doctor'}</div>
                    </div>
                    <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-side-col">
            <h3 className="record-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              Quick actions
            </h3>
            <div className="dashboard-quick-actions">
              <Link to="/patients/add">
                <Button style={{ width: '100%' }}>
                  <Icon name="user" size={16} /> Add Patient
                </Button>
              </Link>
              <Link to="/appointments">
                <Button variant="secondary" style={{ width: '100%' }}>
                  <Icon name="calendar" size={16} /> View Appointments
                </Button>
              </Link>
              <Link to="/availability">
                <Button variant="secondary" style={{ width: '100%' }}>
                  <Icon name="calendar-off" size={16} /> Manage Availability
                </Button>
              </Link>
            </div>

            {pendingCount > 0 && (
              <>
                <h3 className="record-section-title">Alerts</h3>
                <Link to="/appointments" className="dashboard-alert">
                  <Icon name="bell" size={16} />
                  {pendingCount} appointment{pendingCount === 1 ? '' : 's'} waiting on confirmation
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
