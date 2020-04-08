'use strict';

const baseAbsPath = __dirname + '/';

const constants = require('../../common/constants');
const singleton = Symbol();
const singletonEnforcer = Symbol();

const qiniu = require("qiniu");
const cacheManager = require('cache-manager');

const yaml = require('js-yaml');
const fs = require('fs');

const OssUptokenManager = require('./OssUptokenManager').default;

class QiniuServerUtil extends OssUptokenManager {

  constructor(enforcer) {
    if (enforcer != singletonEnforcer) throw "Cannot construct singleton";
    super();
    this.config = null;
    try {
      const configFilepath = (constants.NOT_IN_PRODUCTION ? baseAbsPath + '../configs/qiniu.test.conf' : baseAbsPath + '../configs/qiniu.conf');
      this.config = yaml.safeLoad(fs.readFileSync(configFilepath, 'utf8'));
      qiniu.conf.ACCESS_KEY = this.config.appId;
      qiniu.conf.SECRET_KEY = this.config.appSecret;
      qiniu.conf.UP_HOST = this.config.uphost;
    } catch (e) {
    }
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new QiniuServerUtil(singletonEnforcer);
    }
    return this[singleton];
  }

  _createUptokenAsyncImpl(rawPutPolicyDict) {
    // Reference http://developer.qiniu.com/docs/v6/api/reference/security/put-policy.html
    return new Promise(function(resolve, reject) {
      const putPolicy = new qiniu.rs.PutPolicy(rawPutPolicyDict.scope);
      putPolicy.mimeLimit = rawPutPolicyDict.mimeLimit;
      putPolicy.fsizeLimit = rawPutPolicyDict.fsizeLimit;
      resolve(putPolicy.token());
    });
  }

  deleteSingleFileAsync(bucket, remoteName) {
    // Reference http://developer.qiniu.com/code/v6/sdk/nodejs.html#rs-delete
    return new Promise(function(resolve, reject) {
      const client = new qiniu.rs.Client();
      client.remove(bucket, remoteName, function(err, ret) {
        if (undefined != err && null != err) {
          // Reference http://docs.qiniu.com/api/v6/rs.html#error-code
          switch (err.code) {
            case 200:
            break;
            case 612: 
              resolve(constants.CDN_DELETION_RESULT_CODE.NOT_DELETED_NO_LONGER_EXISTING);
            break;
            case 401: 
              resolve(constants.CDN_DELETION_RESULT_CODE.NOT_DELETED_PERMISSION_DENIED);
            break;
            default:
              resolve(constants.CDN_DELETION_RESULT_CODE.UNKNOWN);  
            break;
          }
          return; 
        }
          
        resolve(constants.CDN_DELETION_RESULT_CODE.DELETED);
      });
    });
  }
}

exports.default = QiniuServerUtil;
