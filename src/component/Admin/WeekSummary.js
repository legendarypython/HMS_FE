import React, { useEffect, useState } from 'react';
import IconBadge from '../ui/IconBadge';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';

// Fixed consultation fee (see BookAppointment.js's own CONSULTATION_FEE_DISPLAY) -
// no per-appointment amount is stored on the model, so revenue is derived
// from a count of paid appointments rather than summed from real values.
const CONSULTATION_FEE = 500;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (offsetDays) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
};

const shortDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Small, honestly-scaled overview strip for the staff landing page - real
// counts from real data, not a full analytics dashboard. Deliberately a
// plain SVG-free div/CSS bar chart rather than pulling in a charting
// library for a solo-doctor clinic's realistically low daily volume - a
// dependency that size wasn't worth it for a handful of bars.
const WeekSummary = ({ totalPatients }) => {
  const [appointments, setAppointments] = useState(null); // null = still loading
  // Only the chart below toggles - the four stat tiles above stay
  // week-based regardless, matching what a receptionist actually checks
  // daily ("how's this week going"), not a KPI that shifts under them.
  const [chartView, setChartView] = useState('week'); // 'week' | 'month'

  useEffect(() => {
    apiFetch(`${API_BASE}/api/appointments/all`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => setAppointments(json.data || []))
      .catch(() => setAppointments([]));
  }, []);

  // Never blocks the patient table below it - if this fails to load for any
  // reason, the page's actual job (finding a patient) still works.
  if (appointments === null) return null;

  // Real bug found live: this used to build i from 6 down to 0, so the
  // array read [6 days ago, ..., yesterday, today] - today ended up as the
  // LAST bar (rightmost) instead of the first. Building it 0 up to 6
  // instead puts today first, 6-days-ago last, matching what was expected.
  const days = [];
  for (let i = 0; i <= 6; i++) {
    days.push(startOfDay(i));
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
  const todayCount = counts[0];

  // Month view: last 5 rolling 7-day windows (this week, then the 4 before
  // it), not a 30-bar daily view - stays readable at this clinic's real
  // volume instead of turning into a wall of near-empty bars. Each bar's
  // window is [weeksAgo*7 + 6 days ago .. weeksAgo*7 days ago], so the 5
  // windows tile the last 35 days with no gaps or overlaps.
  const WEEK_COUNT = 5;
  const weekBuckets = [];
  for (let w = 0; w < WEEK_COUNT; w++) {
    const end = startOfDay(w * 7); // most recent day in this window
    const start = startOfDay(w * 7 + 6); // oldest day in this window
    const count = appointments.filter(a => {
      const d = new Date(a.preferredDate);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    }).length;
    weekBuckets.push({ start, end, count, label: w === 0 ? 'This wk' : shortDate(start) });
  }
  const monthMaxCount = Math.max(1, ...weekBuckets.map(w => w.count));

  const chartCols = chartView === 'week'
    ? days.map((day, i) => ({
      key: i,
      count: counts[i],
      heightPct: counts[i] / maxCount,
      label: DAY_LABELS[day.getDay()],
      title: `${counts[i]} appointment${counts[i] === 1 ? '' : 's'} on ${day.toLocaleDateString()}`,
    }))
    : weekBuckets.map((w, i) => ({
      key: i,
      count: w.count,
      heightPct: w.count / monthMaxCount,
      label: w.label,
      title: `${w.count} appointment${w.count === 1 ? '' : 's'}, ${shortDate(w.start)} - ${shortDate(w.end)}`,
    }));

  return (
    <div className="week-summary">
      <div className="week-summary-stats">
        <div className="week-stat">
          <IconBadge name="users" variant="primary" size="md" className="ui-icon-badge-inline week-stat-icon" />
          <div>
            <div className="week-stat-value">{totalPatients}</div>
            <div className="week-stat-label">Patients</div>
          </div>
        </div>
        <div className="week-stat">
          <IconBadge name="calendar" variant="primary" size="md" className="ui-icon-badge-inline week-stat-icon" />
          <div>
            <div className="week-stat-value">{todayCount}</div>
            <div className="week-stat-label">Today&apos;s appointments</div>
          </div>
        </div>
        <div className="week-stat">
          <IconBadge name="bell" variant="warning" size="md" className="ui-icon-badge-inline week-stat-icon" />
          <div>
            <div className="week-stat-value">{pendingCount}</div>
            <div className="week-stat-label">Pending confirmation</div>
          </div>
        </div>
        <div className="week-stat">
          <IconBadge name="wallet" variant="success" size="md" className="ui-icon-badge-inline week-stat-icon" />
          <div>
            <div className="week-stat-value">&#8377;{weekRevenue.toLocaleString('en-IN')}</div>
            <div className="week-stat-label">This week&apos;s revenue</div>
          </div>
        </div>
      </div>

      <div className="week-chart">
        <div className="week-chart-header">
          <div className="week-chart-label">Appointments this {chartView}</div>
          <div className="week-chart-toggle">
            <button
              type="button"
              className={chartView === 'week' ? 'active' : ''}
              onClick={() => setChartView('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={chartView === 'month' ? 'active' : ''}
              onClick={() => setChartView('month')}
            >
              Month
            </button>
          </div>
        </div>
        <div className="week-chart-bars">
          {chartCols.map(col => (
            <div className="week-chart-col" key={col.key}>
              <div className="week-chart-bar-track">
                <div
                  className="week-chart-bar"
                  style={{ height: `${Math.max(6, col.heightPct * 60)}px` }}
                  title={col.title}
                />
              </div>
              <div className="week-chart-count">{col.count}</div>
              <div className="week-chart-day">{col.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekSummary;
