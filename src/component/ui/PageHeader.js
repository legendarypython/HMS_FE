import React from 'react';
import IconBadge from './IconBadge';
import './ui.css';

// Icon badge + title, used at the top of every dashboard/list page instead
// of a bare heading - one shared pattern rather than each screen re-laying
// it out by hand.
const PageHeader = ({ icon, title, variant = 'primary' }) => (
  <div className="ui-page-header">
    <IconBadge name={icon} variant={variant} className="ui-icon-badge-inline" />
    <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
  </div>
);

export default PageHeader;
