import React from 'react';
import './ui.css';

// size: 'sm' | 'md' | 'lg'. Set fullPage to center it in the viewport below the navbar.
const Spinner = ({ size = 'md', fullPage = false, label }) => {
  const spinner = (
    <div className={`ui-spinner-wrap ${fullPage ? 'ui-spinner-fullpage' : ''}`}>
      <div className={`ui-spinner ui-spinner-${size}`} role="status" aria-label={label || 'Loading'} />
      {label && <div className="ui-spinner-label">{label}</div>}
    </div>
  );
  return spinner;
};

export default Spinner;
