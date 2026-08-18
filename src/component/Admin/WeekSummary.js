import React, { useEffect, useState } from 'react';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';

// Fixed consultation fee (see BookAppointment.js's own CONSULTATION_FEE_DISPLAY) -
// no per-appointment amount is stored on the model, so revenue is derived
// from a count of paid appointments rather than summed from real values.
const CONSULTATION_FEE = 500;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Small, honestly-scaled overview strip for the staff landing page - real
// counts from real data, not a full analytics dashboard. Deliberately a
// plain SVG-free div/CSS bar chart rather than pulling in a charting
// library for a solo-doctor clinic's realistically low daily volume - a
// dependency that size wasn't worth it for a handful of bars.
const WeekSummary = ({ totalPatients }) => {
  const [appointments, setAppointments] = useState(null); // null = still loading

  useEffect(() => {
    apiFetch(`${API_BASE}/api/appointments/all`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => setAppointments(json.data || []))
      .catch(() => setAppointments([]));
  }, []);

  // Never blocks the patient table below it - if this fails to load for any
  // reason, the page's actual job (finding a patient) still works.
  if (appointments === null) return null;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const counts = days.map(day => appointments.filter(a => sameDay(new Date(a.preferredDate), day)).length);
  const maxCount = Math.max(1, ...counts);
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  // Excludes 'waived' (free 7-day follow-ups) - those are real confirmed
  // appointments but zero rupees actually changed hands, so counting them
  // here would overstate revenue. 'online' and 'offline' both count - both
  // are real money, just collected differently.
  const weekPaidCount = appointments.filter(
    a => a.paymentStatus === 'paid' && a.paymentMethod !== 'waived' && days.some(d => sameDay(new Date(a.preferredDate), d))
  ).length;
  const weekRevenue = weekPaidCount * CONSULTATION_FEE;
  const todayCount = counts[counts.length - 1];

  return (
    <div className="week-summary">
      <div className="week-summary-stats">
        <div className="week-stat">
          <div className="week-stat-value">{totalPatients}</div>
          <div className="week-stat-label">Patients</div>
        </div>
        <div className="week-stat">
          <div className="week-stat-value">{todayCount}</div>
          <div className="week-stat-label">Today&apos;s appointments</div>
        </div>
        <div className="week-stat">
          <div className="week-stat-value">{pendingCount}</div>
          <div className="week-stat-label">Pending confirmation</div>
        </div>
        <div className="week-stat">
          <div className="week-stat-value">&#8377;{weekRevenue.toLocaleString('en-IN')}</div>
          <div className="week-stat-label">This week&apos;s revenue</div>
        </div>
      </div>

      <div className="week-chart">
        <div className="week-chart-label">Appointments this week</div>
        <div className="week-chart-bars">
          {days.map((day, i) => (
            <div className="week-chart-col" key={i}>
              <div className="week-chart-bar-track">
                <div
                  className="week-chart-bar"
                  style={{ height: `${Math.max(6, (counts[i] / maxCount) * 60)}px` }}
                  title={`${counts[i]} appointment${counts[i] === 1 ? '' : 's'} on ${day.toLocaleDateString()}`}
                />
              </div>
              <div className="week-chart-count">{counts[i]}</div>
              <div className="week-chart-day">{DAY_LABELS[day.getDay()]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekSummary;
