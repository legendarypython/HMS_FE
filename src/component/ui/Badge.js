import React from 'react';
import './ui.css';

const Badge = ({ variant = 'neutral', children }) => (
  <span className={`ui-badge ui-badge-${variant}`}>{children}</span>
);

export default Badge;
