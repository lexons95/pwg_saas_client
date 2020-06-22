import React from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { useUserCache, useConfigCache } from '../customHook';

const PrivateRoute = ({ component: Component, ...rest }) => {
  let routeLocation = useLocation();
  const defaultRoute = "/login";

  const userResult = useUserCache();
  const configResult = useConfigCache();
  
  let loggedIn = false;
  if (userResult && userResult.success && configResult) {
    loggedIn = true;
  }

  return (
    // Show the component only when the user is logged in
    // Otherwise, redirect the user to /signin page
    <Route {...rest} render={props => (
      loggedIn ?
        <Component {...props} />
        : <Redirect to={{
                  pathname: defaultRoute,
                  state: { from: routeLocation }
              }} />
    )} />
  );
};

export default PrivateRoute;

/*
type of page route
private route = only user who logged in can see
eg. products/inventory pages

public route (not restricted) = anyone can see
eg. main page/not sensitive info

public route (restricted) = only user who is not logged in can see
eg. login page

*/