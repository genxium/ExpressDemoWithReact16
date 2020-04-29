'use-strict';

const React = require('react');
const Component = React.Component;
const constants = require('../../../../common/constants');
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const Crypto = require('../../../../common/Crypto').default;

const WebFunc = require('../../../utils/WebFunc').default;

const LocaleManager = require('../../../../common/LocaleManager').default;
const WriterUtil = require('../../../../common/WriterUtil').default;

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
      cachedWriter: {
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
    const writerId = query.writerId;

    const isNew = (null == writerId);
    if (isNew) {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().ADD_WRITER);
    } else {
      changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().EDIT_WRITER);
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
    const writerId = query.writerId;

    const isNew = (null == writerId);
    if (isNew) {
      sceneRef.setState({
        disabled: false,
      });
      return;
    }

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    let paramDict = {
      token: cookieToken,
      writerId: writerId,
    };
    const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
    const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.DETAIL;
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
          cachedWriter: {
            handle: respData.writer.handle,
            displayName: respData.writer.display_name,
            rawPassword: "",
          }
        });
      });
  }

  save() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;

    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const writerId = query.writerId;
    const isNew = (null == writerId);

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    sceneRef.setState({
      disabled: true,
    }, function() {
      let paramDict = {
        handle: sceneRef.state.cachedWriter.handle,
        displayName: sceneRef.state.cachedWriter.displayName,
        token: cookieToken,
      };

      if (null != sceneRef.state.cachedWriter.rawPassword && "" != sceneRef.state.cachedWriter.rawPassword) {
        Object.assign(paramDict, {
          password: Crypto.sha1Sign(sceneRef.state.cachedWriter.rawPassword),
        });
      }

      const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
      let url = null;
      if (isNew) {
        url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.ADD;
      } else {
        Object.assign(paramDict, {
          writerId: writerId,
        });
        url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.SAVE; 
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
            alert(LocaleManager.instance.effectivePack().WRITER_HANDLE_DUPLICATED);
            sceneRef.setState({
              disabled: false,
              savable: WriterUtil.instance.isFormValid(sceneRef.state.cachedWriter),
              deletable: false,
            });
            return;
          }
          if (constants.RET_CODE.OK != respData.ret) {
            alert(LocaleManager.instance.effectivePack().OOPS);
            sceneRef.setState({
              disabled: false,
              savable: WriterUtil.instance.isFormValid(sceneRef.state.cachedWriter),
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
            const pathname = constants.ROUTE_PATHS.WRITER + "/" + respData.writer.id + constants.ROUTE_PATHS.EDIT;
            replaceNewScene(sceneRef, pathname);
          }
        });
    });
  }

  // NOTE: Intentionally spelled as 'delet'.
  delet() {
    const sceneRef = this;
    const {location, basename, ...other} = sceneRef.props;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const writerId = query.writerId;

    const isNew = (null == writerId);

    if (isNew) return; // Invalid trigger.

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    sceneRef.setState({
      disabled: true,
    }, function() {
      let paramDict = {
        token: cookieToken,
        writerId: writerId,
      };
      const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
      const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.DELETE;
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
              savable: WriterUtil.instance.isFormValid(sceneRef.state.cachedWriter),
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
    const styles = sceneRef.styles;
    const query = NetworkFunc.searchStrToMap(sceneRef.props.location.search);
    const writerId = query.writerId;

    const isNew = (null == writerId);

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

    const authForm = (
    <AuthForm
              disabled={ sceneRef.state.disabled }
              sharedInputStyle={ sharedInputStyle }
              handleValue={ sceneRef.state.cachedWriter.handle }
              handleInputPlaceholder={ LocaleManager.instance.effectivePack().WRITER_HANDLE }
              onHandleInputUpdated={ (evt) => {
                                       const newCachedWriter = {};
                                       Object.assign(newCachedWriter, sceneRef.state.cachedWriter);
                                       Object.assign(newCachedWriter, {
                                         handle: evt.target.value,
                                       });
                                       sceneRef.setState({
                                         savable: WriterUtil.instance.isFormValid(newCachedWriter),
                                         deletable: false,
                                         cachedWriter: newCachedWriter,
                                       });
                                     } }
              passwordValue={ sceneRef.state.cachedWriter.rawPassword }
              passwordInputPlaceholder={ LocaleManager.instance.effectivePack().WRITER_PASSWORD_INPUT_HINT }
              onPasswordInputUpdated={ (evt) => {
                                         const newCachedWriter = {};
                                         Object.assign(newCachedWriter, sceneRef.state.cachedWriter);
                                         Object.assign(newCachedWriter, {
                                           rawPassword: evt.target.value,
                                         });
                                         sceneRef.setState({
                                           savable: WriterUtil.instance.isFormValid(newCachedWriter),
                                           deletable: false,
                                           cachedWriter: newCachedWriter,
                                         });
                                       } }
              displayNameValue={ sceneRef.state.cachedWriter.displayName }
              displayNameInputPlaceholder={ LocaleManager.instance.effectivePack().WRITER_DISPLAY_NAME }
              onDisplayNameInputUpdated={ (evt) => {
                                            const newCachedWriter = {};
                                            Object.assign(newCachedWriter, sceneRef.state.cachedWriter);
                                            Object.assign(newCachedWriter, {
                                              displayName: evt.target.value,
                                            });
                                            sceneRef.setState({
                                              savable: WriterUtil.instance.isFormValid(newCachedWriter),
                                              deletable: false,
                                              cachedWriter: newCachedWriter,
                                            });
                                          } }>
    </AuthForm>
    );

    return (
      <View style={ {
                padding: 10
              } }>
        { topbar }
        { authForm }
        { buttonsRow }
      </View>
    );
  }
}

export default Edit;
