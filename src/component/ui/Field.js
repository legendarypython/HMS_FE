import React from 'react';
import './ui.css';

// A labeled form field wrapper. Pass the input/select/textarea as children.
const Field = ({ label, required, error, htmlFor, className = '', children }) => (
  <div className={`ui-field ${className}`}>
    {label && (
      <label className="ui-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    {children}
    {error && <span className="ui-error-text">{error}</span>}
  </div>
);

export default Field;
