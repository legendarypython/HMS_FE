import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Icon from './Icon';
import './DateInput.css';

const pad = (n) => String(n).padStart(2, '0');

// Parses the app's stored 'YYYY-MM-DD' string into a local Date - never via
// `new Date(str)`, which parses a bare yyyy-mm-dd as UTC midnight and can
// silently roll the date back a day depending on the browser's timezone.
const parseLocalDate = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Inverse - built from local Y/M/D getters, not toISOString() (which
// converts to UTC first and can shift the date near midnight), matching the
// pattern already used elsewhere in this app (BookAppointment's TODAY,
// DoctorAvailability's dateStringForOffset).
const toDateString = (date) =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '';

// Drop-in replacement for a native <input type="date">, built on
// react-datepicker (already a dependency, previously only used in Admin.js's
// filters) but reskinned to match this app's design system instead of the
// library's default look - the same complaint that prompted the custom
// Select component. Keeps the same string-in/string-out contract every call
// site already has (value/onChange both work with 'YYYY-MM-DD' strings), so
// converting a call site is just a tag + prop-name swap, and the emitted
// onChange event is native-shaped ({target:{value,id,name}}) for the same
// reason Select's is - some handlers key off id, others off name.
const DateInput = ({
  id,
  name,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  placeholder = 'dd-mm-yyyy',
  className = '',
}) => (
  <div className={`ui-date-wrap ${className}`}>
    <DatePicker
      id={id}
      name={name}
      selected={parseLocalDate(value)}
      onChange={(date) => onChange({ target: { value: toDateString(date), id, name } })}
      minDate={parseLocalDate(min)}
      maxDate={parseLocalDate(max)}
      disabled={disabled}
      required={required}
      placeholderText={placeholder}
      dateFormat="dd-MM-yyyy"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      className="ui-date-input"
      autoComplete="off"
    />
    <Icon name="calendar" size={16} className="ui-date-icon" />
  </div>
);

export default DateInput;
