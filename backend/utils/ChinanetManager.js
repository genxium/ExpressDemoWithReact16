'use strict';

const baseAbsPath = __dirname + '/';
const Crypto = require('../../common/Crypto').default;
const constants = require('../../common/constants');

const singleton = Symbol();
const singletonEnforcer = Symbol();

const yaml = require('js-yaml');
const fs = require('fs');
const btoa = require('btoa');

const OssUptokenManager = require('./OssUptokenManager').default;

class ChinanetManager extends OssUptokenManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    super();
    this.config = null;
    try {
      const configFilepath = (constants.NOT_IN_PRODUCTION ? baseAbsPath + '../configs/chinanet.test.conf' : baseAbsPath + '../configs/chinanet.conf');
      this.config = yaml.safeLoad(fs.readFileSync(configFilepath, 'utf8'));
    } catch (e) {}
  }

  _urlSafeBase64EncodeSync(str) {
    // Reference https://wcs.chinanetcenter.com/document/API/Appendix/UrlsafeBase64.
    const toBeEncoded = str.replace(/\+/g, '-').replace(/\//, '_');
    return btoa(toBeEncoded);
  }

  _createUptokenAsyncImpl(putPolicy) {
    // Reference https://wcs.chinanetcenter.com/document/API/Token/UploadToken#生成上传凭证.
    const instance = this;
    return new Promise(function(resolve, reject) {
      const putPolicyStr = JSON.stringify(putPolicy);
      const encodedPutpolicy = instance._urlSafeBase64EncodeSync(putPolicyStr);
      const sign = Crypto.hmacSha1Sign(encodedPutpolicy, instance.config.appSecret);
      const b64Sign = instance._urlSafeBase64EncodeSync(sign);
      const uptoken = instance.config.appId + ':' + b64Sign + ':' + encodedPutpolicy;
      resolve(uptoken);
    });
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new ChinanetManager(singletonEnforcer);
    }
    return this[singleton];
  }
}

exports.default = ChinanetManager;
