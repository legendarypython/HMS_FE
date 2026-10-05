import React from 'react';
import { Link } from 'react-router-dom';
import './ui.css';

const VARIANT_CLASS = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  danger: 'ui-btn-danger',
  success: 'ui-btn-success',
  ghost: 'ui-btn-ghost'
};

// `to` renders a react-router <Link>, `href` a plain <a> (external links,
// tel:, mailto:) - both styled as a button, so a navigation is one real link
// instead of a <button> nested inside an <a> (invalid HTML, two tab stops).
const Button = ({ variant = 'primary', size, className = '', children, to, href, ...rest }) => {
  const classes = [
    'ui-btn',
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    size === 'sm' ? 'ui-btn-sm' : '',
    size === 'lg' ? 'ui-btn-lg' : '',
    className
  ].filter(Boolean).join(' ');

  if (to) {
    return <Link className={classes} to={to} {...rest}>{children}</Link>;
  }
  if (href) {
    return <a className={classes} href={href} {...rest}>{children}</a>;
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
