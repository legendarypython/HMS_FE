import React from 'react';
import { TENANT_CONFIG, TENANT_ID } from '../config/tenant';
import { mailtoHref, telHref } from '../utils/contact';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="app-footer-grid">
      <div className="app-footer-col">
        <h5>Contact us</h5>
        <p>Email: <a className="app-footer-link" href={mailtoHref()}>{TENANT_CONFIG.email}</a></p>
        <p>Phone: <a className="app-footer-link" href={telHref()}>{TENANT_CONFIG.phone}</a></p>
      </div>
      <div className="app-footer-col">
        <h5>Address</h5>
        <p>{TENANT_CONFIG.address}</p>
      </div>
    </div>
    <div className="app-footer-copyright">
      © {new Date().getFullYear()} {TENANT_CONFIG.name}
      {TENANT_ID === 'demo' && <> · Powered by Clinic Sathi</>}
    </div>
    <div className="app-footer-copyright">
      {TENANT_CONFIG.name} is operated by {TENANT_CONFIG.legalName}.
    </div>
  </footer>
);

export default Footer;
