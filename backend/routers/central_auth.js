const baseAbsPath = __dirname + '/';
const express = require('express');

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Crypto = require('../../common/Crypto').default;
const Time = require('../../common/Time').default;
const LocaleManager = require('../../common/LocaleManager').default;

const MySQLManager = require('../utils/MySQLManager');
const NamedGatewayManager = require('../utils/NamedGatewayManager').default;
const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const AbstractAuthRouterCollection = require('./AbstractAuthRouterCollection').default;

const RoleLoginCacheCollection = require('../RoleLoginCacheCollection').default;

const yaml = require('js-yaml');
const fs = require('fs');

/*------------------------*/

//---credentialsAuthImpl begins.---

const _adminCredentialsAuthImpl = function(req, res, next) {
  const instance = this;
  const handle = req.body.handle;
  const hashedPassword = req.body.password;
  logger.info("_adminCredentialsAuthImpl, handle == " + handle + ", hashedPassword == " + hashedPassword);

  if (null == handle || "" == handle) {
    return instance.nonexistentHandle(res);
  }

  if (null == hashedPassword || "" == hashedPassword) {
    return instance.incorrectPassword(res);
  }

  try {
    // Intentionally re-parsing the conf file everytime.
    const config = yaml.safeLoad(fs.readFileSync(baseAbsPath + '../configs/admin_auth_dict.conf', 'utf8'));
    for (let k in config) {
      const adminDict = config[k];
      if (handle != adminDict.handle) {
        // Skip.
        continue;
      }
      if (hashedPassword == Crypto.sha1Sign(adminDict.pass)) {
        // Matched.
        req.loggedInRole = {
          id: adminDict.id,
          handle: adminDict.handle,
        };
        return next();
      }
      return instance.incorrectPassword(res); // Handle matched but incorrect password.
    }

    return instance.nonexistentHandle(res); // No matching handle.
  } catch (err) {
    return instance.respondWithError(res, err);
  }
};

const WriterManager = require('../utils/WriterManager').default;
const _writerCredentialsAuthImpl = function(req, res, next) {
  const instance = this;
  const handle = req.body.handle;
  const sha1HashedPassword = req.body.password;

  // logger.info("Received handle = ", handle, ", password = ", sha1HashedPassword);

  const trxInternalPromiseChain = (t) => {
    return WriterManager.instance.validateCredentialsAsync(handle, sha1HashedPassword, t);
  };

  const trxExternalPromise = MySQLManager.instance.dbRef.transaction(trxInternalPromiseChain);
  const onTrxExternalPromiseFulfilled = (result) => {
    if (null == result) {
      instance.respondWithError(res, null);
      return;
    }

    req.loggedInRole = result;
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

const credentialsAuthImpl = function(req, res, next) {
  const instance = this;
  const roleName = req.body.roleName;
  switch (roleName) {
    case constants.ROLE_NAME.ADMIN:
      return (_adminCredentialsAuthImpl.bind(instance))(req, res, next);
    case constants.ROLE_NAME.WRITER:
      return (_writerCredentialsAuthImpl.bind(instance))(req, res, next);
    default:
      return instance.nonexistentHandle(res);
  }
};

//---credentialsAuthImpl ends.---

/*------------------------*/

const createPageRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });
  router.get(constants.ROUTE_PATHS.LOGIN, instance.spa);

  return router;
};

class CentralAuthRouterCollection extends AbstractAuthRouterCollection {
  constructor(props) {
    super(props);
    const instance = this;
    this.credentialsAuth = credentialsAuthImpl.bind(instance);
    this.pageRouter = (createPageRouter.bind(instance))();
  }

  spa(req, res) {
    const jsBundle = '/bin/central_auth_console.bundle.js';
    const namedGatewayInfoEncoded = JSON.stringify(NamedGatewayManager.instance.config);
    res.render('console', {
      title: LocaleManager.instance.effectivePack().CENTRAL_AUTH_CONSOLE,
      jsBundleUri: constants.ROUTE_PATHS.BASE + jsBundle,
      namedGatewayInfo: namedGatewayInfoEncoded,
    });
  }

}

exports.default = CentralAuthRouterCollection;
