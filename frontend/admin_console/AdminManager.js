const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');

const AbstractRoleLoginManager = require('../AbstractRoleLoginManager').default;

class AdminManager extends AbstractRoleLoginManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    super();
    this.roleName = constants.ROLE_NAME.ADMIN;
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new AdminManager(singletonEnforcer);
    }
    return this[singleton];
  }
}

export default AdminManager;
