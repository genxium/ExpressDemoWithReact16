'use strict';

const React = require('react');
const constants = require('../../../../common/constants');
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const LocaleManager = require('../../../../common/LocaleManager').default;

import ArticlePreviewer from '../../../widgets/ArticlePreviewer';

import 'mermaid/dist/mermaid.min.js';

import { View, Topbar, Button, changeSceneTitle, Input, Image, Text, HyperLink, ModalPopup, NavItem, getRenderedComponentSize, getRootElementSize, } from '../../../widgets/WebCommonRouteProps';

class Detail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      topbarSize: {
        width: '100%',
        height: 0,
      },
      footerSize: {
        width: '100%',
        height: 0,
      },
      rootElementSize: null,
      cachedArticle: null,
    };
  }

  componentWillUnmount() {}

  initScene() {
    const sceneRef = this;
    const props = sceneRef.props;
    const {RoleLoginSingleton, location, basename, ...other} = sceneRef.props;

    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const articleId = query.articleId; 

    const paramDict = {
      articleId: articleId,
    };

    if (RoleLoginSingleton.instance.hasLoggedIn()) {
      Object.assign(paramDict, {
        token: RoleLoginSingleton.instance.loggedInRole.token,
      });
    }

    const url = basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.PUBLIC + constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.DETAIL;

    let respData = null;
    NetworkFunc.get(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        respData = responseData;
        if (constants.RET_CODE.OK != respData.ret) {
          RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, responseData)
            .then(function(trueOrFalse) {
              if (!trueOrFalse) return;
              RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
            });
          return;
        }
        sceneRef.setState({
          cachedArticle: respData.article,
        }, function() {
          changeSceneTitle(sceneRef, sceneRef.state.cachedArticle.title);
        });
      });
  }

  componentDidMount() {
    const sceneRef = this;
    const props = sceneRef.props;
    if (null != sceneRef.state.rootElementSize) {
      return;
    }
    const rootElementSize = getRootElementSize();
    sceneRef.setState({
      rootElementSize: rootElementSize,
    });
  }

  render() {
    const sceneRef = this;
    const props = sceneRef.props;
    const RoleLoginSingleton = props.RoleLoginSingleton;

    const topbarProps = Object.assign({
      showLoginNav: false,
      style: {
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
      },
      onHasLoggedIn: () => {
        sceneRef.initScene();
      },
      onHasNotLoggedIn: () => {
        sceneRef.initScene();
      },
      ref: (c) => {
        if (!c) return;
        const newSize = getRenderedComponentSize(c);
        const oldSize = sceneRef.state.topbarSize;
        if (null != oldSize && oldSize.width == newSize.width && oldSize.height == newSize.height) {
          return;
        }
        sceneRef.setState({
          topbarSize: newSize,
        });
      },
      sceneRef: sceneRef
    }, sceneRef.props);

    const topbarChildren = [];
    const topbar = (
    <Topbar {...topbarProps}>
      { topbarChildren }
    </Topbar>
    );

    const shouldWaitForCachedArticle = (null == sceneRef.state.cachedArticle);
    if (true == shouldWaitForCachedArticle) {
      return (
        <View>
          { topbar }
        </View>
      );
    }
    ;

    const mainScenePaddingLeft = 5;
    const mainScenePaddingRight = 5;
    const mainScenePaddingTop = 5;
    const mainScenePaddingBottom = 5;

    const mainScene = (
    <ArticlePreviewer
                      View={ View }
                      Input={ Input }
                      ModalPopup={ ModalPopup }
                      Button={ Button }
                      Text={ Text }
                      Image={ Image }
                      style={ {
                                width: '100%',
                                paddingTop: mainScenePaddingTop,
                                paddingBottom: mainScenePaddingBottom,
                                paddingLeft: mainScenePaddingLeft,
                                paddingRight: mainScenePaddingRight,
                              } }
                      rootElementSize={ {
                                          width: sceneRef.state.rootElementSize.width,
                                          height: (sceneRef.state.rootElementSize.height - sceneRef.state.footerSize.height - sceneRef.state.topbarSize.height),
                                        } }
                      data={ sceneRef.state.cachedArticle }
                      {...sceneRef.props} />
    );

    const author = sceneRef.state.cachedArticle.author;
    let authorSection = null;
    if (undefined !== author && null !== author) {
      authorSection = (
        <View style={ {
                display: 'block',
                overflowWrap: 'break-word',
                borderTop: '1px solid ' + constants.THEME.MAIN.BROWN_REDISH,
              } }>
          <View style={ {
                          display: 'inline-block',
                          fontSize: 14,
                        } }>
            { LocaleManager.instance.effectivePack().ARTICLE_PROVIDED_BY_PREFIX }
          </View>
          <View style={ {
                          display: 'inline-block',
                          marginLeft: 5,
                          marginRight: 5,
                          fontSize: 18,
                          color: constants.THEME.MAIN.GREY,
                        } }>
            { author.displayName }
          </View>
          <View style={ {
                          display: 'inline-block',
                          fontSize: 14,
                        } }>
            { LocaleManager.instance.effectivePack().ARTICLE_PROVIDED_BY_SUFFIX }
          </View>
        </View>
      );
    }

    return (
      <View style={ {
                padding: 3,
              } }>
        { topbar }
        { mainScene }
        { authorSection }
      </View>
    );
  }
}

export default Detail;
