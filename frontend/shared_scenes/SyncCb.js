import React from 'react';
const Component = React.Component;

const WebFunc = require('../utils/WebFunc').default;
const NetworkFunc = require('../../common/NetworkFunc').default;
const Time = require('../../common/Time').default;
const constants = require('../../common/constants');

import { View, replaceNewScene, } from '../widgets/WebCommonRouteProps';

class SyncCb extends Component {

  constructor(props) {
    super(props);
    const sceneRef = this;
  }

  componentWillUnmount() {}

  componentDidMount() {
    const sceneRef = this;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const daysToKeepToken = Time.targetMillisToDurationFromNow(query.ExpiresAtGmtZero).days;
    WebFunc.setCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY, query.IntAuthToken, {expires: daysToKeepToken});

    const decodedStateWithAction = WebFunc.decodeStateWithAction(query.state);

    const pathname = decodedStateWithAction.p;
    WebFunc.storeVolatileCallback(pathname, decodedStateWithAction.cbn, decodedStateWithAction.cbp);

    // Do NOT keep `SyncCb` scene in the navigation stack.
    replaceNewScene(this, pathname);
  }

  render() {
    const sceneRef = this;
    return (
      <View style={ {
                padding: 64
              } }>
      </View>
    );
  }
}

export default SyncCb;
