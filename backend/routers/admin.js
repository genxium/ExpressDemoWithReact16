const baseAbsPath = __dirname + '/';
const express = require('express');

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Crypto = require('../../common/Crypto').default;
const Time = require('../../common/Time').default;
const LocaleManager = require('../../common/LocaleManager').default;
const WriterUtil = require('../../common/WriterUtil').default;
const OrgUtil = require('../../common/OrgUtil').default;

const WriterManager = require('../utils/WriterManager').default;
const WriterTable = require('../models/Writer');

const OrgTable = require('../models/Org');
const SuborgTable = require('../models/Suborg');
const WriterSuborgBindingTable = require('../models/WriterSuborgBinding');

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

  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.LIST, instance.spa);
  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.ADD, instance.spa);
  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PARAMS.ORG_ID + constants.ROUTE_PATHS.EDIT, instance.spa);

  return router;
};

//---writer APIs begins---

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

  if (false == WriterUtil.instance.isFormValid({
      handle: handle,
      displayName: displayName,
    })) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterManager.instance.upsertWriterAsync(null, handle, displayName, newSha1HashedPassword, t)
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

const writerSaveApi = function(req, res) {
  const instance = this;
  const writerId = parseInt(req.params.writerId);
  const newHandle = req.body.handle;
  const newDisplayName = req.body.displayName;

  const newSha1HashedPassword = req.body.password;

  if (false == WriterUtil.instance.isFormValid({
      handle: newHandle,
      displayName: newDisplayName,
    })) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return WriterManager.instance.upsertWriterAsync(writerId, newHandle, newDisplayName, newSha1HashedPassword, t)
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
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
    return WriterManager.instance.deleteWritersSoftly([writerId], t)
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

//---writer APIs ends---

//---org APIs begins---

const orgPaginationListApi = function(req, res) {
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
    return OrgTable.findAndCountAll({
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
        orgList: result.rows,
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

const orgAddApi = function(req, res) {
  const instance = this;
  const newHandle = req.body.handle;
  const newDisplayName = req.body.displayName;

  if (false == OrgUtil.instance.isOrgFormValid({
      handle: newHandle,
      displayName: newDisplayName,
    })) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  const newModeratorHandle = req.body.newModeratorHandle;
  const newModeratorDisplayName = req.body.newModeratorDisplayName;
  const newModeratorSha1HashedPassword = req.body.newModeratorPassword;

  if (false == WriterUtil.instance.isFormValid({
      handle: newModeratorHandle,
      displayName: newModeratorDisplayName,
    })) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  let newOrg = null;
  let newSuborg = null;
  let newWriter = null;
  let newWriterSuborgBinding = null;

  const currentMillis = Time.currentMillis();

  MySQLManager.instance.dbRef.transaction(t => {
    return OrgManager.instance.upsertOrgAsync(null, newHandle, newDisplayName, t)
      .then(function(doc) {
        if (null != doc) {
          logger.warn("orgAddApi err #1, OrgManager.instance.upsertOrgAsync failed for ", {handle: newHandle, displayName: newDisplayName});
          throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
        }
        newOrg = doc;

        return WriterManager.instance.upsertWriterAsync(null, newModeratorHandle, newModeratorDisplayName, newModeratorSha1HashedPassword, t);        })
      .then(function(doc) {
        if (null == doc) {
          logger.warn("orgAddApi err #2, WriterManager.instance.upsertWriterAsync failed for ", {handle: newModeratorHandle, displayName: newModeratorDisplayName});
          throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
        }
        newWriter = doc;

        return OrgManager.instance.upsertSuborgAsync(newOrg.id, newSuborg.id, newType, newDisplayName, t);
      })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure();
        }
        newSuborg = doc;

        return WriterSuborgBindingTable.create({
          writer_id: newWriter.id,
          suborg_id: newSuborg.id,
          org_id: newOrg.id,
          created_at: currentMillis,
          updated_at: currentMillis,
        });
      })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure();
        }
        newWriterSuborgBinding = doc;

        res.json({
          ret: constants.RET_CODE.OK,
          org: newOrg,
          suborg: newSuborg,
          moderator: newWriter,
          writerSuborgBinding: newWriterSuborgBinding,
        });
      });
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const orgSaveApi = function(req, res) {
  const instance = this;
  const orgId = parseInt(req.params.orgId);

  const newHandle = req.body.handle;
  const newDisplayName = req.body.displayName;

  if (false == OrgUtil.instance.isOrgFormValid({
      handle: newHandle,
      displayName: newDisplayName,
    })) {
    res.json({
      ret: constants.RET_CODE.FAILURE,
    });
    return;
  }

  const newModeratorHandle = req.body.newModeratorHandle;
  const newModeratorDisplayName = req.body.newModeratorDisplayName;
  const newModeratorSha1HashedPassword = req.body.newModeratorPassword;

  const currentMillis = Time.currentMillis();

  MySQLManager.instance.dbRef.transaction(t => {
    return OrgTable.findOne({
      where: {
        handle: newHandle,
        deleted_at: null,
      },
      transaction: t
    })
      .then(function(doc) {
        if (null != doc && doc.id != orgId) {
          throw new signals.GeneralFailure(constants.RET_CODE.DUPLICATED);
        }

        const replacementSetObject = {
          handle: newHandle,
          display_name: newDisplayName,
        };

        return OrgTable.update(replacementSetObject, {
          where: {
            id: orgId,
            deleted_at: null,
          },
          transaction: t,
        });
      })
      .then(function(affectedRows) {
        const affectedRowsCount = affectedRows[0];
        if (1 != affectedRowsCount) {
          logger.warn("orgSaveApi, affectedRowsCount == ", affectedRowsCount);
          throw new signals.GeneralFailure();
        }
        
        // We'll physically delete the existing "MODERATOR binding" anyway, without making any change to the existing "writer" record. 
      })
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const orgDetailApi = function(req, res) {
  const instance = this;
  const orgId = parseInt(req.params.orgId);

  let theOrg = null;
  let theModeratorSuborg = null;
  let theModeratorSuborgBinding = null;
  let theModerator = null;

  MySQLManager.instance.dbRef.transaction(t => {
    return OrgTable.findOne({
      where: {
        id: orgId,
        deleted_at: null
      },
      transaction: t
    })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_ORG);
        }

        theOrg = doc;

        return SuborgTable.findOne({
          where: {
            org_id: orgId,
            parent_id: null,
            type: constants.SUBORG.TYPE.MODERATOR,
            deleted_at: null,
          },
          transaction: t
        });
      })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_SUBORG);
        }

        theModeratorSuborg = doc;

        return WriterSuborgBindingTable.findOne({
          where: {
            org_id: orgId,
            suborg_id: theModeratorSuborg.id,
            deleted_at: null,
          }
        }, {
          transaction: t
        });
      })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER_SUBORG_BINDING);
        }
        theModeratorSuborgBinding = doc;

        return WriterTable.findOne({
          where: {
            id: theModeratorSuborgBinding.writer_id,
            deleted_at: null,
          }
        }, {
          transaction: t
        });
      })
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER);
        }
        theModerator = doc;

        res.json({
          ret: constants.RET_CODE.OK,
          org: theOrg,
          suborg: theModeratorSuborg,
          moderator: theModerator,
          writerSuborgBinding: theModeratorSuborgBinding,
        });
      });
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const orgDeleteApi = function(req, res) {
  const instance = this;
  const currentMillis = Time.currentMillis();
  const orgId = parseInt(req.params.orgId);

  MySQLManager.instance.dbRef.transaction(t => {
    return OrgTable.update({
        deleted_at: currentMillis,
      }, {
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

//---org APIs ends---

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

  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.PAGINATION + constants.ROUTE_PATHS.LIST, orgPaginationListApi.bind(instance));
  router.post(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.ADD, orgAddApi.bind(instance));
  router.post(constants.ROUTE_PATHS.ORG + constants.ROUTE_PARAMS.ORG_ID + constants.ROUTE_PATHS.SAVE, orgSaveApi.bind(instance));
  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PARAMS.ORG_ID + constants.ROUTE_PATHS.DETAIL, orgDetailApi.bind(instance));
  router.post(constants.ROUTE_PATHS.ORG + constants.ROUTE_PARAMS.ORG_ID + constants.ROUTE_PATHS.DELETE, orgDeleteApi.bind(instance));

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
