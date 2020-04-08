const express = require('express');
const constants = require('../../common/constants');
const signals = require('../../common/signals');

const NetworkFunc = require('../../common/NetworkFunc').default;
const Time = require('../../common/Time').default;

const RoleLoginCacheCollection = require('../RoleLoginCacheCollection').default;

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const Util = require('util');

const MySQLManager = require('../utils/MySQLManager');

class AbstractAuthRouterCollection {
  constructor(props) {
    const instance = this;

    // Auth middlewares begin.
    // NOTE: Ref binding is required in children classes.
    this.credentialsAuth = null;
    this.tokenAuth = function(req, res, next) {
      const token = (null == req.body || null == req.body.token ? req.query.token : req.body.token);
      logger.info("Processing tokenAuth for req.originalUrl = ", req.originalUrl, ", req.query = ", req.query, ", token = ", token);
      
      if (null == token || "" == token) {
        return instance.tokenExpired(res);
      };
  
      const trxInternalPromiseChain = (t) => {
        let tokenCache = instance.getOrCreateTokenCacheSync(req);
        return tokenCache.getAsync(token, t); 
      };

      const trxExternalPromise = MySQLManager.instance.dbRef.transaction(trxInternalPromiseChain);
      const onTrxExternalPromiseFulfilled = (result) => {
        if (null == result) {
          instance.tokenExpired(res);
          return;
        } 
        
        // logger.info(Util.format("AbstractAuthRouterCollection.tokenAuth, got result.meta_data == %o for token == %s.", result.meta_data, token));
        req.loggedInRole = JSON.parse(result.meta_data);
        return next();
      };
      const onTrxExternalPromiseRejected = (err) => {
        return instance.respondWithError(res, err);
      };

      trxExternalPromise
      .then(onTrxExternalPromiseFulfilled, onTrxExternalPromiseRejected)
      /*
      // Possibly due to a bug of "bluebird" https://github.com/petkaantonov/bluebird/issues/846, calling ".catch" or ".catch.finally" on "trxExternalPromise" will cause "unreturned promise warning". -- YFLu, 2020-03-07
      .catch((err) => {
        ...
      })
      .finally(() => {
        ...
      })
      */
      ; 
    };
    // Auth middlewares end.

    this.pageRouter = null; 
    this.authProtectedApiRouter = null; 
  }

  nonexistentHandle(res) {
    return res.json({
      ret: constants.RET_CODE.NONEXISTENT_HANDLE,
    });
  }

  incorrectPassword(res) {
    return res.json({
      ret: constants.RET_CODE.INCORRECT_PASSWORD,
    });
  }

  tokenExpired(res) {
    return res.json({
      ret: constants.RET_CODE.TOKEN_EXPIRED,
    });
  }

  respondWithError(res, err) {
    if (null != err.sql) {
      logger.error(Util.format("MySQLManager error occurred when executing\n%s", err.sql));
    }
    logger.error(err.stack);
    const retCode = ( (null == err || null == err.ret) ? constants.RET_CODE.FAILURE : err.ret );
    res.json({
      ret: retCode,
    });
  }

  getOrCreateTokenCacheSync(req) {
    const instance = this;
    if (null != instance.tokenCache) {
      return instance.tokenCache;
    }
    const roleName = req.body.roleName;
    switch (roleName) {
      case constants.ROLE_NAME.ADMIN:
      case constants.ROLE_NAME.WRITER:
      case constants.ROLE_NAME.PLAYER:
        return RoleLoginCacheCollection.instance.getOrCreateCacheSync(roleName);
        break;       
      default:         
        logger.warn(Util.format("AbstractAuthRouterCollection.getOrCreateTokenCacheSync returning null for req.roleName == %s", req.roleName));
        return null;
    }
  }

  commonLogoutFinalHandler(req, res) {
    const instance = this;
    const token = req.body.token;

    let tokenCache = instance.getOrCreateTokenCacheSync(req);

    MySQLManager.instance.dbRef.transaction(t => {
      return tokenCache.delAsync(token, t)
      .then(function(trueOrFalse) {
        res.json({
          ret: (trueOrFalse ? constants.RET_CODE.OK : constants.RET_CODE.FAILURE)
        });
      })
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
  }

  commonLoggedInFinalHandler(req, res) {
    const instance = this;
    const newToken = NetworkFunc.guid();
    const loggedInRole = req.loggedInRole;

    const fromPublicIp = req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress || '';

    let tokenCache = instance.getOrCreateTokenCacheSync(req);
    const expiresAtGmtZero = Time.currentMillis() + (tokenCache.defaultTtlSeconds*1000);
    MySQLManager.instance.dbRef.transaction(t => {
      return tokenCache.setAsync(loggedInRole.id, newToken, fromPublicIp, loggedInRole, expiresAtGmtZero, t)
    })
    .then((trueOrFalse) => {
      if (false == trueOrFalse) {
        const toRet = {
          ret: constants.RET_CODE.FAILURE,
        };
        res.json(toRet);
      } else {
        const toRet = {
          ret: constants.RET_CODE.OK,
          loggedInRole: loggedInRole,
          token: newToken,
          expiresAtGmtZero: expiresAtGmtZero,
        };
        // logger.info(Util.format("AbstractAuthRouterCollection.commonLoggedInFinalHandler, onFulfilled, toRet = %o", toRet));
        res.json(toRet);
      }
    }, (err) => {
      logger.error(Util.format("AbstractAuthRouterCollection.commonLoggedInFinalHandler, onRejected, err = %o", err));
      instance.respondWithError(res, err);
    });
  }
}

exports.default = AbstractAuthRouterCollection;
