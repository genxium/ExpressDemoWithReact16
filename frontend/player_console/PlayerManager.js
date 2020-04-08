const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');

const AbstractRoleLoginManager = require('../AbstractRoleLoginManager').default;

class PlayerManager extends AbstractRoleLoginManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    super();
    this.roleName = constants.ROLE_NAME.PLAYER;
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new PlayerManager(singletonEnforcer);
    }
    return this[singleton];
  }
}

export default PlayerManager;
