'use strict';

const baseAbsPath = __dirname + '/';
const Time = require('../common/Time').default;

const singleton = Symbol();
const singletonEnforcer = Symbol();

const Logger = require('./utils/Logger');
const logger = Logger.instance.getLogger(__filename);
const RoleLoginCacheTable = require('./models/RoleLoginCache'); 

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Util = require('util');

class SingleRoleLoginCache {
  constructor(props) {
    this.props = props;
    this.defaultTtlSeconds = (7 * 24 * 60 * 60); // Default to 7 days.
  }

  getAsync(intAuthToken, trx) {
    const instance = this;
    const currentMillis = Time.currentMillis();
    logger.info("RoleLoginCacheCollection intAuthToken == ", intAuthToken, "currentMillis == ", currentMillis);
    return RoleLoginCacheTable.findOne({
      where: {
        int_auth_token: intAuthToken,
        expires_at: {
          [Op.gt]: currentMillis,
        },
        deleted_at: null,
      },
      transaction: trx
    });
  }

  setAsync(roleId, intAuthToken, fromPublicIp, metaData, customExpiresAtGmtZero, trx) {
    /*
     * Temporarily not kicking out old records.
     *
     * Reference http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-upsert.
     */
    const instance = this;
    logger.info(Util.format("RoleLoginCache.setAsync for roleId == %s, intAuthToken == %s, fromPublicIp == %s, metaData == %o, customExpiresAtGmtZero == %d", roleId, intAuthToken, fromPublicIp, metaData, customExpiresAtGmtZero));
    const currentMillis = Time.currentMillis();
    const expiresAtGmtMillis = (null == customExpiresAtGmtZero ? currentMillis + (instance.defaultTtlSeconds * 1000) : customExpiresAtGmtZero);
    const stringifiedMetaData = JSON.stringify(metaData);

    return RoleLoginCacheTable.upsert({
      role_id: roleId, 
      role_name: instance.props.roleName,
      int_auth_token: intAuthToken,
      from_public_ip: fromPublicIp,
      meta_data: stringifiedMetaData,
      expires_at: expiresAtGmtMillis,
      created_at: currentMillis,
      updated_at: currentMillis,
    }, {
      where: {
        role_id: roleId, 
        role_name: instance.props.roleName,
        expires_at: {
          $gt: currentMillis,
        },
        deleted_at: null,
      },
      transaction: trx
    });
  }

  delAsync(intAuthToken, trx) {
    const instance = this;
    return RoleLoginCacheTable.destroy({
      where: {
        int_auth_token: intAuthToken,
      },
      limit: 1,
      transaction: trx
    });
  }
}

class RoleLoginCacheCollection {
  constructor(props) {
    this.props = props;
    this._cacheCollection = {};
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new RoleLoginCacheCollection(singletonEnforcer);
    }
    return this[singleton];
  }

  getOrCreateCacheSync(namespace) {
    const instance = this;
    if (null != instance._cacheCollection[namespace]) {
      return instance._cacheCollection[namespace];
    }
    const newCache = new SingleRoleLoginCache({
      roleName: namespace
    });
    instance._cacheCollection[namespace] = newCache;
    return newCache;
  }
}

exports.default = RoleLoginCacheCollection;
