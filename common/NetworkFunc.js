'use strict';

const constants = require('./constants');

class NetworkFunc {

  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  static guid() {
    const s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  static shortCode(nsegs) {
    const s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };
    let nsegsInt = parseInt(nsegs);
    let effectiveNsegs = ((isNaN(nsegsInt) || 1 >= nsegsInt) ? 1 : nsegsInt);
    let ret = "";
    while (effectiveNsegs--) {
      ret += s4();
    }
    return ret;
  }

  static strReplaceInOrder(str, args) {
    return str.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match;
    });
  }

  static mapToSortedQueryParams(map) {
    let keys = Object.keys(map);
    keys.sort();
    let paramList = [];
    for (let idx = 0; idx < keys.length; ++idx) {
      const k = keys[idx];
      const v = map[k];
      paramList.push(k + "=" + encodeURIComponent(v));
    }
    return paramList.join('&');
  }

  static searchStrToMap(searchStr) {
    if (null == searchStr) return null;
    const questionSymbolSplits = searchStr.split('?');
    if (null == questionSymbolSplits || 0 >= questionSymbolSplits.length) return null;
    const effectiveKvStr = (1 >= questionSymbolSplits.length ? questionSymbolSplits[0] : questionSymbolSplits[1]);
    if (null == effectiveKvStr) return null;
    const andSymbolSplits = effectiveKvStr.split('&');
    let toRet = {};
    for (let i = 0; i < andSymbolSplits.length; ++i) {
      const kvStr = andSymbolSplits[i];
      if (null == kvStr) continue;
      const equalsSymbolSplits = kvStr.split('=');
      if (null == equalsSymbolSplits || 1 >= equalsSymbolSplits.length) continue;
      toRet[equalsSymbolSplits[0]] = decodeURIComponent(equalsSymbolSplits[1]);
    }
    return toRet;
  }

  // The `fetch` polyfill API requires explicit specification of basic-auth or other cookie associated communication, reference https://github.com/github/fetch#sending-cookies.
  static get(url, paramsDict) {
    if (!paramsDict || Object.keys(paramsDict).length == 0) return fetch(url, {
        credentials: 'same-origin',
      });
    const concatenated = url + "?" + NetworkFunc.mapToSortedQueryParams(paramsDict);
    return fetch(concatenated, {
      credentials: 'same-origin',
    });
  }

  static post(url, paramsDict) {
    return (
    fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: NetworkFunc.mapToSortedQueryParams(paramsDict)
    })
    );
  }

  static postJson(url, paramsDict) {
    return (
    fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify(paramsDict)
    })
    );
  }

  static isValueInDictionary(v, dict) {
    for (let k in dict) {
      if (dict[k] != v) continue;
      return true;
    }
    return false;
  }
}
;

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = NetworkFunc;
