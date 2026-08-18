import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import './Select.css';

// Drop-in replacement for a native <select> - takes the same <option>
// children so existing call sites barely change (mostly just the tag
// name), but renders its own dropdown panel instead of the browser's
// native one, which read as visually inconsistent with the rest of this
// design system. onChange still receives a native-shaped event
// ({ target: { value, id, name } }) so every existing handler keeps
// working unchanged - some call sites read e.target.value directly via a
// per-field handler, others (e.g. AddAnteNatal's shared handleChange) read
// e.target.name to route a single generic handler, so both id and name
// need to be real, not just id.
//
// Deliberately doesn't try to preserve the native `required` attribute's
// browser-level form validation - every call site already does its own JS
// validation before submit (checked), so this isn't relied on anywhere.
const Select = ({ id, name, value, onChange, disabled, className = '', children }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const options = React.Children.toArray(children)
    .filter((child) => child.type === 'option')
    .map((child) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled,
    }));

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleOptionClick = (opt) => {
    if (opt.disabled) return;
    onChange({ target: { value: opt.value, id, name } });
    setOpen(false);
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className={`ui-select-wrap ${className}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={`ui-select-trigger ${disabled ? 'ui-select-trigger-disabled' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected && selected.value ? 'ui-select-value' : 'ui-select-placeholder'}>
          {selected ? selected.label : ''}
        </span>
        <Icon name="chevron-down" size={16} className={`ui-select-chevron ${open ? 'ui-select-chevron-open' : ''}`} />
      </button>
      {open && (
        <ul className="ui-select-panel" role="listbox">
          {options.map((opt) => (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={opt.value === value}
              className={`ui-select-option ${opt.value === value ? 'ui-select-option-active' : ''} ${opt.disabled ? 'ui-select-option-disabled' : ''}`}
              onClick={() => handleOptionClick(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;
