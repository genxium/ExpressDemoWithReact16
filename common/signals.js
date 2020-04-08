const constants = require('./constants');

class GeneralFailure {
  constructor(ret, errMsg) {
    this.ret = (undefined === ret || null === ret ? constants.RET_CODE.FAILURE : ret);
    this.errMsg = errMsg;
  }
}

exports.GeneralFailure = GeneralFailure;
