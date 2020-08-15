'use strict';

import "whatwg-fetch";

import NetworkFunc from '../../common/NetworkFunc';
import constants from '../../common/constants';

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

class WriterConsole extends Component {
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

const ArticleList = withRouter(lazy(
    () => import("./scenes/article/List")
));

const ArticleEdit = withRouter(lazy(
    () => import("./scenes/article/Edit")
));

const OrgList = withRouter(lazy(
    () => import("./scenes/org/List")
));

const OrgEdit = withRouter(lazy(
    () => import("./scenes/org/Edit")
));

import Loading from '../shared_scenes/Loading';

import WriterManager from "./WriterManager";
const commonRouteProps = {
  RoleLoginSingleton: WriterManager,
  role: constants.ROLE_NAME.WRITER,
  basename: (constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.WRITER),
};

const routes = (
  <Router
  basename={(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.WRITER)}
  >
    <WriterConsole>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path={constants.ROUTE_PATHS.SYNC_CB} render={(routerProps) => (
            <SyncCb {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.HOME} render={(routerProps) => (
            <Home {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST} render={(routerProps) => (
            <ArticleList {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.ADD} render={(routerProps) => (
            <ArticleEdit {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.EDIT} render={(routerProps) => (
            <ArticleEdit {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.LIST} render={(routerProps) => (
            <OrgList {...commonRouteProps} />
          )} />
          <Route path={constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.EDIT} render={(routerProps) => (
            <OrgEdit {...commonRouteProps} />
          )} />
          <Route render={(routerProps) => (
            <Home {...commonRouteProps} />
          )} />
        </Switch>
      </Suspense>
    </WriterConsole>
  </Router>
);

ReactDOM.render(routes, document.getElementById('react-root'));
