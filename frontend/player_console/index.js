'use strict';

import "whatwg-fetch";

const constants = require('../../common/constants');

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

/* 
* React-router "react16-lazy-loading" reference 
* https://reactjs.org/docs/code-splitting.html#route-based-code-splitting
*
* Note that using "dynamic `import()`" syntax SEEMS TO REQUIRE that the module-to-be-imported is exported by ES6 "export default ModuleName" syntax, i.e. those exported by CommonJs "exports.default = ModuleName" don't work for dynamic importing
- would be ignored by "webpack.optimization.splitChunks.chunks: 'async'",
- not imported by "webpack.optimization.splitChunks.chunks: 'initial'" and thus a broken bundle. 
*/

const ArticleDetail = withRouter(lazy(
    () => import("./scenes/article/Detail")
));

const SyncCb = withRouter(lazy(
    () => import("../shared_scenes/SyncCb")
));

import Loading from '../shared_scenes/Loading';

import PlayerManager from "./PlayerManager";
const commonRouteProps = {
  RoleLoginSingleton: PlayerManager,
  role: constants.ROLE_NAME.PLAYER,
  basename: (constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER),
};

const routes = (
  <Router
  basename={(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER)}
  >
    <PlayerConsole>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path={constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PARAMS.ARTICLE_ID + constants.ROUTE_PATHS.DETAIL} component={(props) => 
            <ArticleDetail {...commonRouteProps} />
          } />
          <Route path={constants.ROUTE_PATHS.SYNC_CB + constants.ROUTE_PARAMS.ACT} render={(routerProps) => (
            /* This is only to demonstrate that we can override the `render` attr instead of `component` for a `<Route/>`. */
            <SyncCb {...commonRouteProps} />
          )} />
        </Switch>
      </Suspense>
    </PlayerConsole>
  </Router>
);

ReactDOM.render(routes, document.getElementById('react-root'));
