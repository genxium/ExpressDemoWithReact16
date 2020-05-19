const constants = require('./constants');

const singleton = Symbol();
const singletonEnforcer = Symbol();

class WriterUtil {

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new WriterUtil(singletonEnforcer);
    }
    return this[singleton];
  }

  isFormValid(writer) {
    if (!constants.REGEX.WRITER_HANDLE.test(writer.handle)) return false;
    if (!constants.REGEX.WRITER_DISPLAY_NAME.test(writer.displayName)) return false;
    if (null != writer.rawPassword && "" != writer.rawPassword) {
      // The "writer.rawPassword" field is only accessible in frontend. 
      if (!constants.REGEX.PASSWORD.test(writer.rawPassword)) return false;
    }
    return true;
  }

  isModeratorOfOrg(writer, org, boundSuborgList) {
    for (let i in boundSuborgList) {
      const singleBoundSuborg = boundSuborgList[i]; 
      if (singleBoundSuborg.org_id != org.id) continue;
      if (constants.SUBORG.TYPE.MODERATOR != singleBoundSuborg.type) continue;
      return true;
    }
    return false;
  }
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = WriterUtil;
