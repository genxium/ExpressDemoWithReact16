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

class AdminConsole extends Component {
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

const SyncCb = withRouter(lazy(
    () => import("../shared_scenes/SyncCb")
));

const Home = withRouter(lazy(
  () => import("./scenes/Home")
));

const WriterList = withRouter(lazy(
  () => import("./scenes/writer/List")
));

const WriterEdit = withRouter(lazy(
  () => import("./scenes/writer/Edit")
));

const OrgList = withRouter(lazy(
  () => import("./scenes/org/List")
));

const OrgEdit = withRouter(lazy(
  () => import("./scenes/org/Edit")
));

import Loading from '../shared_scenes/Loading';
import AdminManager from './AdminManager';
const commonRouteProps = { 
  RoleLoginSingleton: AdminManager,
  role: constants.ROLE_NAME.ADMIN,
  basename: (constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ADMIN),
};

const routes = (
  <Router
  basename={(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ADMIN)}
  >
    <AdminConsole>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path={constants.ROUTE_PATHS.SYNC_CB} render={(routerProps) => (
            <SyncCb {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.HOME} render={(routerProps) => (
            <Home {...commonRouteProps} />
          )} />

          <Route path={constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.LIST} render={(routerProps) => (
            <WriterList {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.ADD} render={(routerProps) => (
            <WriterEdit {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.EDIT} render={(routerProps) => (
            <WriterEdit {...commonRouteProps} />
          )} />

          <Route path={constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.LIST} render={(routerProps) => (
            <OrgList {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.ADD} render={(routerProps) => (
            <OrgEdit {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.EDIT} render={(routerProps) => (
            <OrgEdit {...commonRouteProps} />
          )} />

          <Route render={(routerProps) => (
            <Home {...commonRouteProps} />
          )} />
        </Switch>
      </Suspense>
    </AdminConsole>
  </Router>
);

ReactDOM.render(routes, document.getElementById('react-root'));
