const constants = require('./constants');

const singleton = Symbol();
const singletonEnforcer = Symbol();

class LocaleManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new LocaleManager(singletonEnforcer);
    }
    return this[singleton];
  }

  effectivePack() {
    // TODO: Adaptation for other locales.
    return constants.LANG.ZH_CN;
  }
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = LocaleManager;
