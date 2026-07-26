// Hourly appointment slots derived from a clinic's OPD windows (see
// config/tenant.js). Slot values are stored/sent as "HH:00-HH:00" (24h,
// unambiguous); labels are the friendly 12h display form.

const formatHour = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12} ${period}`;
};

export const formatSlotLabel = (value) => {
  const match = /^(\d{2}):00-(\d{2}):00$/.exec(value || '');
  if (!match) return value || '-';
  return `${formatHour(parseInt(match[1], 10))} - ${formatHour(parseInt(match[2], 10))}`;
};

export const generateTimeSlots = (windows = []) => {
  const slots = [];
  windows.forEach(([start, end]) => {
    for (let hour = start; hour < end; hour++) {
      const value = `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`;
      slots.push({ value, label: formatSlotLabel(value) });
    }
  });
  return slots;
};

export const formatWindowsSummary = (windows = []) =>
  windows.map(([start, end]) => `${formatHour(start)} - ${formatHour(end)}`).join(', ');

export const isClinicClosed = (dateStr, closedDays = []) => {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  return closedDays.includes(new Date(year, month - 1, day).getDay());
};
