import React, { useEffect } from 'react';
import Icon from './Icon';
import './Drawer.css';

// Generic right-side slide-over - not tied to patients specifically, so any
// future "inspect without losing your place" need (a doctor, an
// appointment) can reuse this instead of building its own panel.
const Drawer = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Prevent the page behind the drawer from scrolling while it's open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`ui-drawer-backdrop ${open ? 'ui-drawer-backdrop-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`ui-drawer ${open ? 'ui-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
      >
        <div className="ui-drawer-header">
          <h3>{title}</h3>
          <button type="button" className="ui-drawer-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="ui-drawer-body">
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer;
