import React from 'react';
import IconBadge from './IconBadge';
import './ui.css';

// Icon badge + title, used at the top of every dashboard/list page instead
// of a bare heading - one shared pattern rather than each screen re-laying
// it out by hand. subtitle is optional - only the dashboard's greeting/date
// line needs it so far.
const PageHeader = ({ icon, title, subtitle, variant = 'primary' }) => (
  <div className="ui-page-header">
    <IconBadge name={icon} variant={variant} className="ui-icon-badge-inline" />
    <div>
      <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
      {subtitle && <div className="text-muted ui-page-header-subtitle">{subtitle}</div>}
    </div>
  </div>
);

export default PageHeader;
