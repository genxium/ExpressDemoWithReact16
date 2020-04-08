const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');

const AbstractRoleLoginManager = require('../AbstractRoleLoginManager').default;

class WriterManager extends AbstractRoleLoginManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    super();
    this.roleName = constants.ROLE_NAME.WRITER;
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new WriterManager(singletonEnforcer);
    }
    return this[singleton];
  }
}

export default WriterManager;
