import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Footer from '../Footer';
import Button from '../ui/Button';
import { API_BASE } from '../../utils/api';
import hospitalImage from '../../photos/hospital.jpg';
import './Home.css';

const Home = () => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/doctors/public`)
      .then(res => res.json())
      .then(json => setDoctors(json.data || []))
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  return (
    <div>
      <AppNavbar role="public" />

      <section className="home-hero" style={{ backgroundImage: `url(${hospitalImage})` }}>
        <div className="home-hero-content">
          <h1>Panchkuiyan Hospital</h1>
          <p>Compassionate, accessible healthcare for the community.</p>
          <Link to="/book-appointment">
            <Button variant="secondary" className="hero-cta-btn">Book an Appointment</Button>
          </Link>
        </div>
      </section>

      <section className="home-section">
        <span className="ui-eyebrow">About Us</span>
        <h2 className="section-title">A Gynaecology Hospital, Built Around Our Patients</h2>
        <p>
          Panchkuiyan Hospital is a small, dedicated gynaecology and antenatal care practice
          led by Dr. Bhavana Gupta (MBBS, MS). We focus on giving every patient the time,
          attention, and continuity of care that comes from seeing the same trusted doctor
          throughout your pregnancy or treatment - not a rotating cast of unfamiliar faces.
        </p>
      </section>

      {doctors.length > 0 && (
        <section className="home-section home-section-alt">
          <span className="ui-eyebrow">Meet The Team</span>
          <h2 className="section-title">Our Doctors</h2>
          <div className="doctor-grid">
            {doctors.map(doc => (
              <div className="doctor-card ui-card" key={doc._id}>
                {doc.hasPhoto ? (
                  <img
                    src={`${API_BASE}/api/doctors/${doc._id}/photo`}
                    alt={doc.name}
                    className="doctor-card-photo"
                  />
                ) : (
                  <span className="ui-avatar doctor-card-avatar">
                    {(doc.name || '').replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                  </span>
                )}
                <h4>{doc.name}</h4>
                <p className="text-muted">{doc.specialization}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="cta-section">
        <span className="ui-eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Get Started</span>
        <h2>Ready to see a doctor?</h2>
        <p>Book an appointment online in a few seconds - no account required.</p>
        <Link to="/book-appointment">
          <Button variant="secondary" style={{ backgroundColor: '#fff' }}>Book Now</Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
