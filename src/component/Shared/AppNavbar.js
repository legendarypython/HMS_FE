import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';
import './AppNavbar.css';

const LINKS_BY_ROLE = {
  public: [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/book-appointment', label: 'Book Appointment', icon: 'calendar', cta: true },
    { to: '/login', label: 'Login', icon: 'lock' }
  ],
  owner: [
    { to: '/dashboard', label: 'Patients', icon: 'users' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
    { to: '/appointments', label: 'Appointments', icon: 'calendar' }
  ],
  manager: [
    { to: '/dashboard', label: 'Patients', icon: 'users' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
    { to: '/appointments', label: 'Appointments', icon: 'calendar' }
  ],
  patient: [
    { to: '/patient/my-record', label: 'My Record', icon: 'file' }
  ]
};

const AppNavbar = ({ role = 'public' }) => {
  const history = useHistory();
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.pageYOffset;
      // Don't auto-hide while the mobile menu is open, and don't hide-on-scroll on mobile at all
      // (the menu itself becomes the primary nav surface there).
      setHidden(current > lastScroll.current && current > 80 && !menuOpen);
      lastScroll.current = current;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  const links = LINKS_BY_ROLE[role] || LINKS_BY_ROLE.public;
  const isAuthenticated = role !== 'public';

  const handleLogout = () => {
    sessionStorage.removeItem('usertoken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userData');
    setMenuOpen(false);
    history.push('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`app-navbar ${hidden ? 'app-navbar--hidden' : ''}`}>
      <Link to="/" className="app-navbar-brand" onClick={closeMenu}>
        Panchkuiyan Hospital
      </Link>

      <div className="app-navbar-mobile-actions">
        {role === 'public' && location.pathname === '/' && (
          <Link to="/login" className="app-navbar-mobile-login" onClick={closeMenu}>
            <Icon name="user" size={16} /> Login
          </Link>
        )}
        <button
          className={`app-navbar-toggle ${menuOpen ? 'app-navbar-toggle--open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`app-navbar-backdrop ${menuOpen ? 'app-navbar-backdrop--open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div className={`app-navbar-links ${menuOpen ? 'app-navbar-links--open' : ''}`}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`app-navbar-link ${link.cta ? 'app-navbar-cta' : ''}`}
            onClick={closeMenu}
          >
            <Icon name={link.icon} size={18} className="app-navbar-link-icon" />
            <span className="app-navbar-link-label">{link.label}</span>
            {!link.cta && <Icon name="chevron-right" size={16} className="app-navbar-link-chevron" />}
          </Link>
        ))}
        {isAuthenticated && (
          <button className="app-navbar-link app-navbar-logout" onClick={handleLogout}>
            <Icon name="logout" size={18} className="app-navbar-link-icon" />
            <span className="app-navbar-link-label">Log Out</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default AppNavbar;
