import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="app-footer-grid">
      <div className="app-footer-col">
        <h5>Contact us</h5>
        <p>Email: panchkuiyanhospital@gmail.com</p>
        <p>Phone: 7686968650</p>
      </div>
      <div className="app-footer-col">
        <h5>Address</h5>
        <p>47/77 Banerjee Para, Kolkata-700031</p>
      </div>
    </div>
    <div className="app-footer-copyright">
      © {new Date().getFullYear()} Panchkuiyan Hospital
    </div>
  </footer>
);

export default Footer;
