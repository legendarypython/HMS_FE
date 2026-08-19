import React from 'react';
import Icon from './Icon';
import './ui.css';

// Vertical section list for a guided multi-step create form (Add Patient/
// AnteNatal/Infertility) - distinct from Tabs.js (horizontal, free-roam,
// used by the read views and edit mode) because this one also encodes step
// progress. A step past furthestStep is shown (so you can see what's coming)
// but not clickable - the wizard only reaches it once Next has validated
// every step before it, so jumping ahead can't silently skip required
// fields the way free-roam tabs could.
const StepTracker = ({ steps, active, furthestStep, onChange }) => (
  <div className="ui-step-tracker" role="tablist" aria-orientation="vertical">
    {steps.map((step, i) => {
      const isActive = active === step.key;
      const isDone = i < furthestStep;
      const isReachable = i <= furthestStep;
      return (
        <button
          key={step.key}
          type="button"
          role="tab"
          aria-selected={isActive}
          disabled={!isReachable}
          className={`ui-step-item ${isActive ? 'ui-step-active' : ''} ${isDone ? 'ui-step-done' : ''}`}
          onClick={() => onChange(step.key)}
        >
          <span className="ui-step-icon">
            <Icon name={isDone ? 'check' : step.icon} size={16} />
          </span>
          <span>{step.label}</span>
        </button>
      );
    })}
  </div>
);

export default StepTracker;
