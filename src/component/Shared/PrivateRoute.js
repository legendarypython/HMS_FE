import React, { useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';

// Wraps a Route so it only renders for a logged-in user with an allowed role.
// This is a UX convenience only - the backend enforces the real access control.
const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  // Login does a full page navigation (window.location.href) to work around a
  // React Router bug, which makes protected pages eligible for the browser's
  // back/forward cache (bfcache). Force a reload on bfcache restore so a
  // frozen pre-logout snapshot can never be resurrected by hitting Back.
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
        // Read sessionStorage inside the render callback, not PrivateRoute's
        // own function-component scope. Since this component is a static
        // sibling in App's JSX (not conditionally mounted), it never
        // unmounts as the user navigates between routes - its outer scope
        // only runs once, at initial mount. <Route> re-invokes this render
        // callback fresh on every navigation that matches its path, but a
        // closure over token/role read outside it would stay frozen at
        // whatever they were when the app first loaded, silently ignoring
        // every later login/logout for the rest of the session.
        const token = sessionStorage.getItem('usertoken');
        const role = sessionStorage.getItem('userRole');
        if (!token || (roles && !roles.includes(role))) {
          return <Redirect to="/login" />;
        }
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
