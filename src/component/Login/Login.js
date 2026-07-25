import React, { useState, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import AppNavbar from '../Shared/AppNavbar';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Button from '../ui/Button';
import IconBadge from '../ui/IconBadge';
import { API_BASE } from '../../utils/api';
import { TENANT_ID } from '../../config/tenant';
import { auth } from '../../utils/firebase';
import './Login.css';

// Firebase error codes -> user-facing messages. Anything not listed falls
// back to a generic message rather than showing Firebase's raw error text.
const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-phone-number': 'Enter a valid 10-digit mobile number',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/invalid-verification-code': 'Invalid OTP',
  'auth/code-expired': 'OTP expired - please request a new one',
};

const Login = () => {
  const [step, setStep] = useState('mobile'); // mobile | password | otp | not_found
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired] = useState(() => new URLSearchParams(window.location.search).get('expired') === '1');
  const confirmationResultRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

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
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      confirmationResultRef.current = await signInWithPhoneNumber(auth, `+91${mobile}`, recaptchaVerifierRef.current);
      setStep('otp');
    } catch (err) {
      setError(FIREBASE_ERROR_MESSAGES[err.code] || 'Could not send OTP. Please try again.');
      // A failed send can leave the reCAPTCHA in a used state - reset so the next attempt gets a fresh one.
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
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
      const userCredential = await confirmationResultRef.current.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      // Firebase confirms the phone number is real, but our own backend still
      // owns the app's session model - exchange the Firebase ID token for our
      // usual JWT so every other route keeps working exactly as before.
      const res = await fetch(`${API_BASE}/api/auth/patient/firebase-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        body: JSON.stringify({ idToken })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Login failed');
        return;
      }
      sessionStorage.setItem('usertoken', json.token);
      sessionStorage.setItem('userRole', json.role);
      window.location.href = '/patient/my-record';
    } catch (err) {
      setError(FIREBASE_ERROR_MESSAGES[err.code] || 'Something went wrong. Please try again.');
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

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <span className="ui-eyebrow">{name ? `Welcome, ${name}` : 'Welcome'}</span>
              <h2>Enter OTP</h2>
              <p className="login-hint">An OTP was sent to {mobile}.</p>
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
        <div id="recaptcha-container" />
      </div>
    </div>
  );
};

export default Login;
