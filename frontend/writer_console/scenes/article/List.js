'use-strict';

const React = require('react');
const Component = React.Component;

const Paginator = require('../../../widgets/Paginator').default;
const ClipartSearch = require('../../../widgets/ClipartSearch').default;

const LocaleManager = require('../../../../common/LocaleManager').default;
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const constants = require('../../../../common/constants');

const ArticleUtil = require('../../../../common/ArticleUtil').default;
const categoryChoiceList = ArticleUtil.instance.categoryChoiceList();
const stateChoiceList = ArticleUtil.instance.stateChoiceList();

const WebFunc = require('../../../utils/WebFunc').default;

import { View, Topbar, Text, Button, Image, Input, pushNewScene, DropdownPicker, PickerItem, NavItem, changeSceneTitle, getRootElementSize, getRenderedComponentSize, replaceNewScene, } from '../../../widgets/WebCommonRouteProps';

class List extends Component {

  createCellReactElement(article, key) {
    const sceneRef = this;

    const cellWidthPx = sceneRef.state.rootElementSize.width;
    const cellHeightPx = sceneRef._cellHeightPx;

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
                        const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.EDIT;
                        const paramDict = {
                          articleId: article.id, 
                        };
                        pushNewScene(sceneRef, pathname, paramDict);
                      } }>
        { article.title }
      </View>
    );
  }

  handleListResponseData(responseData) {
    const sceneRef = this;
    const {RoleLoginSingleton, ...other} = sceneRef.props;
    let articleList = responseData.articleList;
    if (!articleList) {
      RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, responseData)
        .then(function(trueOrFalse) {
          if (!trueOrFalse) return;
          RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
        });
      return;
    }
    let newCellList = [];
    articleList.map(function(single) {
      const singleCell = sceneRef.createCellReactElement(single, single.id);
      newCellList.push(singleCell);
    });
    sceneRef.setState({
      cellList: newCellList,
    });
  }

  constructor(props) {
    super(props);

    this._cellHeightPx = 130;

    this._listviewRef = null;

    this.state = {
      rootElementSize: null,
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
      statePicker: stateChoiceList[0],
      categoryPicker: categoryChoiceList[0],
    };

    this.styles = {
      topbar: {
        paddingLeft: 10,
        paddingRight: 10,
      },
    }
  }

  componentDidMount() {
    const sceneRef = this;
    changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ARTICLE_LIST);

    if (null !== sceneRef.state.rootElementSize) return;
    const rootElementSize = getRootElementSize();
    sceneRef.setState({
      rootElementSize: rootElementSize,
    });
  }

  componentWillUnmount() {}

  componentDidUpdate(prevProps) {
    // Seems like that "history.replace" won't re-invoke "componentDidMount" any more since "react-router-v4 + react-16".
    const sceneRef = this;
    if (sceneRef.props.location !== prevProps.location) {
      sceneRef.initScene();
    }
  }

  triggerSearch() {
    const sceneRef = this;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST;
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

    if (undefined !== query.sk) {
      effectiveSearchKeyword = query.sk;
    }

    let effectiveCategoryPicker = sceneRef.state.categoryPicker;
    if (null != query.ctgry) {
      const toMatchKey = parseInt(query.ctgry);
      for (let i = 0; i < categoryChoiceList.length; ++i) {
        if (categoryChoiceList[i].key != toMatchKey) {
          continue;
        }
        effectiveCategoryPicker = categoryChoiceList[i];
        break;
      }
    }

    let effectiveStatePicker = sceneRef.state.statePicker;
    if (null != query.st) {
      const toMatchKey = parseInt(query.st);
      for (let i = 0; i < stateChoiceList.length; ++i) {
        if (stateChoiceList[i].key != toMatchKey) {
          continue;
        }
        effectiveStatePicker = stateChoiceList[i];
        break;
      }
    }

    sceneRef.setState({
      activePage: effectiveActivePage,
      statePicker: effectiveStatePicker,
      categoryPicker: effectiveCategoryPicker,
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

    // State picker building.
    let statePickerItemList = [];
    stateChoiceList.map(function(single) {
      const singleCell = (
      <PickerItem
                  key={ single.key }
                  onClick={ (evt) => {
                              const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST;
                              const params = {};
                              for (let k in query) {
                                params[k] = query[k];
                              }
                              if (single.key == sceneRef.state.statePicker.key) return;
                            
                              Object.assign(params, {
                                st: single.key,
                              });
                              replaceNewScene(sceneRef, pathname, params);
                            } }>
        { single.title }
      </PickerItem>
      );
      statePickerItemList.push(singleCell);
    });

    const statePickerNav = (
    <View
          style={ {
                    display: 'inline-block',
                    position: 'relative',
                    height: 45,
                    lineHeight: '45px',
                    width: 150,
                    fontSize: 12,
                    textAlign: 'center',
                    marginRight: 5,
                  } }
          key='state-picker-nav'>
      <DropdownPicker
                      id='state-picker'
                      title={ sceneRef.state.statePicker.title }
                      style={ styles.singlePicker }>
        { statePickerItemList }
      </DropdownPicker>
    </View>
    );

    // Category picker building.
    let categoryPickerItemList = [];
    categoryChoiceList.map(function(single) {
      const singleCell = (
      <PickerItem
                  key={ single.key }
                  onClick={ (evt) => {
                              const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST;
                              const params = {};
                              for (let k in query) {
                                params[k] = query[k];
                              }
                              if (single.key == sceneRef.state.categoryPicker.key) return;
                            
                              Object.assign(params, {
                                ctgry: single.key,
                              });
                              replaceNewScene(sceneRef, pathname, params);
                            } }>
        { single.title }
      </PickerItem>
      );
      categoryPickerItemList.push(singleCell);
    });

    const categoryPickerNav = (
    <View
          style={ {
                    display: 'inline-block',
                    position: 'relative',
                    height: 45,
                    lineHeight: '45px',
                    width: 64,
                    textAlign: 'center',
                    marginRight: 5,
                  } }
          key='category-picker-nav'>
      <DropdownPicker
                      id='category-picker'
                      title={ sceneRef.state.categoryPicker.title }
                      style={ styles.singlePicker }>
        { categoryPickerItemList }
      </DropdownPicker>
    </View>
    );

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
        if (null !== oldSize && oldSize.width == newSize.width && oldSize.height == newSize.height) return;
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

    let buttonsRow = null;
    let listview = null;
    if (null !== sceneRef.state.rootElementSize) {
      const btnAdd = (
      <Button
              style={ {
                        fontSize: 18,
                        display: 'inline-block',
                        float: 'right',
                      } }
              onPress={ (evt) => {
                          const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.ADD;
                          pushNewScene(sceneRef, pathname);
                        } }>
        { LocaleManager.instance.effectivePack().SYMBOL_ADD }
      </Button>
      );

      buttonsRow = (
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
            { statePickerNav }
            { categoryPickerNav }
          </View>
          { btnAdd }
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
            requestNo: 0,
          };
          if (null !== sceneRef.state.statePicker.key && undefined !== sceneRef.state.statePicker.key) {
            Object.assign(filters, {
              state: sceneRef.state.statePicker.key
            });
          }
          if (null !== sceneRef.state.categoryPicker.key && undefined !== sceneRef.state.categoryPicker.key) {
            Object.assign(filters, {
              category: sceneRef.state.categoryPicker.key
            });
          }
          Object.assign(filters, {
            searchKeyword: sceneRef.state.searchKeyword,
          });
          return filters;
        },
        dataUrl: basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.PAGINATION + constants.ROUTE_PATHS.LIST,
        cellList: sceneRef.state.cellList,
        activePage: () => {
          return sceneRef.state.activePage;
        },
        onPageSelectedBridge: (page) => {
          const pathname = constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST;
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
      { buttonsRow }
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

export default List;
