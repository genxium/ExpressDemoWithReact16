'use-strict';

import React, { Component } from 'react';
const constants = require('../../../common/constants');
const WebFunc = require('../../utils/WebFunc').default;

const LocaleManager = require('../../../common/LocaleManager').default;

import { View, Topbar, Button, pushNewScene, changeSceneTitle, } from '../../widgets/WebCommonRouteProps';

class Home extends Component {

  constructor(props) {
    super(props);
    const sceneRef = this;

    this.styles = {
      entryCommon: {
        display: 'block',
        marginTop: 5,
      },
    };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo);
  }

  componentDidMount() {
    const sceneRef = this;
    changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ADMIN_CONSOLE);
  }

  render() {
    const sceneRef = this;
    const {RoleLoginSingleton, ...other} = sceneRef.props;
    const styles = sceneRef.styles;

    const topbarProps = Object.assign({
      showLoginNav: false,
      onHasLoggedIn: () => {},
      onHasNotLoggedIn: () => {
        RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
      },
      sceneRef: sceneRef
    }, sceneRef.props);

    const topbarChildren = [];
    const topbar = (
    <Topbar {...topbarProps}>
      { topbarChildren }
    </Topbar>
    );

    const entryBtnStyle = {
      display: 'block',
      fontSize: 18,
      margin: 15,
      padding: 5,
    };

    const logoutBtnStyle = {
      fontSize: 12,
      margin: 15,
    };

    const mainScene = (
    <View>
      <Button
              style={ entryBtnStyle }
              onPress={ (evt) => {
                          const pathname = constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.LIST;
                          pushNewScene(sceneRef, pathname);
                        } }>
        { LocaleManager.instance.effectivePack().WRITER_LIST }
      </Button>
      <Button
              style={ entryBtnStyle }
              onPress={ (evt) => {
                          const pathname = constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.LIST;
                          pushNewScene(sceneRef, pathname);
                        } }>
        { LocaleManager.instance.effectivePack().ORG_LIST }
      </Button>
      <Button
              style={ logoutBtnStyle }
              onPress={ (evt) => {
                          RoleLoginSingleton.instance.logoutAsync(sceneRef)
                            .then(function(loggedOut) {
                              RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
                            });
                        } }>
        { LocaleManager.instance.effectivePack().LOGOUT }
      </Button>
    </View>
    );

    return (
      <View style={ {
                padding: 10
              } }>
        { topbar }
        { mainScene }
      </View>
    );
  }
}

export default Home;
