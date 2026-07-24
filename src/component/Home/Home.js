import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Footer from '../Footer';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Icon from '../ui/Icon';
import IconBadge from '../ui/IconBadge';
import { API_BASE } from '../../utils/api';
import './Home.css';

const FEATURES = [
  {
    icon: 'heart',
    title: 'Continuity of Care',
    body: 'You see the same doctor every visit - Dr. Bhavana Gupta - not a rotating cast of unfamiliar faces.',
  },
  {
    icon: 'calendar',
    title: 'Simple Online Booking',
    body: 'Book an appointment in a few seconds, no account or app download required.',
  },
  {
    icon: 'shield',
    title: 'Personal Attention',
    body: 'A small, focused practice means real time with your doctor, not a rushed 5-minute slot.',
  },
];

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

      <section className="home-hero">
        <div className="home-hero-blob home-hero-blob-1" aria-hidden="true" />
        <div className="home-hero-blob home-hero-blob-2" aria-hidden="true" />
        <div className="home-hero-content">
          <span className="hero-badge">
            <Icon name="stethoscope" size={15} /> MBBS, MS &middot; Gynaecology &amp; Antenatal Care
          </span>
          <h1>Care that stays with you, from first visit to delivery.</h1>
          <p>Panchkuiyan Hospital is a focused gynaecology practice built around one thing: knowing your name and your history, every time you walk in.</p>
          <Link to="/book-appointment">
            <Button variant="secondary" size="lg" className="hero-cta-btn">
              Book an Appointment <Icon name="arrow-right" size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <section className="stat-strip">
        <div className="stat-strip-inner">
          <div className="stat-item">
            <Icon name="heart" size={22} className="stat-icon" />
            <div className="stat-value">1-on-1</div>
            <div className="stat-label">Doctor continuity, every visit</div>
          </div>
          <div className="stat-item">
            <Icon name="clock" size={22} className="stat-icon" />
            <div className="stat-value">Same-Day</div>
            <div className="stat-label">Appointment booking online</div>
          </div>
          <div className="stat-item">
            <Icon name="award" size={22} className="stat-icon" />
            <div className="stat-value">MBBS, MS</div>
            <div className="stat-label">Qualified &amp; specialised care</div>
          </div>
        </div>
      </section>

      <section className="home-section about-section">
        <div className="about-section-text">
          <span className="ui-eyebrow">About Us</span>
          <h2 className="section-title">A Gynaecology Hospital, Built Around Our Patients</h2>
          <p>
            Panchkuiyan Hospital is a small, dedicated gynaecology and antenatal care practice
            led by Dr. Bhavana Gupta (MBBS, MS). We focus on giving every patient the time,
            attention, and continuity of care that comes from seeing the same trusted doctor
            throughout your pregnancy or treatment - not a rotating cast of unfamiliar faces.
          </p>
        </div>
        <img
          src="/images/clinic-entrance.webp"
          alt="Panchkuiyan Hospital entrance"
          className="about-section-photo"
        />
      </section>

      <section className="home-section features-section">
        <span className="ui-eyebrow">Why Choose Us</span>
        <h2 className="section-title">What Makes Care Here Different</h2>
        <div className="feature-grid">
          {FEATURES.map(f => (
            <Card className="feature-card" variant="interactive" key={f.title}>
              <IconBadge name={f.icon} />
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {doctors.length > 0 && (
        <section className="home-section home-section-alt">
          <span className="ui-eyebrow">Meet The Team</span>
          <h2 className="section-title">Our Doctors</h2>
          <div className="doctor-grid">
            {doctors.map(doc => (
              <Card className="doctor-card" variant="interactive" key={doc._id}>
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
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="home-section visit-section">
        <img
          src="/images/clinic-courtyard.webp"
          alt="Panchkuiyan Hospital courtyard"
          className="visit-section-photo"
        />
        <div className="visit-section-text">
          <span className="ui-eyebrow">Visit Us</span>
          <h2 className="section-title">Find Us in Agra</h2>
          <p>1/89, Panchkuian Hospital, Panchkuian, near Mathur Vaishya Bhawan, Agra</p>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-section-blob" aria-hidden="true" />
        <span className="ui-eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Get Started</span>
        <h2>Ready to see a doctor?</h2>
        <p>Book an appointment online in a few seconds - no account required.</p>
        <Link to="/book-appointment">
          <Button variant="secondary" className="cta-btn-light">
            Book Now <Icon name="arrow-right" size={18} />
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
