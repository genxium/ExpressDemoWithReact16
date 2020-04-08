'use strict';

import "whatwg-fetch";

import React, { Suspense, lazy, Component } from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import { 
  withRouter 
} from "react-router";

const constants = require('../../common/constants');

class PlayerConsole extends Component {
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

const Home = lazy(
    () => import("./scenes/Home")
);

import Loading from '../shared_scenes/Loading';

import PlayerManager from "./PlayerManager";
const commonRouteProps = {
  RoleLoginSingleton: PlayerManager,
  basename: (constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER),
};

const routes = (
  <Router
  basename={(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER)}
  >
    <PlayerConsole>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path={constants.ROUTE_PATHS.HOME} component={(props) => 
            <Home {...commonRouteProps} />
          }/>
          <Route component={(props) => 
            <Home {...commonRouteProps} />
          } />
        </Switch>
      </Suspense>
    </PlayerConsole>
  </Router>
);

ReactDOM.render(routes, document.getElementById('react-root'));
