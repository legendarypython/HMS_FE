import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="app-footer-grid">
      <div className="app-footer-col">
        <h5>Contact us</h5>
        <p>Email: bhavanarmsk7@gmail.com</p>
        <p>Phone: 7686968650</p>
      </div>
      <div className="app-footer-col">
        <h5>Address</h5>
        <p>1/89, Panchkuian Hospital, Panchkuian, near Mathur Vaishya Bhawan, Agra</p>
      </div>
    </div>
    <div className="app-footer-copyright">
      © {new Date().getFullYear()} Panchkuiyan Hospital
    </div>
  </footer>
);

export default Footer;
