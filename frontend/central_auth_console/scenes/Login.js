'use-strict';

const React = require('react');
const Component = React.Component;

const WebFunc = require('../../utils/WebFunc').default;

const LocaleManager = require('../../../common/LocaleManager').default;
const NetworkFunc = require('../../../common/NetworkFunc').default;
const Time = require('../../../common/Time').default;

const Crypto = require('../../../common/Crypto').default;
const constants = require('../../../common/constants');

import { View, Topbar, Button, Input, Image, Text, replaceNewScene, changeSceneTitle, queryNamedGatewayInfoDictSync, } from '../../widgets/WebCommonRouteProps';

import AdminManager from "../../admin_console/AdminManager";
import WriterManager from "../../writer_console/WriterManager";
import PlayerManager from "../../player_console/PlayerManager";

class Login extends Component {

  constructor(props) {
    super(props);
    this.query = NetworkFunc.searchStrToMap(this.props.location.search);
    const roleName = this.query.role;
    let theRoleLoginSingleton = null;
    switch (roleName) {
      case constants.ROLE_NAME.ADMIN:
        theRoleLoginSingleton = AdminManager;
        break;
      case constants.ROLE_NAME.WRITER:
        theRoleLoginSingleton = WriterManager;
        break;
      case constants.ROLE_NAME.PLAYER:
        theRoleLoginSingleton = PlayerManager;
        break;
    }
    this.RoleLoginSingleton = theRoleLoginSingleton; // Injects before the first call to "this.render" to ensure that the <Topbar /> works normally. 
    this.state = {
      cachedHandle: "",
      cachedPassword: "",
    };
  }

  isValidRoleHandle(str) {
    if (null == this.query) {
      return false;
    }
    const roleName = this.query.role;
    switch (roleName) {
      case constants.ROLE_NAME.ADMIN:
        return constants.REGEX.ADMIN_HANDLE.test(str);
      case constants.ROLE_NAME.WRITER:
        return constants.REGEX.WRITER_HANDLE.test(str);
      default:
        return false;
    }
  }

  isValidPassword(str) {
    return constants.REGEX.PASSWORD.test(str);
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo);
  }

  componentDidMount() {
    const sceneRef = this;
    changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().CENTRAL_AUTH_CONSOLE);
  }

  componentWillUnmount() {}

  triggerLoginRequest() {
    const sceneRef = this;
    const RoleLoginSingleton = sceneRef.RoleLoginSingleton;
    const {location, basename, ...other} = sceneRef.props;
    const roleName = sceneRef.query.role;

    const handle = sceneRef.state.cachedHandle;
    const hashedPassword = Crypto.sha1Sign(sceneRef.state.cachedPassword);
    const paramDict = {
      handle: handle,
      password: hashedPassword,
      roleName: roleName,
    };

    const namedGatewayInfoDict = queryNamedGatewayInfoDictSync();
    const namedGatewayInfo = namedGatewayInfoDict.authServer;
    const url = namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + basename + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.CREDENTIALS + constants.ROUTE_PATHS.LOGIN;
    NetworkFunc.post(url, paramDict)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        if (constants.RET_CODE.OK != responseData.ret) {
          if (constants.RET_CODE.NONEXISTENT_HANDLE == responseData.ret) {
            alert(LocaleManager.instance.effectivePack().NONEXISTENT_HANDLE);
          }
          if (constants.RET_CODE.INCORRECT_PASSWORD == responseData.ret) {
            alert(LocaleManager.instance.effectivePack().INCORRECT_PASSWORD);
          }
          sceneRef.setState({
            cachedPassword: "",
          });
          return;
        }
        const intAuthToken = responseData.token;
        const expiresAtGmtZero = responseData.expiresAtGmtZero;
        const daysToKeepToken = Time.targetMillisToDurationFromNow(expiresAtGmtZero).days;
        WebFunc.setCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY, intAuthToken, daysToKeepToken);

        RoleLoginSingleton.instance.saveLoggedInRole(responseData.loggedInRole);

        const query = sceneRef.query;
        const peerNamedGatewayInfo = namedGatewayInfoDict[query.app];
        const encodedStateWithAction = (null == query ? null : query.state);

        const roleName = query.role;
        let rolePathPrefix = null;
        switch (roleName) {
          case constants.ROLE_NAME.ADMIN:
            rolePathPrefix = constants.ROUTE_PATHS.ADMIN;
            break;
          case constants.ROLE_NAME.WRITER:
            rolePathPrefix = constants.ROUTE_PATHS.WRITER;
            break;
          case constants.ROLE_NAME.PLAYER:
            rolePathPrefix = constants.ROUTE_PATHS.PLAYER;
            break;
        }

        const uriDecodedStateWithActionStr = decodeURIComponent(encodedStateWithAction); // To avoid "double wrapping" of this param when redirecting.

        replaceNewScene(sceneRef, peerNamedGatewayInfo.protocol + "://" + peerNamedGatewayInfo.pageGateway + constants.ROUTE_PATHS.BASE + rolePathPrefix + constants.ROUTE_PATHS.SYNC_CB, {
          state: uriDecodedStateWithActionStr,
          IntAuthToken: intAuthToken,
          ExpiresAtGmtZero: expiresAtGmtZero,
        });
      });
  }

  render() {
    const sceneRef = this;
    const {location, RoleLoginSingleton, ...other} = sceneRef.props;

    const loginBtn = (
    <Button
            style={ {
                      fontSize: 18,
                    } }
            disabled={ !sceneRef.isValidRoleHandle(sceneRef.state.cachedHandle) || !sceneRef.isValidPassword(sceneRef.state.cachedPassword) }
            onPress={ (evt) => {
                        sceneRef.triggerLoginRequest();
                      } }>
      { LocaleManager.instance.effectivePack().LOGIN }
    </Button>
    );

    const mainScene = (
    <View style={ {
                textAlign: 'center',
              } }>
      <View>
        <Input
               key='handle-input'
               style={ {
                         display: 'inline-block',
                         fontSize: 18,
                       } }
               value={ sceneRef.state.cachedHandle }
               onUpdated={ (evt) => {
                             sceneRef.setState({
                               cachedHandle: evt.target.value,
                             });
                           } }
               placeholder={ LocaleManager.instance.effectivePack().PLEASE_INPUT_HANDLE } />
      </View>
      <View>
        <Input
               key='password-input'
               type='password'
               style={ {
                         display: 'inline-block',
                         fontSize: 18,
                       } }
               value={ sceneRef.state.cachedPassword }
               onUpdated={ (evt) => {
                             sceneRef.setState({
                               cachedPassword: evt.target.value,
                             });
                           } }
               placeholder={ LocaleManager.instance.effectivePack().PLEASE_INPUT_PASSWORD }
               onKeyDown={ (evt) => {
                             if (evt.keyCode != constants.KEYBOARD_CODE.RETURN) return;
                             if (!sceneRef.isValidRoleHandle(sceneRef.state.cachedHandle)) return;
                             if (!sceneRef.isValidPassword(sceneRef.state.cachedPassword)) return;
                             sceneRef.triggerLoginRequest();
                           } } />
      </View>
      { loginBtn }
    </View>
    );

    const topbarProps = Object.assign({
      showLoginNav: false,
      sceneRef: sceneRef
    }, sceneRef.props);

    const topbar = (
    <Topbar {...topbarProps} />
    );

    return (
      <View>
        { topbar }
        { mainScene }
      </View>
    );
  }
}

export default Login;
