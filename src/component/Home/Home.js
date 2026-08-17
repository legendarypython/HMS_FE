import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../Shared/AppNavbar';
import Footer from '../Footer';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Icon from '../ui/Icon';
import IconBadge from '../ui/IconBadge';
import { API_BASE, apiFetch } from '../../utils/api';
import { TENANT_CONFIG } from '../../config/tenant';
import useScrollReveal from '../../hooks/useScrollReveal';
import './Home.css';

// Each card states the industry norm a patient is used to (struck through)
// next to what this practice does instead - a rebuttal to a specific bounce
// trigger, not just a feature description.
const FEATURES = [
  {
    icon: 'heart',
    title: 'Continuity of Care',
    norm: 'Rotating doctors',
    benefit: `Instead, you see ${TENANT_CONFIG.doctorName} - every single visit.`,
  },
  {
    icon: 'calendar',
    title: 'Simple Online Booking',
    norm: 'App downloads & account walls',
    benefit: 'Instead, book online in under a minute - no login needed.',
  },
  {
    icon: 'shield',
    title: 'Personal Attention',
    norm: 'Rushed 5-minute slots',
    benefit: 'Instead, you get real, unhurried time with your doctor.',
  },
];

const Home = () => {
  const [doctors, setDoctors] = useState([]);
  // Shows a persistent "Book Appointment" bar on mobile once the patient's
  // scrolled past the hero's own big CTA button, so booking is always one
  // tap away without scrolling back to the top.
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/doctors/public`)
      .then(res => res.json())
      .then(json => setDoctors(json.data || []))
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 480);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hooks must be called unconditionally, even though the doctors section
  // itself only renders once doctors.length > 0.
  const [statRef, statVisible] = useScrollReveal();
  const [aboutRef, aboutVisible] = useScrollReveal();
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [doctorsRef, doctorsVisible] = useScrollReveal();
  const [visitRef, visitVisible] = useScrollReveal();
  const [ctaRef, ctaVisible] = useScrollReveal();

  return (
    <div>
      <AppNavbar role="public" />

      <section className="home-hero">
        <div
          className="home-hero-photo"
          style={{ backgroundImage: `url(${TENANT_CONFIG.heroBgImage})` }}
          aria-hidden="true"
        />
        <div className="home-hero-scrim" aria-hidden="true" />
        <div className="home-hero-blob home-hero-blob-1" aria-hidden="true" />
        <div className="home-hero-blob home-hero-blob-2" aria-hidden="true" />
        <div className="home-hero-content home-hero-content-split">
          <div className="home-hero-promise">
            <span className="hero-badge">
              <Icon name="stethoscope" size={15} /> MBBS, MS &middot; Gynaecology &amp; Antenatal Care
            </span>
            <h1>{TENANT_CONFIG.doctorName}, with you from first visit to delivery.</h1>
            <p>{TENANT_CONFIG.name} is a focused gynaecology practice built around one thing: knowing your name and your history, every time you walk in.</p>
          </div>
          <div className="home-hero-cta-card">
            <Link to="/book-appointment">
              <Button variant="primary" size="lg" style={{ width: '100%' }}>
                Book with {TENANT_CONFIG.doctorName} <Icon name="arrow-right" size={18} />
              </Button>
            </Link>
            <p className="hero-cta-microline">No app. No account. Under a minute.</p>
          </div>
        </div>
      </section>

      <section className={`stat-strip ui-reveal ${statVisible ? 'ui-reveal-visible' : ''}`} ref={statRef}>
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

      <section className={`home-section about-section ui-reveal ${aboutVisible ? 'ui-reveal-visible' : ''}`} ref={aboutRef}>
        <div className="about-section-text">
          <span className="ui-eyebrow">About Us</span>
          <h2 className="section-title">A Gynaecology Hospital, Built Around Our Patients</h2>
          <p>
            {TENANT_CONFIG.name} is a small, dedicated gynaecology and antenatal care practice
            led by {TENANT_CONFIG.doctorName} (MBBS, MS). We focus on giving every patient the time,
            attention, and continuity of care that comes from seeing the same trusted doctor
            throughout your pregnancy or treatment - not a rotating cast of unfamiliar faces.
          </p>
          <span className="ui-badge ui-badge-primary trust-badge">
            <Icon name="shield" size={13} /> ABDM Registered Facility
          </span>
        </div>
        <img
          src={TENANT_CONFIG.heroImage1}
          alt={TENANT_CONFIG.doctorName}
          className="about-section-photo"
        />
      </section>

      <section className={`home-section features-section ui-reveal ${featuresVisible ? 'ui-reveal-visible' : ''}`} ref={featuresRef}>
        <span className="ui-eyebrow">Why Choose Us</span>
        <h2 className="section-title">What Makes Care Here Different</h2>
        <div className="feature-grid">
          {FEATURES.map(f => (
            <Card className="feature-card" variant="interactive" key={f.title}>
              <IconBadge name={f.icon} />
              <h3>{f.title}</h3>
              <p className="feature-card-norm">{f.norm}</p>
              <p className="feature-card-benefit">{f.benefit}</p>
            </Card>
          ))}
        </div>
        <div className="features-section-cta">
          <Link to="/book-appointment">
            <Button size="lg">
              Book with {TENANT_CONFIG.doctorName} <Icon name="arrow-right" size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {doctors.length > 0 && (
        <section className={`home-section home-section-alt ui-reveal ${doctorsVisible ? 'ui-reveal-visible' : ''}`} ref={doctorsRef}>
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

      <section className={`home-section visit-section ui-reveal ${visitVisible ? 'ui-reveal-visible' : ''}`} ref={visitRef}>
        <img
          src={TENANT_CONFIG.heroImage2}
          alt={`${TENANT_CONFIG.name} signboard`}
          className="visit-section-photo visit-section-photo-tall"
        />
        <div className="visit-section-text">
          <span className="ui-eyebrow">Visit Us</span>
          <h2 className="section-title">Find Us in Agra</h2>
          <p>{TENANT_CONFIG.address}</p>
        </div>
      </section>

      <section className={`cta-section ui-reveal ${ctaVisible ? 'ui-reveal-visible' : ''}`} ref={ctaRef}>
        <div
          className="cta-section-photo-bg"
          style={{ backgroundImage: `url(${TENANT_CONFIG.ctaBgImage})` }}
          aria-hidden="true"
        />
        <div className="cta-section-scrim" aria-hidden="true" />
        <div className="cta-section-blob" aria-hidden="true" />
        <img
          src={TENANT_CONFIG.ctaImage}
          alt={TENANT_CONFIG.doctorName}
          className="cta-section-photo"
        />
        <span className="ui-eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Get Started</span>
        <span className="cta-time-chip">
          <Icon name="clock" size={13} /> ~30 seconds
        </span>
        <h2>Book with {TENANT_CONFIG.doctorName} in about 30 seconds.</h2>
        <p>Trusted gynaecology &amp; antenatal care in Agra - no paperwork, no phone tag.</p>
        <Link to="/book-appointment">
          <Button variant="secondary" className="cta-btn-light" size="lg">
            Book My Appointment <Icon name="arrow-right" size={18} />
          </Button>
        </Link>
        <p className="cta-microline">No account. No app. No wait.</p>
      </section>

      <Footer />

      <div className={`mobile-sticky-cta ${showStickyCta ? 'mobile-sticky-cta-visible' : ''}`}>
        <Link to="/book-appointment">
          <Button variant="primary" size="lg" style={{ width: '100%' }}>
            Book Appointment <Icon name="arrow-right" size={18} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
