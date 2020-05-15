'use-strict';

import React, { Component } from 'react';
import constants from '../../../common/constants';
import WebFunc from '../../utils/WebFunc';

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

  componentDidMount() {
    const sceneRef = this;
    changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().WRITER_CONSOLE);
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
                          const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST;
                          pushNewScene(sceneRef, pathname);
                        } }>
        { LocaleManager.instance.effectivePack().ARTICLE_LIST }
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
                          sceneRef.props.RoleLoginSingleton.instance.logoutAsync(sceneRef)
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
