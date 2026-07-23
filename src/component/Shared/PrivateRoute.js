import React, { useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';

// Wraps a Route so it only renders for a logged-in user with an allowed role.
// This is a UX convenience only - the backend enforces the real access control.
const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  const token = sessionStorage.getItem('usertoken');
  const role = sessionStorage.getItem('userRole');

  // Login does a full page navigation (window.location.href) to work around a
  // React Router bug, which makes protected pages eligible for the browser's
  // back/forward cache (bfcache). Logout only clears sessionStorage and does a
  // client-side navigation, so it never destroys that frozen page - hitting
  // Back after logout would otherwise resurrect the exact authenticated screen
  // (with previously-loaded patient data still visible) until some other
  // interaction forces real code to run again. Forcing a reload on bfcache
  // restore closes that gap.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!token || (roles && !roles.includes(role))) {
          return <Redirect to="/login" />;
        }
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
