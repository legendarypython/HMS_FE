import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './AppNavbar.css';

const LINKS_BY_ROLE = {
  public: [
    { to: '/', label: 'Home' },
    { to: '/book-appointment', label: 'Book Appointment', cta: true },
    { to: '/login', label: 'Login' }
  ],
  owner: [
    { to: '/dashboard', label: 'Patients' },
    { to: '/doctors', label: 'Doctors' },
    { to: '/appointments', label: 'Appointments' }
  ],
  manager: [
    { to: '/dashboard', label: 'Patients' },
    { to: '/doctors', label: 'Doctors' },
    { to: '/appointments', label: 'Appointments' }
  ],
  patient: [
    { to: '/patient/my-record', label: 'My Record' }
  ]
};

const AppNavbar = ({ role = 'public' }) => {
  const history = useHistory();
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

      <button
        className="app-navbar-toggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(open => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`app-navbar-links ${menuOpen ? 'app-navbar-links--open' : ''}`}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`app-navbar-link ${link.cta ? 'app-navbar-cta' : ''}`}
            onClick={closeMenu}
          >
            {link.label}
          </Link>
        ))}
        {isAuthenticated && (
          <button className="app-navbar-link app-navbar-logout" onClick={handleLogout}>
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
};

export default AppNavbar;
