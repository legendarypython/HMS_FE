import React, { useState } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import { API_BASE } from '../../utils/api';
import './Login.css';

const Login = () => {
  const [step, setStep] = useState('mobile'); // mobile | password | otp | not_found
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const json = await res.json();
      setName(json.name || '');
      if (json.type === 'staff') {
        setStep('password');
      } else if (json.type === 'patient') {
        await requestOtp();
      } else {
        setStep('not_found');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    const res = await fetch(`${API_BASE}/api/auth/patient/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.message || 'Could not send OTP');
      return;
    }
    setDevOtp(json.devOtp || '');
    setStep('otp');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Invalid mobile or password');
        return;
      }
      sessionStorage.setItem('usertoken', json.token);
      sessionStorage.setItem('userRole', json.role);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/patient/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Invalid OTP');
        return;
      }
      sessionStorage.setItem('usertoken', json.token);
      sessionStorage.setItem('userRole', json.role);
      window.location.href = '/patient/my-record';
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
        <Card className="login-card">
          {step === 'mobile' && (
            <form onSubmit={handleMobileSubmit}>
              <span className="ui-eyebrow">Welcome Back</span>
              <h2>Log In</h2>
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

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <span className="ui-eyebrow">{name ? `Welcome, ${name}` : 'Welcome'}</span>
              <h2>Enter OTP</h2>
              <p className="login-hint">
                An OTP was sent to {mobile}.
                {devOtp && ` (dev mode, no SMS provider configured yet: ${devOtp})`}
              </p>
              {error && <div className="ui-banner ui-banner-error">{error}</div>}
              <Field label="One-Time Password" required htmlFor="otp">
                <input
                  id="otp"
                  className="ui-input"
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                />
              </Field>
              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Verifying...' : 'Verify & Log In'}
              </Button>
            </form>
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
