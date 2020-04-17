const constants = require('./constants');

const singleton = Symbol();
const singletonEnforcer = Symbol();

class OrgUtil {

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new OrgUtil(singletonEnforcer);
    }
    return this[singleton];
  }

  isOrgFormValid(org) {
    if (!constants.REGEX.ORG_HANDLE.test(org.handle)) return false;
    if (!constants.REGEX.ORG_DISPLAY_NAME.test(org.displayName)) return false;
    return true;
  }

  isSuborgFormValid(suborg) {
    if (!constants.REGEX.SUBORG_DISPLAY_NAME.test(suborg.displayName)) return false;
    return true;
  }
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = OrgUtil;
