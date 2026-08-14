import React, { useState, useEffect, useCallback } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import { TENANT_CONFIG } from '../../config/tenant';
import { generateTimeSlots, formatSlotLabel, isClinicClosed } from '../../utils/timeSlots';
import './DoctorAvailability.css';

const TIME_SLOTS = generateTimeSlots(TENANT_CONFIG.opdWindows);
const DAY_LABEL = { weekday: 'short', day: 'numeric', month: 'short' };

// yyyy-mm-dd for a Date built from "today + offset days" - built via Date
// arithmetic (not string manipulation) so month/year rollovers are handled
// correctly, then formatted back with toLocaleDateString('en-CA') to avoid
// the UTC-shift bug plain .toISOString() would introduce (same pattern
// BookAppointment.js already uses for "today").
const dateStringForOffset = (offsetDays) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-CA');
};

const key = (date, timeSlot) => `${date}|${timeSlot}`;
const dayLabel = (date) => new Date(date + 'T00:00:00').toLocaleDateString('en-IN', DAY_LABEL);

const DoctorAvailability = () => {
  const role = sessionStorage.getItem('userRole');
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [weekStart, setWeekStart] = useState(0); // offset in days from today
  const [blockedSet, setBlockedSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dates = Array.from({ length: 7 }, (_, i) => dateStringForOffset(weekStart + i));

  useEffect(() => {
    apiFetch(`${API_BASE}/api/doctors/all`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => {
        const active = (json.data || []).filter(d => d.active);
        setDoctors(active);
        if (active.length === 1) setDoctorId(active[0]._id);
      })
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  const fetchBlocks = useCallback(() => {
    if (!doctorId) return;
    setLoading(true);
    const from = dates[0];
    const to = dates[dates.length - 1];
    apiFetch(`${API_BASE}/api/doctors/${doctorId}/unavailability?from=${from}&to=${to}`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => {
        const blocks = json.data?.blocks || [];
        setBlockedSet(new Set(blocks.map(b => key(b.date, b.timeSlot))));
      })
      .catch(err => console.error('Error fetching availability:', err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, weekStart]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const toggleCell = async (date, timeSlot) => {
    const blocked = !blockedSet.has(key(date, timeSlot));
    // Optimistic update - a slow network shouldn't make each click feel
    // unresponsive; fetchBlocks() below reconciles with the real state
    // regardless, so a failed request just gets corrected a moment later.
    setBlockedSet(prev => {
      const next = new Set(prev);
      if (blocked) next.add(key(date, timeSlot)); else next.delete(key(date, timeSlot));
      return next;
    });
    setError('');
    try {
      const res = await apiFetch(`${API_BASE}/api/doctors/${doctorId}/unavailability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ date, timeSlot, blocked }),
      });
      if (!res.ok) throw new Error('Request failed');
    } catch (err) {
      console.error('Error toggling availability:', err);
      setError('Could not save that change - please try again.');
      fetchBlocks();
    }
  };

  const toggleWholeDay = async (date) => {
    const slotsForDate = TIME_SLOTS.filter(s => !isClinicClosed(date, TENANT_CONFIG.closedDays));
    if (slotsForDate.length === 0) return;
    // If every slot that day is already blocked, the action is "clear the
    // whole day"; otherwise it's "block whatever's still open" - matches
    // what a glance at the column would suggest either button should do.
    const allBlocked = slotsForDate.every(s => blockedSet.has(key(date, s.value)));
    const blocked = !allBlocked;
    setError('');
    try {
      await Promise.all(slotsForDate.map(s =>
        apiFetch(`${API_BASE}/api/doctors/${doctorId}/unavailability`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ date, timeSlot: s.value, blocked }),
        })
      ));
      fetchBlocks();
    } catch (err) {
      console.error('Error toggling whole day:', err);
      setError('Could not save that change - please try again.');
      fetchBlocks();
    }
  };

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        <PageHeader icon="calendar-off" title="Availability" subtitle="Block the days or time slots you won't be seeing patients - blocked slots disappear from the public booking page." />

        {doctors.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <select className="ui-select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} style={{ maxWidth: 320 }}>
              <option value="">Select a doctor</option>
              {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        )}

        {error && <div className="ui-banner ui-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

        {!doctorId ? (
          <p className="text-muted">Select a doctor to manage their availability.</p>
        ) : (
          <Card>
            <div className="avail-nav">
              <Button size="sm" variant="secondary" onClick={() => setWeekStart(w => w - 7)}>&larr; Previous week</Button>
              <Button size="sm" variant="secondary" onClick={() => setWeekStart(0)} disabled={weekStart === 0}>This week</Button>
              <Button size="sm" variant="secondary" onClick={() => setWeekStart(w => w + 7)}>Next week &rarr;</Button>
            </div>

            {loading ? (
              <Spinner label="Loading availability..." />
            ) : (
              <div className="avail-grid-wrap">
                <table className="avail-grid">
                  <thead>
                    <tr>
                      <th></th>
                      {dates.map(date => {
                        const closed = isClinicClosed(date, TENANT_CONFIG.closedDays);
                        return (
                          <th key={date} className={closed ? 'avail-col-closed' : ''}>
                            <button
                              type="button"
                              className="avail-day-toggle"
                              onClick={() => !closed && toggleWholeDay(date)}
                              disabled={closed}
                              title={closed ? 'Clinic closed' : 'Toggle whole day'}
                            >
                              {dayLabel(date)}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(slot => (
                      <tr key={slot.value}>
                        <td className="avail-row-label">{formatSlotLabel(slot.value)}</td>
                        {dates.map(date => {
                          const closed = isClinicClosed(date, TENANT_CONFIG.closedDays);
                          const blocked = blockedSet.has(key(date, slot.value));
                          return (
                            <td key={date}>
                              <button
                                type="button"
                                className={`avail-cell ${closed ? 'avail-cell-closed' : blocked ? 'avail-cell-blocked' : 'avail-cell-open'}`}
                                onClick={() => !closed && toggleCell(date, slot.value)}
                                disabled={closed}
                                aria-label={`${closed ? 'Closed' : blocked ? 'Blocked' : 'Available'} - ${dayLabel(date)} ${formatSlotLabel(slot.value)}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="avail-legend">
              <span><i className="avail-cell avail-cell-open" /> Available</span>
              <span><i className="avail-cell avail-cell-blocked" /> Blocked</span>
              <span><i className="avail-cell avail-cell-closed" /> Clinic closed</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorAvailability;
