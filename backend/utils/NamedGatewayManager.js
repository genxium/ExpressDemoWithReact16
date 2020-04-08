'use strict';

const baseAbsPath = __dirname + '/';
const constants = require('../../common/constants');
const NetworkFunc = require('../../common/NetworkFunc').default;

const singleton = Symbol();
const singletonEnforcer = Symbol();

const yaml = require('js-yaml');
const fs = require('fs');

class NamedGatewayManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    this.config = null;
    try {
      const configFilepath = (constants.NOT_IN_PRODUCTION ? baseAbsPath + '../configs/named_gateway_dict.conf' : baseAbsPath + '../configs/named_gateway_dict.conf');
      this.config = yaml.safeLoad(fs.readFileSync(configFilepath, 'utf8'));
    } catch (err) {
      NetworkFunc.stacktraceIfDebugging(err);
    }
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new NamedGatewayManager(singletonEnforcer);
    }
    return this[singleton];
  }
}

exports.default = NamedGatewayManager;
