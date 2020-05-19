const WebFunc = require('./utils/WebFunc').default;
const NetworkFunc = require('../common/NetworkFunc').default;
const Time = require('../common/Time').default;
const constants = require('../common/constants');

import { replaceNewScene, queryNamedGatewayInfoDictSync, } from './widgets/WebCommonRouteProps';

class AbstractRoleLoginManager {
  constructor(props) {
    this.roleLoginScenePathname = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.LOGIN;

    this.loginByIntAuthTokenEndpoint = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.INT_AUTH_TOKEN + constants.ROUTE_PATHS.LOGIN;
    this.logoutEndpoint = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.API_V1 + constants.ROUTE_PATHS.LOGOUT;

    this.storageKey = constants.WEB_FRONTEND_LOCAL_STORAGE_LOGGED_IN_ROLE_KEY;
    this.storage = localStorage;
    this.loggedInRole = null;
    this._wsRef = null;
  }

  checkWhetherTokenHasExpiredAsync(sceneRef, responseData) {
    const instance = this;
    if (null == responseData || constants.RET_CODE.TOKEN_EXPIRED != responseData.ret) {
      return new Promise(function(resolve, reject) {
        resolve(false);
      });
    }
    return instance.logoutAsync(sceneRef);
  }

  replaceRoleLoginScene(sceneRef, cbname, cbparams) {
    const instance = this;
    const namedGatewayInfo = queryNamedGatewayInfoDictSync().authServer;

    const encodedStateWithAction = WebFunc.encodeStateWithAction(sceneRef, cbname, cbparams, true, true);
    const paramDict = {
      state: encodedStateWithAction,
      role: sceneRef.props.role,
      app: 'articleServer', // Hardcoded temporarily to match the key in `<proj-root>/backend/configs/named_gateway_dict.conf`.
    };
    /*
    Inside `replaceNewScene`, all values in `paramDict` will be processed by `encodeURIComponent`.  
    */
    replaceNewScene(sceneRef, namedGatewayInfo.protocol + "://" + namedGatewayInfo.pageGateway + instance.roleLoginScenePathname, paramDict);
  }

  loginByIntAuthTokenAsync(sceneRef) {
    const instance = this;
    const namedGatewayInfo = queryNamedGatewayInfoDictSync().authServer;
    return new Promise(function(resolve, reject) {
      const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
      if (null == cookieToken) {
        resolve(false);
        return;
      }
      const paramDict = {
        token: cookieToken,
        roleName: instance.roleName,
      };
      NetworkFunc.post(namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + instance.loginByIntAuthTokenEndpoint, paramDict)
        .then(function(response) {
          return response.json();
        })
        .then(function(responseData) {
          if (constants.RET_CODE.OK != responseData.ret) {
            instance.removeLoggedInRole();
            resolve(false);
            return;
          }
          const intAuthToken = responseData.token;
          const expiresAtGmtZero = responseData.expiresAtGmtZero;
          const daysToKeepToken = Time.targetMillisToDurationFromNow(expiresAtGmtZero).days;
          WebFunc.setCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY, intAuthToken, daysToKeepToken);
          instance.saveLoggedInRole(responseData.loggedInRole);
          resolve(true);
        });
    });
  }

  logoutAsync(sceneRef) {
    const instance = this;
    const namedGatewayInfo = queryNamedGatewayInfoDictSync().authServer;
    return new Promise(function(resolve, reject) {
      const cookieToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
      if (null == cookieToken) {
        resolve(true);
        return;
      }

      let paramDict = {
        token: cookieToken,
        roleName: instance.roleName,
      };
      NetworkFunc.post(namedGatewayInfo.protocol + "://" + namedGatewayInfo.apiGateway + instance.logoutEndpoint, paramDict)
        .then(function(response) {
          try {
            if (constants.HTTP_STATUS_CODE.UNAUTHORIZED = response.status) {
              return new Promise(function(resolve, reject) {
                resolve(null);
              });
            } else return response.json();
          } catch (err) {
            return new Promise(function(resolve, reject) {
              resolve(null);
            });
          }
        })
        .then(function(responseData) {
          instance.removeLoggedInRole();
          if (instance._wsRef && instance._wsRef.connected) {
            instance._wsRef.disconnect(true);
          // TODO: Fix reconnection issues, reference https://github.com/socketio/socket.io-client/issues/251.
          }
          resolve(true);
        });
    });
  }

  saveLoggedInRole(loggedInRole) {
    const instance = this;
    instance.loggedInRole = loggedInRole;
    instance.storage.setItem(instance.storageKey, JSON.stringify(instance.loggedInRole));
  }

  loadLoggedInRoleAsync(sceneRef) {
    const instance = this;
    return new Promise(function(resolve, reject) {
      instance.loggedInRole = JSON.parse(instance.storage.getItem(instance.storageKey));
      resolve();
    });
  }

  removeLoggedInRole() {
    const instance = this;
    instance.loggedInRole = null;
    WebFunc.removeCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
    instance.storage.removeItem(instance.storageKey);
  }

  hasLoggedIn() {
    const instance = this;
    const unexpiredIntAuthToken = WebFunc.getCookie(constants.WEB_FRONTEND_COOKIE_INT_AUTH_TOKEN_KEY);
    console.log("AbstractRoleLoginManager.hasLoggedIn, unexpiredIntAuthToken == " + unexpiredIntAuthToken);
    return (null != unexpiredIntAuthToken && null != instance.loggedInRole);
  }
}

export default AbstractRoleLoginManager;
