'use-strict';

const React = require('react');
const Component = React.Component;
const constants = require('../../../../common/constants');
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const Crypto = require('../../../../common/Crypto').default;

const WebFunc = require('../../../utils/WebFunc').default;

const LocaleManager = require('../../../../common/LocaleManager').default;
const WriterUtil = require('../../../../common/WriterUtil').default;
const OrgUtil = require('../../../../common/OrgUtil').default;

import { Button, View, Topbar, Input, replaceNewScene, getRootElementSize, changeSceneTitle, queryNamedGatewayInfoDictSync, } from '../../../widgets/WebCommonRouteProps';

import AuthForm from '../../../widgets/AuthForm';

class Edit extends Component {

  constructor(props) {
    super(props);
    const sceneRef = this;

    this.state = {
      disabled: true,
      savable: false,
      deletable: false,
      rootElementSize: null,
      cachedOrg: {
        handle: "",
        displayName: "",
      },
      cachedModerator: {
        handle: "",
        displayName: "",
        rawPassword: "",
      },
    };

    this.styles = {
    };
  }

  componentDidMount() {
    const sceneRef = this;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;

    const isNew = (null == orgId);
    if (isNew) {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ADD_ORG);
    } else {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().EDIT_ORG);
    }

    if (null !== sceneRef.state.rootElementSize) return;
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

  initScene() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;

    const isNew = (null == orgId);
    if (isNew) {
      sceneRef.setState({
        disabled: false,
      });
      return;
    }

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    let paramDict = {
      token: cookieToken,
      orgId: orgId,
    };
    const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
    const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.DETAIL;
    let respData = null;
    NetworkFunc.get(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        respData = responseData;
        return sceneRef.props.RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, respData);
      })
      .then(function(trueOrFalse) {
        if (trueOrFalse) {
          sceneRef.props.RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
          return;
        }
        if (constants.RET_CODE.OK != respData.ret) {
          alert(LocaleManager.instance.effectivePack().OOPS);
          return;
        }
        sceneRef.setState({
          savable: false,
          deletable: true,
          disabled: false,
          cachedOrg: {
            handle: respData.org.handle,
            displayName: respData.org.display_name,
          },
        });
      });
  }

  save() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;

    const isNew = (null == orgId);

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    sceneRef.setState({
      disabled: true,
    }, function() {
      let paramDict = {
        handle: sceneRef.state.cachedOrg.handle,
        displayName: sceneRef.state.cachedOrg.displayName,

        newModeratorHandle: sceneRef.state.cachedModerator.handle,
        newModeratorDisplayName: sceneRef.state.cachedModerator.displayName,
        newModeratorPassword: sceneRef.state.cachedModerator.rawPassword,
        token: cookieToken,
      };

      if (null != sceneRef.state.cachedModerator.rawPassword && "" != sceneRef.state.cachedModerator.rawPassword) {
        Object.assign(paramDict, {
          password: Crypto.sha1Sign(sceneRef.state.cachedModerator.rawPassword),
        });
      }

      const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
      let url = null;
      if (isNew) {
        url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.ADD;
      } else {
        Object.assign(paramDict, {
          orgId: orgId,
        });
        url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.SAVE;
      }
      let respData = null;
      NetworkFunc.post(url, paramDict)
        .then(function(response) {
          return response.json();
        })
        .then(function(responseData) {
          respData = responseData;
          return sceneRef.props.RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, respData);
        })
        .then(function(trueOrFalse) {
          if (trueOrFalse) {
            sceneRef.props.RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
            return;
          }
          if (constants.RET_CODE.DUPLICATED == respData.ret) {
            alert(LocaleManager.instance.effectivePack().ORG_OR_WRITER_HANDLE_DUPLICATED);
            sceneRef.setState({
              disabled: false,
              savable: (WriterUtil.instance.isFormValid(sceneRef.state.cachedModerator) && OrgUtil.instance.isOrgFormValid(sceneRef.state.cachedOrg)),
              deletable: false,
            });
            return;
          }
          if (constants.RET_CODE.OK != respData.ret) {
            alert(LocaleManager.instance.effectivePack().OOPS);
            sceneRef.setState({
              disabled: false,
              savable: (WriterUtil.instance.isFormValid(sceneRef.state.cachedModerator) && OrgUtil.instance.isOrgFormValid(sceneRef.state.cachedOrg)),
              deletable: false,
            });
            return;
          }

          if (!isNew) {
            sceneRef.setState({
              disabled: false,
              savable: false,
              deletable: true,
            });
          } else {
            const newOrgId = respData.org.id;
            const pathname = constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.EDIT;
            replaceNewScene(sceneRef, pathname, {
              orgId: newOrgId, 
            });
          }
        });
    });
  }

  // NOTE: Intentionally spelled as 'delet'.
  delet() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;

    const isNew = (null == orgId);

    if (isNew) return; // Invalid trigger.

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    sceneRef.setState({
      disabled: true,
    }, function() {
      let paramDict = {
        token: cookieToken,
        orgId: orgId,
      };
      const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
      const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.DELETE;
      let respData = null;
      NetworkFunc.post(url, paramDict)
        .then(function(response) {
          return response.json();
        })
        .then(function(responseData) {
          respData = responseData;
          return sceneRef.props.RoleLoginSingleton.instance.checkWhetherTokenHasExpiredAsync(sceneRef, respData);
        })
        .then(function(trueOrFalse) {
          if (trueOrFalse) {
            sceneRef.props.RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
            return;
          }
          if (constants.RET_CODE.OK != respData.ret) {
            alert(LocaleManager.instance.effectivePack().OOPS);
            sceneRef.setState({
              disabled: false,
              savable: WriterUtil.instance.isFormValid(sceneRef.state.cachedModerator) && OrgUtil.instance.isOrgFormValid(sceneRef.state.cachedOrg),
              deletable: false,
            });
            return;
          }
          sceneRef.props.goBack(sceneRef);
        });
    });
  }

  render() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const orgId = query.orgId;
    const styles = sceneRef.styles;

    const isNew = (null == orgId);

    const topbarProps = Object.assign({
      showLoginNav: false,
      onHasLoggedIn: () => {
        sceneRef.initScene();
      },
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

    const sharedInputStyle = {
      padding: 5,
      width: 320,
      marginTop: 3,
      marginBottom: 3,
      fontSize: 18,
    };

    const sharedButtonStyle = {
      padding: 5,
      marginLeft: 5,
      display: 'inline-block',
      fontSize: 16,
    };

    const btnSave = (
    <Button
            disabled={ sceneRef.state.disabled || !sceneRef.state.savable }
            style={ sharedButtonStyle }
            onPress={ (evt) => {
                        sceneRef.save();
                      } }>
      { LocaleManager.instance.effectivePack().SAVE }
    </Button>
    );

    const btnDeleteStyle = {};
    Object.assign(btnDeleteStyle, sharedButtonStyle);
    Object.assign(btnDeleteStyle, {
      display: (isNew ? 'none' : 'inline-block')
    });
    const btnDelete = (
    <Button
            disabled={ sceneRef.state.disabled || !sceneRef.state.deletable }
            style={ btnDeleteStyle }
            onPress={ (evt) => {
                        sceneRef.delet();
                      } }>
      { LocaleManager.instance.effectivePack().DELETE }
    </Button>
    );

    const buttonsRow = (
    <View style={ {
                marginTop: 3,
                marginBottom: 3,
              } }>
      { btnSave }
      { btnDelete }
    </View>
    );

    const orgAuthForm = (
    <AuthForm
              disabled={ sceneRef.state.disabled }
              sharedInputStyle={ sharedInputStyle }
              handleValue={ sceneRef.state.cachedOrg.handle }
              handleInputPlaceholder={ LocaleManager.instance.effectivePack().ORG_HANDLE }
              onHandleInputUpdated={ (evt) => {
                                       const newCachedOrg = {};
                                       Object.assign(newCachedOrg, sceneRef.state.cachedOrg);
                                       Object.assign(newCachedOrg, {
                                         handle: evt.target.value,
                                       });
                                       sceneRef.setState({
                                         savable: WriterUtil.instance.isFormValid(sceneRef.state.cachedModerator) && OrgUtil.instance.isOrgFormValid(newCachedOrg),
                                         deletable: false,
                                         cachedOrg: newCachedOrg,
                                       });
                                     } }
              hidePasswordInput={ true }
              displayNameValue={ sceneRef.state.cachedOrg.displayName }
              displayNameInputPlaceholder={ LocaleManager.instance.effectivePack().ORG_DISPLAY_NAME }
              onDisplayNameInputUpdated={ (evt) => {
                                            const newCachedOrg = {};
                                            Object.assign(newCachedOrg, sceneRef.state.cachedOrg);
                                            Object.assign(newCachedOrg, {
                                              displayName: evt.target.value,
                                            });
                                            sceneRef.setState({
                                              savable: WriterUtil.instance.isFormValid(sceneRef.state.cachedModerator) && OrgUtil.instance.isOrgFormValid(newCachedOrg),
                                              deletable: false,
                                              cachedOrg: newCachedOrg,
                                            });
                                          } }>
    </AuthForm>
    );

    const separator = (
    <View style={ {
                display: 'block',
                position: 'relative',
                height: 1,
                marginTop: 2,
                marginBottom: 15,
                width: sharedInputStyle.width,
                backgroundColor: constants.THEME.MAIN.GREY,
              } }>
    </View>
    );

    let moderatorAuthForm = null;
    if (true == isNew) {
      moderatorAuthForm = (
      <AuthForm
                disabled={ sceneRef.state.disabled }
                sharedInputStyle={ sharedInputStyle }
                handleValue={ sceneRef.state.cachedModerator.handle }
                handleInputPlaceholder={ LocaleManager.instance.effectivePack().WRITER_HANDLE }
                onHandleInputUpdated={ (evt) => {
                                         const newCachedWriter = {};
                                         Object.assign(newCachedWriter, sceneRef.state.cachedModerator);
                                         Object.assign(newCachedWriter, {
                                           handle: evt.target.value,
                                         });
                                         sceneRef.setState({
                                           savable: WriterUtil.instance.isFormValid(newCachedWriter) && OrgUtil.instance.isOrgFormValid(sceneRef.state.cachedOrg),
                                           deletable: false,
                                           cachedModerator: newCachedWriter,
                                         });
                                       } }
                passwordValue={ sceneRef.state.cachedModerator.rawPassword }
                passwordInputPlaceholder={ LocaleManager.instance.effectivePack().WRITER_PASSWORD_INPUT_HINT }
                onPasswordInputUpdated={ (evt) => {
                                           const newCachedWriter = {};
                                           Object.assign(newCachedWriter, sceneRef.state.cachedModerator);
                                           Object.assign(newCachedWriter, {
                                             rawPassword: evt.target.value,
                                           });
                                           sceneRef.setState({
                                             savable: WriterUtil.instance.isFormValid(newCachedWriter) && OrgUtil.instance.isOrgFormValid(sceneRef.state.cachedOrg),
                                             deletable: false,
                                             cachedModerator: newCachedWriter,
                                           });
                                         } }
                displayNameValue={ sceneRef.state.cachedModerator.displayName }
                displayNameInputPlaceholder={ LocaleManager.instance.effectivePack().WRITER_DISPLAY_NAME }
                onDisplayNameInputUpdated={ (evt) => {
                                              const newCachedWriter = {};
                                              Object.assign(newCachedWriter, sceneRef.state.cachedModerator);
                                              Object.assign(newCachedWriter, {
                                                displayName: evt.target.value,
                                              });
                                              sceneRef.setState({
                                                savable: WriterUtil.instance.isFormValid(newCachedWriter) && OrgUtil.instance.isOrgFormValid(sceneRef.state.cachedOrg),
                                                deletable: false,
                                                cachedModerator: newCachedWriter,
                                              });
                                            } }>
      </AuthForm>
      );
    }

    return (
      <View style={ {
                padding: 10
              } }>
        { topbar }
        { orgAuthForm }
        { separator }
        { moderatorAuthForm }
        { buttonsRow }
      </View>
    );
  }
}

export default Edit;
