const baseAbsPath = __dirname + '/';
const constants = require(baseAbsPath + '../../common/constants');
const BackendApiCore = require('node-wechat-util').BackendApiCore;

const singleton = Symbol();
const singletonEnforcer = Symbol();

class WeChatSingleton extends BackendApiCore {

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    super();

    const configFilepath = (constants.USE_FSERVER ? baseAbsPath + '../configs/fserver.conf' : baseAbsPath + '../configs/wechat_pubsrv.conf');

    this.loadConfigFileSync(configFilepath);
    this.TRADE_TYPE = {
      NATIVE: 'NATIVE'
    };
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new WeChatSingleton(singletonEnforcer);
    }
    return this[singleton];
  }
}

exports.default = WeChatSingleton;
