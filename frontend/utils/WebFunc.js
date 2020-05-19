const jsonlite = require('./jsonlite').default;
const constants = require('../../common/constants');
import Cookies from 'js-cookie';

class WebFunc {

  static isFromSnsShare(sceneRef) {
    const pathname = sceneRef.props.location.pathname;
    if (null === pathname || undefined === pathname) return false;
    return pathname.includes(constants.ROUTE_PATHS.SNS_SHARE);
  }

  static isFromSnsMsg(sceneRef) {
    const pathname = sceneRef.props.location.pathname;
    if (null === pathname || undefined === pathname) return false;
    return pathname.includes(constants.ROUTE_PATHS.SNS_MSG);
  }

  static setCookie(key, val, attributes) {
    Cookies.set(key, val, attributes);
  }

  static getCookie(key) {
    return Cookies.get(key);
  }

  static removeCookie(key, attributes) {
    Cookies.remove(key, attributes);
  }

  static encodeStateWithAction(sceneRef, cbname, cbparams, skipEncodingURIComponent, includeLocationSearchInPathname) {
    let pathname = sceneRef.props.location.pathname;
    if (true == includeLocationSearchInPathname) {
      pathname += sceneRef.props.location.search;
    }
    let dict = {
      p: pathname
    };
    if (undefined !== cbname && null !== cbname) {
      dict = Object.assign({
        cbn: cbname
      }, dict);
    }
    if (undefined != cbparams && null !== cbparams) {
      dict = Object.assign({
        cbp: cbparams
      }, dict);
    }
    if (true == skipEncodingURIComponent) {
      return JSON.stringify(dict);
    } else {
      return encodeURIComponent(JSON.stringify(dict));
    }
  }

  static decodeStateWithAction(encodedStr) {
    const decodedStr = decodeURIComponent(encodedStr);
    try {
      return JSON.parse(decodedStr);
    } catch (e) {
      // the string returned by wechat comes without double quotes
      return jsonlite.parse(decodedStr);
    }
  }

  static storeVolatileCallback(key, cbname, cbparams) {
    if (undefined === cbname || null === cbname) return false;
    let volatileCallback = {
      cbn: cbname
    };
    if (undefined !== cbparams && null !== cbparams) {
      Object.assign(volatileCallback, {
        cbp: cbparams
      });
    }
    localStorage.setItem(key, JSON.stringify(volatileCallback));
    return true;
  }

  static extractVolatileCallback(key) {
    const valStr = localStorage.getItem(key);
    if (null === valStr || undefined === valStr) return null;
    localStorage.removeItem(key);
    return JSON.parse(valStr);
  }

  static storeSceneState(sceneRef, extraParamDict, keyDictToExclude) {
    const key = sceneRef.props.location.pathname;
    let val = null;
    if (extraParamDict === null || extraParamDict === undefined) {
      val = sceneRef.state;
    } else {
      val = Object.assign(sceneRef.state, extraParamDict);
    }
    for (let key in keyDictToExclude) {
      delete val[key];
    }
    localStorage.setItem(key, JSON.stringify(val));
  }

  static extractSceneState(sceneRef) {
    const key = sceneRef.props.location.pathname;
    const valStr = localStorage.getItem(key);
    if (null === valStr || undefined === valStr) return null;
    localStorage.removeItem(key);
    return JSON.parse(valStr);
  }
}

export default WebFunc;
