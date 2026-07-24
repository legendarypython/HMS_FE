import React from 'react';
import './ui.css';

const VARIANT_CLASS = {
  default: '',
  elevated: 'ui-card-elevated',
  interactive: 'ui-card-interactive ui-hover-lift',
  tinted: 'ui-card-tinted',
};

const Card = ({ className = '', variant = 'default', children, ...rest }) => (
  <div className={`ui-card ${VARIANT_CLASS[variant] || ''} ${className}`} {...rest}>
    {children}
  </div>
);

export default Card;
