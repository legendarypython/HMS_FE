import React, { useState } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import { API_BASE } from '../../utils/api';
import { TENANT_ID } from '../../config/tenant';
import './Login.css';

const Login = () => {
  const [step, setStep] = useState('mobile'); // mobile | password | otp_unavailable | not_found
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired] = useState(() => new URLSearchParams(window.location.search).get('expired') === '1');

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/check-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        body: JSON.stringify({ mobile })
      });
      const json = await res.json();
      setName(json.name || '');
      if (json.type === 'staff') {
        setStep('password');
      } else if (json.type === 'patient') {
        // Patient OTP login (previously Firebase Phone Auth) is removed -
        // WhatsApp-based OTP is planned to replace it, not yet built.
        setStep('otp_unavailable');
      } else {
        setStep('not_found');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        body: JSON.stringify({ mobile, password })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Invalid mobile or password');
        return;
      }
      sessionStorage.setItem('usertoken', json.token);
      sessionStorage.setItem('userRole', json.role);
      // Was hardcoded to /dashboard for every role - broke manager login
      // entirely once /dashboard became owner-only (redirect landed on a
      // route manager can't access, which PrivateRoute immediately bounces
      // back to /login, an invisible redirect loop from the user's side -
      // caught this live testing the new manager account).
      window.location.href = json.role === 'owner' ? '/dashboard' : '/patients';
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppNavbar role="public" />
      <div className="login-page">
        <Card className="login-card" variant="elevated">
          <IconBadge name="lock" />
          {step === 'mobile' && (
            <form onSubmit={handleMobileSubmit}>
              <span className="ui-eyebrow">Welcome Back</span>
              <h2>Log In</h2>
              {sessionExpired && !error && (
                <div className="ui-banner ui-banner-error">Your session expired - please log in again.</div>
              )}
              {error && <div className="ui-banner ui-banner-error">{error}</div>}
              <Field label="Mobile Number" required htmlFor="mobile">
                <input
                  id="mobile"
                  className="ui-input"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Checking...' : 'Continue'}
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <span className="ui-eyebrow">{name ? `Hi, ${name}` : 'Welcome Back'}</span>
              <h2>Enter Password</h2>
              {error && <div className="ui-banner ui-banner-error">{error}</div>}
              <Field label="Password" required htmlFor="password">
                <input
                  id="password"
                  className="ui-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </Field>
              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {step === 'otp_unavailable' && (
            <div>
              <span className="ui-eyebrow">{name ? `Hi, ${name}` : 'Welcome'}</span>
              <h2>Patient Login Unavailable</h2>
              <p className="text-muted">
                OTP login for patients is temporarily unavailable while we switch providers.
                Please contact the hospital directly for assistance.
              </p>
              <Button variant="secondary" onClick={() => { setStep('mobile'); setName(''); }} style={{ width: '100%' }}>
                Back
              </Button>
            </div>
          )}

          {step === 'not_found' && (
            <div>
              <h2>No Account Found</h2>
              <p className="text-muted">
                We couldn't find a staff or patient account with this mobile number.
                Patient records are created by hospital staff - please contact us if you believe this is an error.
              </p>
              <Button variant="secondary" onClick={() => { setStep('mobile'); setName(''); }} style={{ width: '100%' }}>
                Try a different number
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;
