import React from 'react';
import { TENANT_CONFIG } from '../config/tenant';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="app-footer-grid">
      <div className="app-footer-col">
        <h5>Contact us</h5>
        <p>Email: {TENANT_CONFIG.email}</p>
        <p>Phone: {TENANT_CONFIG.phone}</p>
      </div>
      <div className="app-footer-col">
        <h5>Address</h5>
        <p>{TENANT_CONFIG.address}</p>
      </div>
    </div>
    <div className="app-footer-copyright">
      © {new Date().getFullYear()} {TENANT_CONFIG.name}
    </div>
  </footer>
);

export default Footer;
