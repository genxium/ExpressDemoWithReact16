'use strict';

const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const Crypto = require('../../common/Crypto').default;
const Time = require('../../common/Time').default;

const Logger = require('./Logger');
const logger = Logger.instance.getLogger(__filename);

const WriterTable = require('../models/Writer');

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

    return WriterTable.findOne({
      where: {
        handle: handle,
        deleted_at: null,
      },
      transaction: trx,
    })
      .then(function(doc) {
        if (!doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_HANDLE);
        }
        const salt = doc.salt;
        const savedPassword = doc.password;
        const toBeCheckedPassword = instance.obscureWithSalt(sha1HashedPassword, salt);

        if (savedPassword != toBeCheckedPassword) {
          throw new signals.GeneralFailure(constants.RET_CODE.INCORRECT_PASSWORD);
        }

        return doc;
      });
  }

  upsertWriterAsync(specifiedWriterId, newHandle, newDisplayName, newSha1HashedPassword, trx) {
    /*
    * [WARNING]
    *
    * Only a "loggedInRole" with sufficient access level should invoke this method.
    */

    /*
     * It's by design that "sequelizejs Model.upsert" is not used here, because it has no distinction between "all failed" and "anything succeeded". Reference https://sequelize.org/v5/class/lib/model.js~Model.html#static-method-upsert. 
     * 
     * ```
     * For MySQL/MariaDB, it returns `true` when inserted and `false` when updated.
     * ```
     *
     * Moreover, this is not a common "SQL `INSERT ON DUPLICATE KEY UPDATE`" operation.
     *
     * Although We rely on "UNIQUE KEY CONSTRAINT on `writer.handle`" to reject duplicate handles, in the case of "null != specifiedWriterId", the request aims to update an existing "writer" record by "id" rather than the "UNIQUE KEY `writer.handle`".     
     */

    const currentMillis = Time.currentMillis();

    const replacementSetObject = {
      handle: newHandle,
      display_name: newDisplayName,
      updated_at: currentMillis,
    };

    if (null != newSha1HashedPassword && "" != newSha1HashedPassword) {
      newSalt = Crypto.sha1Sign(NetworkFunc.guid());
      newObsuredPassword = WriterManager.instance.obscureWithSalt(newSha1HashedPassword, newSalt);
      Object.assign(replacementSetObject, {
        salt: newSalt,
        password: newObsuredPassword,
      });
    }

    if (null != specifiedWriterId) {
      const whereObject = {
        id: specifiedWriterId,
        deleted_at: null,
      };
      return WriterTable.update(replacementSetObject, {
        transaction: trx,
      })
      .then(function(affectedRows) {
        const affectedRowsCount = affectedRows[0]; 
        if (1 != affectedRowsCount) {   
          logger.warn("upsertWriterAsync, affectedRowsCount == ", affectedRowsCount);
          throw new signals.GeneralFailure();
        }
        return WriterTable.findOne({
          where: whereObject,
          transaction: trx,
        });
      });
    } else {
      Object.assign(replacementSetObject, {
        created_at: currentMillis,
      });
      return WriterTable.create(replacementSetObject, {
        transaction: trx,
      });
    };
  }

  deleteWritersSoftlyAsync(writerIdList, trx) {
    const currentMillis = Time.currentMillis();

    const deleteSoftlyWhereObject = {
      id: specifiedSuborgId,
      org_id: specifiedOrgId, 
      deleted_at: null,
    };

    return WriterTable.update({
      deleted_at: currentMillis,
    }, {
      where: deleteSoftlyWhereObject,
      transaction: trx,
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      return affectedRowsCount; 
    });
  }
}

exports.default = WriterManager;
