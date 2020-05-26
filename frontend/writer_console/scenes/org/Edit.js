'use strict';

import React, { Component } from 'react';

const Paginator = require('../../../widgets/Paginator').default;
const ClipartSearch = require('../../../widgets/ClipartSearch').default;

import { View, Topbar, Image, Video, Text, Input, NavItem, DropdownPicker, PickerItem, Button, pushNewScene, replaceNewScene, changeSceneTitle, HyperLink, goBack, topbarHeightPx, ModalPopup, queryNamedGatewayInfoDictSync, getRootElementSize, getRenderedComponentSize } from '../../../widgets/WebCommonRouteProps';

const LocaleManager = require('../../../../common/LocaleManager').default;
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const Time = require('../../../../common/Time').default;
const constants = require('../../../../common/constants');

const WebFunc = require('../../../utils/WebFunc').default;

/*
* Note that for unprivileged users, this scene is read-only.
*/
class Edit extends Component {

  createCellReactElement(retRow, key) {
    const sceneRef = this;
    const params = sceneRef.props.match.params;

    const cellWidthPx = sceneRef.state.rootElementSize.width;
    const cellHeightPx = sceneRef._cellHeightPx;

    let iconPath = null;
    switch(retRow.type) {
      case constants.ORG.LIST_ITEM_ENTITY_TYPE_LITERAL.SUBORG:
        iconPath = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ICON + "/suborg.svg";
      break;
      case constants.ORG.LIST_ITEM_ENTITY_TYPE_LITERAL.WRITER:
        iconPath = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ICON + "/person.svg";
      break;
      default:
      break;
    };
    const icon = (
      <Image
        src={iconPath}
      />
    );

    return (
      <View
            style={ {
                      padding: 5,
                      width: cellWidthPx,
                      height: cellHeightPx,
                      border: 'solid 1px ' + constants.THEME.MAIN.GREY,
                    } }
            key={ key }
            onClick={ (evt) => {
                        if ("suborg" == retRow.type) {
                          const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
                          let targetSuborgIdPath = query.suborgIdPath;
                          if (null == targetSuborgIdPath) {
                            targetSuborgIdPath = "";
                          }
                          targetSuborgIdPath += ("/" + retRow.id);
                          const pathname = constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.EDIT;
                          const params = {};
                          for (let k in query) {
                            params[k] = query[k];
                          }
                          Object.assign(params, {
                            suborgIdPath: targetSuborgIdPath,
                          });

                          pushNewScene(sceneRef, pathname, params);
                        } 
                      } }>
        { icon }
        { retRow.display_name }
      </View>
    );
  }

  handleListResponseData(responseData) {
    const sceneRef = this;
    const {RoleLoginSingleton, ...other} = sceneRef.props;
    let retRowList = responseData.retRowList;
    if (!retRowList) {
      RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, responseData)
        .then(function(trueOrFalse) {
          if (!trueOrFalse) return;
          RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
        });
      return;
    }
    let newCellList = [];
    retRowList.map(function(single) {
      const singleCell = sceneRef.createCellReactElement(single, single.id);
      newCellList.push(singleCell);
    });
    sceneRef.setState({
      cellList: newCellList,
    });
  }

  constructor(props) {
    super(props);
    const sceneRef = this;

    this._initialized = false;
    this._cellHeightPx = 64;

    this.styles = {
    };

    this.state = {
      rootElementSize: null,
      disabled: true,
      buttonsRowSize: {
        width: '100%',
        height: 0,
      },
      topbarSize: {
        width: '100%',
        height: 0,
      },
      activePage: 1,
      searchKeyword: "",
      cachedSearchKeyword: "",
      cellList: [],
    };
  }

  componentDidMount() {
    const sceneRef = this;
    changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ORG_DETAIL);
    if (null != sceneRef.state.rootElementSize) return;
    const rootElementSize = getRootElementSize();
    sceneRef.setState({
      rootElementSize: rootElementSize,
    });
  }

  componentDidUpdate(prevProps) {
    const sceneRef = this;
    if (sceneRef.props.location !== prevProps.location) {
      sceneRef.initScene();
    }
  }

  triggerSearch() {
    const sceneRef = this;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const pathname = constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.EDIT;
    const params = {};
    for (let k in query) {
      params[k] = query[k];
    }
    Object.assign(params, {
      sk: sceneRef.state.cachedSearchKeyword,
    });

    replaceNewScene(sceneRef, pathname, params);
  }

  initScene() {
    const sceneRef = this;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const effectiveActivePage = (null == query.page ? sceneRef.state.activePage : parseInt(query.page));
    let effectiveSearchKeyword = sceneRef.state.searchKeyword;

    if (null != query.sk) {
      effectiveSearchKeyword = query.sk;
    }

    sceneRef.setState({
      activePage: effectiveActivePage,
      searchKeyword: effectiveSearchKeyword,
      cachedSearchKeyword: effectiveSearchKeyword,
    }, function() {
      sceneRef._listviewRef.requestDataAsync(sceneRef.state.activePage)
        .then(function(responseData) {
          sceneRef.handleListResponseData(responseData);
        });
    })
  }

  render() {
    const sceneRef = this;
    const styles = sceneRef.styles;
    const {RoleLoginSingleton, basename, location, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);

    // Search widget building.
    const searchInput = (
    <Input
           key='search-input'
           style={ {
                     height: 23,
                     width: 146,
                     padding: 3,
                     border: 'none',
                     color: constants.THEME.MAIN.BLACK,
                     borderRadius: 4,
                   } }
           value={ sceneRef.state.cachedSearchKeyword }
           onUpdated={ (evt) => {
                         sceneRef.setState({
                           cachedSearchKeyword: evt.target.value
                         });
                       } }
           onKeyDown={ (evt) => {
                         if (evt.keyCode != constants.KEYBOARD_CODE.RETURN) return;
                         sceneRef.triggerSearch();
                       } }>
    </Input>
    );

    const searchButton = (
    <View
          key='search-button'
          style={ {
                    display: 'inline-block',
                    width: 18,
                    marginLeft: 10,
                    position: 'absolute',
                  } }
          onClick={ (evt) => {
                      sceneRef.triggerSearch();
                    } }>
      <ClipartSearch />
    </View>
    );

    const searchEntry = (
    <NavItem
             style={ {
                       lineHeight: 1,
                       display: 'block',
                       position: 'absolute',
                       left: '15%',
                       height: 45,
                       paddingTop: 11,
                       paddingBottom: 11,
                       width: '70%',
                       textAlign: 'center',
                       marginLeft: 10,
                     } }
             key='search-entry-nav'>
      { searchInput }
      { searchButton }
    </NavItem>
    );

    const topbarProps = Object.assign({
      showLoginNav: false,
      onHasLoggedIn: () => {
        const boundInitScene = sceneRef.initScene.bind(sceneRef);
        boundInitScene();
      },
      onHasNotLoggedIn: () => {
        RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
      },
      ref: (c) => {
        if (!c) return;
        const newSize = getRenderedComponentSize(c);
        const oldSize = sceneRef.state.topbarSize;
        if (null != oldSize && oldSize.width == newSize.width && oldSize.height == newSize.height) return;
        sceneRef.setState({
          topbarSize: newSize,
        });
      },
      sceneRef: sceneRef,
    }, sceneRef.props);

    const topbarChildren = [searchEntry];
    const topbar = (
    <Topbar
            style={ styles.topbar }
            {...topbarProps}>
      { topbarChildren }
    </Topbar>
    );

    let listview = null;
    if (null != sceneRef.state.rootElementSize) {
      const buttonsRow = (
        <View
              style={ {
                        width: '100%',
                        height: 50,
                        position: 'relative',
                      } }
              ref={ (c) => {
                      if (!c) return;
                      const newSize = getRenderedComponentSize(c);
                      const oldSize = sceneRef.state.buttonsRowSize;
                      if (null !== oldSize && oldSize.width == newSize.width && oldSize.height == newSize.height) return;
                      sceneRef.setState({
                        buttonsRowSize: newSize,
                      });
                    } }>
          <View style={ {
                          position: 'absolute',
                        } }>
          </View>
        </View>
      );

      const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

      const listViewProps = Object.assign({
        cellHeight: sceneRef._cellHeightPx,
        totSizePx: {
          width: sceneRef.state.rootElementSize.width,
          height: (sceneRef.state.rootElementSize.height - sceneRef.state.topbarSize.height - sceneRef.state.buttonsRowSize.height),
        },
        noResultHint: LocaleManager.instance.effectivePack().NO_MORE,
        collectFilters: () => {
          const filters = {
            token: cookieToken,
            suborgIdPath: (null == query.suborgIdPath ? "/" : query.suborgIdPath),
            orgId: query.orgId,
            requestNo: 0,
          };
          Object.assign(filters, {
            searchKeyword: sceneRef.state.searchKeyword,
          });
          return filters;
        },
        dataUrl: basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.SUBORG + constants.ROUTE_PATHS.PATH + constants.ROUTE_PATHS.DETAIL,
        cellList: sceneRef.state.cellList,
        activePage: () => {
          return sceneRef.state.activePage;
        },
        onPageSelectedBridge: (page) => {
          const pathname = constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.LIST;
          const params = {};
          for (let k in query) {
            params[k] = query[k];
          }
          Object.assign(params, {
            page: page,
          });

          replaceNewScene(sceneRef, pathname, params);
        },
      }, sceneRef.props);

      listview = (
        <Paginator
                   style={ {
                             clear: 'both'
                           } }
                   ref={ (c) => {
                           if (!c) return;
                           sceneRef._listviewRef = c;
                         } }
                   {...listViewProps} />
      );
    }

    const mainScene = (
    <View>
      { listview }
    </View>
    );

    return (
      <View>
        { topbar }
        { mainScene }
      </View>
    );
  }
}

export default Edit;
