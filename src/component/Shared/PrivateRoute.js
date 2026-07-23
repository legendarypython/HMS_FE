import React from 'react';
import { Route, Redirect } from 'react-router-dom';

// Wraps a Route so it only renders for a logged-in user with an allowed role.
// This is a UX convenience only - the backend enforces the real access control.
const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  const token = sessionStorage.getItem('usertoken');
  const role = sessionStorage.getItem('userRole');

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
