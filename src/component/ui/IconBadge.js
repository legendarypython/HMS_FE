import React from 'react';
import Icon from './Icon';
import './ui.css';

// Reusable icon-in-a-rounded-square badge, used above headings on cards
// throughout the app (Login, Book Appointment, feature cards, etc.) instead
// of each screen hand-rolling its own version.
const IconBadge = ({ name, variant = 'primary', size = 'md', className = '' }) => (
  <span className={`ui-icon-badge ui-icon-badge-${variant} ui-icon-badge-${size} ${className}`}>
    <Icon name={name} size={size === 'lg' ? 26 : 22} />
  </span>
);

export default IconBadge;
