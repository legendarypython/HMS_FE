import React from 'react';
import Icon from './Icon';
import './ui.css';

// Reusable tab strip for record-detail pages (Patient/AnteNatal/Infertility
// views) - swaps which section renders below, instead of one long
// always-visible scroll. Purely presentational - the parent owns the
// active-tab state and which content each key maps to.
const Tabs = ({ tabs, active, onChange }) => (
  <div className="ui-tabs" role="tablist">
    {tabs.map(tab => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={active === tab.key}
        className={`ui-tab ${active === tab.key ? 'ui-tab-active' : ''}`}
        onClick={() => onChange(tab.key)}
      >
        {tab.icon && <Icon name={tab.icon} size={16} />}
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
