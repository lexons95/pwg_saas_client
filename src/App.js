import React, {useState, useEffect} from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
import { Button } from "antd";

import logo from './logo.svg';

import './css/index.css';

import * as Component from './component/index.js';
import Login from './component/page/Login';
import Products from './component/page/Products';
import Inventory from './component/page/Inventory';
import Orders from './component/page/Orders';
import Promotions from './component/page/Promotions';
import Dashboard from './component/page/Dashboard';
import Configuration from './component/page/Configuration';
import Page_01 from './component/page/component/Page_01';

import PrivateRoute from './utils/component/PrivateRoute';
import PublicRoute from './utils/component/PublicRoute';
import PageNotFound from './utils/component/PageNotFound';
import Loading from './utils/component/Loading';
import { useConfigCache, useUserCache } from './utils/customHook';


let Component_Layout = Component['Layout_01'];
let Component_Header = Component['Header_01'];
// let Component_Footer = Component['Header_01'];

const App = (props) => {
  const [ loggedIn, setLoggedIn ] = useState(false);
  const [ userRole, setUserRole ] = useState(null);
  const configCache = useConfigCache();
  const userCache = useUserCache();

  useEffect(()=>{
    if (configCache) {
      setLoggedIn(true)
    }
    else {
      setLoggedIn(false)
    }

    if (userCache && userCache.success) {
      setUserRole(userCache.data.role)
    }
    else {
      setUserRole(null)
    }
  },[configCache, userCache]);
  
  const Main = () => {
    return (
      <div>
        Main
      </div>
    )
  }
  return (
    <Router>
      <Component_Layout
        header={loggedIn ? (<Component_Header/>) : null}
        footer={loggedIn ? "2020" : null}
      >
        {
          userRole == 'SUBTENANT' ? (
            <Switch>
              <PrivateRoute exact path={'/'} component={Orders} />
              <PublicRoute restricted={true} exact path={'/login'} component={Login} />
              <Route component={PageNotFound} />
            </Switch>
          ) : (
            <Switch>
              {/* <PrivateRoute exact path={'/products'} component={Products}/> */}
              <PrivateRoute exact path={'/dashboard'} component={Dashboard} />
              <PrivateRoute exact path={'/'} component={Inventory} />
              <PrivateRoute exact path={'/main'} component={Main} />
              <PrivateRoute exact path={'/orders'} component={Orders} />   
              <PrivateRoute exact path={'/promotions'} component={Promotions} />
              <PrivateRoute exact path={'/configuration'} component={Configuration} />
              <PublicRoute restricted={true} exact path={'/login'} component={Login} />
              <Route component={PageNotFound} />
            </Switch>
          )
        }
      </Component_Layout>
    </Router>
  )

}

export default App;
