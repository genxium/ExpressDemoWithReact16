'use strict';

import "whatwg-fetch";

const constants = require('../../common/constants');

import React, { Suspense, lazy, Component } from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

import { 
  withRouter 
} from "react-router";

class CentralAuthConsole extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
      >
        {this.props.children}
      </div>
    );
  }
}

const Login = withRouter(lazy(
  () => import("./scenes/Login")
));

import Loading from '../shared_scenes/Loading';
const commonRouteProps = {
  basename: (constants.ROUTE_PATHS.BASE),
};

const routes = (
  <Router
  basename={(constants.ROUTE_PATHS.BASE)}
  >
    <CentralAuthConsole>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path={constants.ROUTE_PATHS.LOGIN} render={(routerProps) => (
            <Login {...commonRouteProps} />
          )} />
          <Route render={(routerProps) => (
            <Login {...commonRouteProps} />
          )} />
        </Switch>
      </Suspense>
    </CentralAuthConsole>
  </Router>
);

ReactDOM.render(routes, document.getElementById('react-root'));
