import React from 'react';
import './ui.css';

const Card = ({ className = '', children, ...rest }) => (
  <div className={`ui-card ${className}`} {...rest}>
    {children}
  </div>
);

export default Card;
