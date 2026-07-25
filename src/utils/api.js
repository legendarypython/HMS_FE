import axios from 'axios';
import { TENANT_ID } from '../config/tenant';

// Single source of truth for the backend origin. Set REACT_APP_API_URL at build
// time (CRA only inlines env vars prefixed REACT_APP_) to point at a real
// deployment; falls back to the local dev backend when unset.
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Every request identifies which hospital it's for. The backend trusts this
// header only pre-auth (login, OTP, public listings, booking) - once a
// request authenticates, the backend derives tenant from the JWT instead, so
// this header alone can't spoof tenant on an authenticated request.
axios.defaults.headers.common['X-Tenant-Id'] = TENANT_ID;

// A protected endpoint returning 401 always means the stored token is
// missing/invalid/expired (the backend's userAuthentication middleware is the
// only thing that returns 401, and it does so for all of those cases) -
// never "wrong password", which is handled inline on the login page itself
// and never goes through this helper. Without this, an expired session
// (staff tokens last 8h) just silently fails every fetch and the page
// renders as if all the data disappeared, which is exactly what happened
// and looked like a bug rather than an expected "please log back in" case.
function handleSessionExpiry() {
  sessionStorage.removeItem('usertoken');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userData');
  window.location.href = '/login?expired=1';
}

// Wrapper for the raw-fetch call sites (axios call sites are covered by the
// interceptor below instead, since axios supports this centrally).
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, 'X-Tenant-Id': TENANT_ID },
  });
  if (res.status === 401) {
    handleSessionExpiry();
    // Stop the caller's own .json()/error-handling from running against a
    // response that's about to be moot - the redirect above is already
    // in flight.
    throw new Error('Session expired');
  }
  return res;
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      handleSessionExpiry();
    }
    return Promise.reject(error);
  }
);
