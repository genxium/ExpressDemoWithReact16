const baseAbsPath = __dirname + '/';
const express = require('express');

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Crypto = require('../../common/Crypto').default;
const Time = require('../../common/Time').default;
const LocaleManager = require('../../common/LocaleManager').default;

const WriterManager = require('../utils/WriterManager').default;
const WriterTable = require('../models/Writer');

const MySQLManager = require('../utils/MySQLManager');

const RoleLoginCacheCollection = require('../RoleLoginCacheCollection').default;

const AbstractAuthRouterCollection = require('./AbstractAuthRouterCollection').default;

const NamedGatewayManager = require('../utils/NamedGatewayManager').default;

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const SequelizeOp = require('sequelize').Op;

const createPageRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });
  router.get(constants.ROUTE_PATHS.ROOT, instance.spa);
  router.get(constants.ROUTE_PATHS.HOME, instance.spa);
  router.get(constants.ROUTE_PATHS.SYNC_CB, instance.spa);

  router.get(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.LIST, instance.spa);
  router.get(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.ADD, instance.spa);
  router.get(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PARAMS.WRITER_ID + constants.ROUTE_PATHS.EDIT, instance.spa);

  return router;
};

//---writer APIs begin---

const writerPaginationListApi = function(req, res) {
  const instance = this;
  const requestNo = req.query.requestNo;
  const page = parseInt(req.query.page);

  const nPerPage = 10;
  const orientation = constants.DESC;
  const orderKey = constants.UPDATED_AT;

  let searchKeyword = "";
  if (null != req.query.searchKeyword) {
    searchKeyword = req.query.searchKeyword;
  }

  let whereCondition = {
    deleted_at: null
  };

  let orConditions = [];
  if (null != searchKeyword && "" != searchKeyword) {
    orConditions.push({
      handle: {
        [SequelizeOp.like]: '%' + searchKeyword + '%'
      },
    });
    orConditions.push({
      display_name: {
        [SequelizeOp.like]: '%' + searchKeyword + '%'
      },
    });
  }

  if (0 < orConditions.length) {
    Object.assign(whereCondition, {
      [SequelizeOp.or]: orConditions
    });
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterTable.findAndCountAll({
      where: whereCondition,
      transaction: t,
      order: [[orderKey, orientation]],
      limit: nPerPage,
      offset: (page - 1) * nPerPage
    });
  })
    .then(function(result) {
      if (null == result) {
        throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
      }
      res.json({
        ret: constants.RET_CODE.OK,
        writerList: result.rows,
        page: page,
        nPerPage: nPerPage,
        requestNo: requestNo,
        totalCount: result.count,
      });
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const writerAddApi = function(req, res) {
  const instance = this;
  const handle = req.body.handle;
  const displayName = req.body.displayName;

  const newSha1HashedPassword = req.body.password;
  let newSalt = null;
  let newObsuredPassword = null;
  if (null != newSha1HashedPassword && "" != newSha1HashedPassword) {
    newSalt = Crypto.sha1Sign(NetworkFunc.guid());
    newObsuredPassword = WriterManager.instance.obscureWithSalt(newSha1HashedPassword, newSalt);
  }

  if (false == constants.REGEX.WRITER_HANDLE.test(handle) || false == constants.REGEX.WRITER_DISPLAY_NAME.test(displayName)) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterTable.findOne({
      where: {
        handle: handle,
        deleted_at: null
      },
      transaction: t
    })
      .then(function(doc) {
        if (null != doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.DUPLICATED);
        }

        const currentMillis = Time.currentMillis();
        return WriterTable.create({
          handle: handle,
          display_name: displayName,
          salt: newSalt,
          password: newObsuredPassword,
          created_at: currentMillis,
          updated_at: currentMillis,
        }, {
          transaction: t
        });
      })
      .then(function(newWriter) {
        if (null == newWriter) {
          throw new signals.GeneralFailure();
        }

        res.json({
          ret: constants.RET_CODE.OK,
          writer: newWriter,
        });
      });
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const writerSaveApi = function(req, res) {
  const instance = this;
  const writerId = parseInt(req.params.writerId);
  const newHandle = req.body.handle;
  const newDisplayName = req.body.displayName;

  const newSha1HashedPassword = req.body.password;
  let newSalt = null;
  let newObsuredPassword = null;
  if (null != newSha1HashedPassword && "" != newSha1HashedPassword) {
    newSalt = Crypto.sha1Sign(NetworkFunc.guid());
    newObsuredPassword = WriterManager.instance.obscureWithSalt(newSha1HashedPassword, newSalt);
  }

  if (!constants.REGEX.WRITER_HANDLE.test(newHandle)) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  if (!constants.REGEX.WRITER_DISPLAY_NAME.test(newDisplayName)) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  const currentMillis = Time.currentMillis();

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterTable.findOne({
      where: {
        handle: newHandle,
        deleted_at: null,
      },
      transaction: t
    })
    .then(function(doc) {
      if (null != doc && doc.id != writerId) {
        throw new signals.GeneralFailure(constants.RET_CODE.DUPLICATED);
      }

      const replacementSetObject = {
        handle: newHandle,
        display_name: newDisplayName,
        updated_at: currentMillis,
      };

      if (null != newSalt && null != newObsuredPassword) {
        Object.assign(replacementSetObject, {
          salt: newSalt,
          password: newObsuredPassword,
        });
      }

      return WriterTable.update(replacementSetObject, {
        where: {
          id: writerId,
          deleted_at: null,
        },
        transaction: t,
      });
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      if (1 != affectedRowsCount) {
        logger.warn("writerSaveApi, affectedRowsCount == ", affectedRowsCount);
        throw new signals.GeneralFailure();
      }

      res.json({
        ret: constants.RET_CODE.OK,
      });
    });
  })
  .catch(function(err) {
    instance.respondWithError(res, err);
  });
};

const writerDetailApi = function(req, res) {
  const instance = this;
  const writerId = parseInt(req.params.writerId);

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterTable.findOne({
      where: {
        id: writerId,
        deleted_at: null,
      },
      transaction: t
    }, {
      id: 1,
      handle: 1,
      display_name: 1,
      created_at: 1,
      updated_at: 1,
    })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure();
        }
        res.json({
          ret: constants.RET_CODE.OK,
          writer: doc,
        });
      });
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const writerDeleteApi = function(req, res) {
  const instance = this;
  const writerId = parseInt(req.params.writerId);

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterTable.destroy({
      where: {
        id: writerId,
        deleted_at: null,
      },
      transaction: t,
    })
    .then(function(affectedRowsCount) {
      if (1 != affectedRowsCount) {
        throw new signals.GeneralFailure();
      }

      res.json({
        ret: constants.RET_CODE.OK,
      });
    });
  })
  .catch(function(err) {
    instance.respondWithError(res, err);
  });
};

//---writer APIs end---

const createAuthProtectedApiRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });

  router.get(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.PAGINATION + constants.ROUTE_PATHS.LIST, writerPaginationListApi.bind(instance));
  router.post(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PATHS.ADD, writerAddApi.bind(instance));
  router.post(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PARAMS.WRITER_ID + constants.ROUTE_PATHS.SAVE, writerSaveApi.bind(instance));
  router.get(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PARAMS.WRITER_ID + constants.ROUTE_PATHS.DETAIL, writerDetailApi.bind(instance));
  router.post(constants.ROUTE_PATHS.WRITER + constants.ROUTE_PARAMS.WRITER_ID + constants.ROUTE_PATHS.DELETE, writerDeleteApi.bind(instance));

  return router;
};

class AdminRouterCollection extends AbstractAuthRouterCollection {
  constructor(props) {
    super(props);
    const instance = this;
    this.tokenCache = RoleLoginCacheCollection.instance.getOrCreateCacheSync(constants.ROLE_NAME.ADMIN);

    this.pageRouter = (createPageRouter.bind(instance))();
    this.authProtectedApiRouter = (createAuthProtectedApiRouter.bind(instance))();
  }

  spa(req, res) {
    const jsBundle = '/bin/admin_console.bundle.js';
    const namedGatewayInfoEncoded = JSON.stringify(NamedGatewayManager.instance.config);
    res.render('console', {
      title: LocaleManager.instance.effectivePack().ADMIN_CONSOLE,
      jsBundleUri: constants.ROUTE_PATHS.BASE + jsBundle,
      namedGatewayInfo: namedGatewayInfoEncoded,
    });
  }
}

exports.default = AdminRouterCollection;
