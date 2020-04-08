'use strict';

const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const Crypto = require('../../common/Crypto').default;

const Writer = require('../models/Writer');

class WriterManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new WriterManager(singletonEnforcer);
    }
    return this[singleton];
  }

  obscureWithSalt(content, salt) {
    return Crypto.hmacSha1Sign(content, salt);
  }

  validateCredentialsAsync(handle, sha1HashedPassword, trx) {
    const instance = this;

    if (null == handle || "" == handle) {
      throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_HANDLE);
    }

    if (null == sha1HashedPassword || "" == sha1HashedPassword) {
      throw new signals.GeneralFailure(constants.RET_CODE.INCORRECT_PASSWORD);
    }

    return Writer.findOne({
      where: {
        handle: handle,
        deleted_at: null,
      },
      transaction: trx,
    })
      .then(function(doc) {
        if (!doc)
          throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_HANDLE);
        const salt = doc.salt;
        const savedPassword = doc.password;
        const toBeCheckedPassword = instance.obscureWithSalt(sha1HashedPassword, salt);

        if (savedPassword != toBeCheckedPassword) {
          throw new signals.GeneralFailure(constants.RET_CODE.INCORRECT_PASSWORD);
        }

        return doc;
      });
  }
}

exports.default = WriterManager;
