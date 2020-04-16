'use-strict';

const React = require('react');
const Component = React.Component;
const constants = require('../../../../common/constants');
const NetworkFunc = require('../../../../common/NetworkFunc').default;
const Crypto = require('../../../../common/Crypto').default;

const WebFunc = require('../../../utils/WebFunc').default;

const LocaleManager = require('../../../../common/LocaleManager').default;

import { Button, View, Topbar, Input, replaceNewScene, getRootElementSize, changeSceneTitle, queryNamedGatewayInfoDictSync, } from '../../../widgets/WebCommonRouteProps';

class Edit extends Component {

  constructor(props) {
    super(props);
    const sceneRef = this;

    this.state = {
      disabled: true,
      savable: false,
      deletable: false,
      rootElementSize: null,
      cachedRawPassword: "",
      cachedWriter: {
        handle: "",
        displayName: ""
      },
    };

    this.styles = {
    };
  }

  componentDidMount() {
    const sceneRef = this;
    const params = sceneRef.props.match.params;

    const isNew = (null == params.writerId);
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
    const params = sceneRef.props.match.params;

    const isNew = (null == params.writerId);
    if (isNew) {
      sceneRef.setState({
        disabled: false,
      });
      return;
    }

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    let paramDict = {
      token: cookieToken,
    };
    const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
    const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + "/" + params.writerId + constants.ROUTE_PATHS.DETAIL;
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
          }
        });
      });
  }

  isFormValid(writer) {
    const sceneRef = this;
    if (!constants.REGEX.ORG_HANDLE.test(writer.handle)) return false;
    if (!constants.REGEX.ORG_DISPLAY_NAME.test(writer.displayName)) return false;
    return true;
  }

  save() {
    const sceneRef = this;
    const params = sceneRef.props.match.params;
    const {location, basename, ...other} = sceneRef.props;

    const isNew = (null == params.writerId);

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    sceneRef.setState({
      disabled: true,
    }, function() {
      let paramDict = {
        handle: sceneRef.state.cachedWriter.handle,
        displayName: sceneRef.state.cachedWriter.displayName,
        token: cookieToken,
      };

      if (null != sceneRef.state.cachedRawPassword && "" != sceneRef.state.cachedRawPassword) {
        Object.assign(paramDict, {
          password: Crypto.sha1Sign(sceneRef.state.cachedRawPassword),
        });
      }

      const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
      let url = null;
      if (isNew)
        url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.ADD;
      else
        url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + "/" + params.writerId + constants.ROUTE_PATHS.SAVE;
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
            alert(LocaleManager.instance.effectivePack().ORG_HANDLE_DUPLICATED);
            sceneRef.setState({
              disabled: false,
              savable: sceneRef.isFormValid(sceneRef.state.cachedWriter),
              deletable: false,
            });
            return;
          }
          if (constants.RET_CODE.OK != respData.ret) {
            alert(LocaleManager.instance.effectivePack().OOPS);
            sceneRef.setState({
              disabled: false,
              savable: sceneRef.isFormValid(sceneRef.state.cachedWriter),
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
            const pathname = constants.ROUTE_PATHS.ORG + "/" + respData.writer.id + constants.ROUTE_PATHS.EDIT;
            replaceNewScene(sceneRef, pathname);
          }
        });
    });
  }

  // NOTE: Intentionally spelled as 'delet'.
  delet() {
    const sceneRef = this;
    const params = sceneRef.props.match.params;
    const {location, basename, ...other} = sceneRef.props;

    const isNew = (null == params.writerId);

    if (isNew) return; // Invalid trigger.

    const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);

    sceneRef.setState({
      disabled: true,
    }, function() {
      let paramDict = {
        token: cookieToken,
      };
      const namedGatewayInfo = queryNamedGatewayInfoDictSync().articleServer;
      const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.ORG + "/" + params.writerId + constants.ROUTE_PATHS.DELETE;
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
              savable: sceneRef.isFormValid(sceneRef.state.cachedWriter),
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
    const params = sceneRef.props.match.params;
    const {location, basename, ...other} = sceneRef.props;
    const styles = sceneRef.styles;

    const isNew = (null == params.writerId);

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
    <Topbar
    {...topbarProps}
    >
        {topbarChildren}  
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
    disabled={sceneRef.state.disabled || !sceneRef.state.savable}
    style={sharedButtonStyle}
    onPress={(evt) => {
      sceneRef.save();
    }}
    >
        {LocaleManager.instance.effectivePack().SAVE}
      </Button>
    );

    const btnDeleteStyle = {};
    Object.assign(btnDeleteStyle, sharedButtonStyle);
    Object.assign(btnDeleteStyle, {
      display: (isNew ? 'none' : 'inline-block')
    });
    const btnDelete = (
    <Button
    disabled={sceneRef.state.disabled || !sceneRef.state.deletable}
    style={btnDeleteStyle}
    onPress={(evt) => {
      sceneRef.delet();
    }}
    >
        {LocaleManager.instance.effectivePack().DELETE}
      </Button>
    );

    const buttonsRow = (
    <View
    style={{
      marginTop: 3,
      marginBottom: 3,
    }}
    >
        {btnSave}
        {btnDelete}
      </View>
    );

    const mainScene = (
    <View>
        <View>
          <Input
    disabled={sceneRef.state.disabled}
    type="text"
    style={sharedInputStyle}
    value={sceneRef.state.cachedWriter.handle}
    onUpdated={(evt) => {
      const newCachedWriter = {};
      Object.assign(newCachedWriter, sceneRef.state.cachedWriter);
      Object.assign(newCachedWriter, {
        handle: evt.target.value,
      });
      sceneRef.setState({
        savable: sceneRef.isFormValid(newCachedWriter),
        deletable: false,
        cachedWriter: newCachedWriter,
      });
    }}
    placeholder={LocaleManager.instance.effectivePack().ORG_HANDLE}
    />
        </View>
        <View>
          <Input
    disabled={sceneRef.state.disabled}
    type="password"
    style={sharedInputStyle}
    value={sceneRef.state.cachedRawPassword}
    onUpdated={(evt) => {
      sceneRef.setState({
        savable: sceneRef.isFormValid(sceneRef.state.cachedWriter),
        deletable: false,
        cachedRawPassword: evt.target.value,
      });
    }}
    placeholder={LocaleManager.instance.effectivePack().WRITER_PASSWORD_INPUT_HINT}
    />
        </View>
        <View>
          <Input
    disabled={sceneRef.state.disabled}
    type="text"
    style={sharedInputStyle}
    value={sceneRef.state.cachedWriter.displayName}
    onUpdated={(evt) => {
      const newCachedWriter = {};
      Object.assign(newCachedWriter, sceneRef.state.cachedWriter);
      Object.assign(newCachedWriter, {
        displayName: evt.target.value,
      });
      sceneRef.setState({
        savable: sceneRef.isFormValid(newCachedWriter),
        deletable: false,
        cachedWriter: newCachedWriter,
      });
    }}
    placeholder={LocaleManager.instance.effectivePack().ORG_DISPLAY_NAME}
    />
        </View>
        {buttonsRow}
      </View>
    );

    return (
      <View
      style={{
        padding: 10
      }}
      >
        {topbar}
        {mainScene}
      </View>
    );
  }
}

export default Edit;
