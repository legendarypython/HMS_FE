import React from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from './AppNavbar';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';

const NotFound = () => (
  <div>
    <AppNavbar role="public" />
    <div className="page page-narrow" style={{ textAlign: 'center' }}>
      <IconBadge name="map-pin" variant="neutral" />
      <h2 className="section-title">Page Not Found</h2>
      <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/"><Button>Back to Home</Button></Link>
    </div>
  </div>
);

export default NotFound;
