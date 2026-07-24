import React from 'react';
import './ui.css';

const VARIANT_CLASS = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  danger: 'ui-btn-danger',
  success: 'ui-btn-success',
  ghost: 'ui-btn-ghost'
};

const Button = ({ variant = 'primary', size, className = '', children, ...rest }) => {
  const classes = [
    'ui-btn',
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    size === 'sm' ? 'ui-btn-sm' : '',
    size === 'lg' ? 'ui-btn-lg' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
