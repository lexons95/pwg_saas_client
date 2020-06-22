import React from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { useUserCache, useConfigCache } from '../customHook';

const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  let routeLocation = useLocation();

  const defaultRoute = "/";
  const userResult = useUserCache();
  const configResult = useConfigCache();
  
  let loggedIn = false;
  if (userResult && userResult.success && configResult) {
    loggedIn = true;
  }

  return (
    // restricted = false meaning public route
    // restricted = true meaning restricted route
    <Route {...rest} render={props => (
      loggedIn && restricted ?
        <Redirect to={{
            pathname: defaultRoute,
            state: { from: routeLocation }
        }} />
        : <Component {...props} />
    )} />
  );
};

export default PublicRoute;