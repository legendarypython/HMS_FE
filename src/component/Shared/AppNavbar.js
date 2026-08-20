import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';
import IconBadge from '../ui/IconBadge';
import { TENANT_CONFIG, TENANT_ID } from '../../config/tenant';
import './AppNavbar.css';

const LINKS_BY_ROLE = {
  public: [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/book-appointment', label: 'Book Appointment', icon: 'calendar', cta: true },
    { to: '/login', label: 'Login', icon: 'lock' }
  ],
  owner: [
    { to: '/dashboard', label: 'Dashboard', icon: 'home' },
    { to: '/patients', label: 'Patients', icon: 'users' },
    { to: '/doctors', label: 'Doctors', icon: 'stethoscope' },
    { to: '/appointments', label: 'Appointments', icon: 'calendar' },
    { to: '/availability', label: 'Availability', icon: 'calendar-off' },
    { to: '/payment-qr', label: 'Payment QR', icon: 'qr-code' },
    // ABDM Section 17 certification was never actually completed - demo
    // tenant only (see the same restriction on the /scan-qr route itself,
    // ScanShareQr.js, which is the real enforcement; this just keeps the
    // link from pointing anywhere real staff would follow it).
    ...(TENANT_ID === 'demo' ? [{ to: '/scan-qr', label: 'Scan & Share', icon: 'qr-code' }] : [])
  ],
  // Deliberately narrow - per the owner's explicit request, staff with this
  // role can add patients and view appointments, nothing else. Dashboard,
  // Doctors, and Availability are owner-only now (also enforced at the
  // route level in App.js, not just hidden here - a hidden nav link alone
  // wouldn't stop a direct URL visit).
  manager: [
    { to: '/patients', label: 'Patients', icon: 'users' },
    { to: '/appointments', label: 'Appointments', icon: 'calendar' },
  ],
  patient: [
    { to: '/patient/my-record', label: 'My Record', icon: 'file' }
  ]
};

// The brand link previously always pointed to "/" - for a logged-in staff
// member that meant clicking the hospital name kicked them out to the
// public homepage instead of staying in their dashboard.
const BRAND_LINK_BY_ROLE = {
  public: '/',
  owner: '/dashboard',
  manager: '/patients',
  patient: '/patient/my-record'
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
  // Only ever set on login (see Login.js) - a session from before this
  // existed simply won't have one until the next real login, so this
  // gracefully renders nothing rather than a blank chip.
  const userName = isAuthenticated ? sessionStorage.getItem('userName') : '';
  const roleLabel = role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : '';

  // Staff (owner/manager) get a persistent left sidebar on wide screens
  // instead of the top bar - matches a real admin-tool layout, and this is
  // the role that lives inside the app all day, unlike a patient checking
  // their record once or a first-time visitor on the public site. Public
  // and patient roles keep the top bar unchanged at every width; every role
  // still gets the same slide-over drawer on narrow screens (see the
  // .app-navbar--sidebar media query in AppNavbar.css, which only differs
  // from .app-navbar above a breakpoint - below it, this class adds nothing).
  const isStaffRole = role === 'owner' || role === 'manager';

  // .page (and .app-footer) need to know a sidebar is eating the left 240px
  // of the viewport so their own content shifts right - reaching out to
  // toggle a body class is a pragmatic way to do that without threading a
  // "sidebar active" flag through every single staff page's own layout
  // JSX (every one of them already renders this same <AppNavbar> as a
  // top-level sibling of the page content it's shifting).
  useEffect(() => {
    document.body.classList.toggle('has-sidebar-nav', isStaffRole);
    return () => document.body.classList.remove('has-sidebar-nav');
  }, [isStaffRole]);

  const handleLogout = () => {
    sessionStorage.removeItem('usertoken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('userName');
    setMenuOpen(false);
    history.push('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`app-navbar ${hidden ? 'app-navbar--hidden' : ''} ${isStaffRole ? 'app-navbar--sidebar' : ''}`}>
      <Link to={BRAND_LINK_BY_ROLE[role] || '/'} className="app-navbar-brand" onClick={closeMenu}>
        <IconBadge name="heart" variant="brand" size="sm" className="ui-icon-badge-inline" />
        {TENANT_CONFIG.name}
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
            className={`app-navbar-link ${link.cta ? 'app-navbar-cta' : ''} ${location.pathname === link.to ? 'app-navbar-link-active' : ''}`}
            onClick={closeMenu}
          >
            <Icon name={link.icon} size={18} className="app-navbar-link-icon" />
            <span className="app-navbar-link-label">{link.label}</span>
            {!link.cta && <Icon name="chevron-right" size={16} className="app-navbar-link-chevron" />}
          </Link>
        ))}
        {userName && (
          <div className="app-navbar-user-chip">
            <span className="ui-avatar app-navbar-user-avatar">
              {userName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="app-navbar-user-name">{userName}</div>
              {roleLabel && <div className="app-navbar-user-role">{roleLabel}</div>}
            </div>
          </div>
        )}
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
