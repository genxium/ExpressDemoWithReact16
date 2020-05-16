const baseAbsPath = __dirname + '/';
const express = require('express');

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Time = require('../../common/Time').default;
const LocaleManager = require('../../common/LocaleManager').default;

const ArticleTable = require('../models/Article');
const AttachmentTable = require('../models/Attachment');

const OrgTable = require('../models/Org');

const QiniuServerUtil = require('../utils/QiniuServerUtil').default;

const RoleLoginCacheCollection = require('../RoleLoginCacheCollection').default;

const AbstractAuthRouterCollection = require('./AbstractAuthRouterCollection').default;
const NamedGatewayManager = require('../utils/NamedGatewayManager').default;

const MySQLManager = require('../utils/MySQLManager');
const ArticleUtil = require('../../common/ArticleUtil').default;

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const writerDao = require('../dao/writer');
const sharedDao = require('../dao/shared');

const Sequelize = require('sequelize');
const SequelizeOp = Sequelize.Op;

const mime = require('mime');

const createPageRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });
  router.get(constants.ROUTE_PATHS.ROOT, instance.spa);
  router.get(constants.ROUTE_PATHS.HOME, instance.spa);
  router.get(constants.ROUTE_PATHS.SYNC_CB, instance.spa);

  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.LIST, instance.spa);
  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.ADD, instance.spa);
  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.EDIT, instance.spa);

  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.LIST, instance.spa);
  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.EDIT, instance.spa);

  return router;
};

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

  const loggedInRole = req.loggedInRole;

  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  /*
   * References 
   * - https://sequelize.org/v5/manual/raw-queries.html,
   * - https://github.com/sidorares/node-mysql2/blob/master/README.md#using-prepared-statements.
   *
   * It seems like that "sequelizeJs + node-mysql2" is not using PreparedStatement in a smart enough way to prevent naive SQLInjections. To verify whether "PreparedStatement" is in use, check the "`general_log` of MySQL" https://dev.mysql.com/doc/refman/5.7/en/query-log.html.
   *
   * For the convenience of getting started, use 
   * ```
   * SET GLOBAL general_log = 1; # Verify by "SELECT @@GLOBAL.general_log".
   * SET GLOBAL log_output='TABLE'; # Verify by "SELECT @@GLOBAL.log_output".
   * SELECT * FROM mysql.general_log ORDER BY event_time DESC LIMIT 100;
   * ```
   * via a "mysqlclient" to do the checking is recommended, see https://dev.mysql.com/doc/refman/5.7/en/log-destinations.html for details.
   */

  let orgList = null;
  MySQLManager.instance.dbRef.transaction(t => {
    return MySQLManager.instance.dbRef.query(
    "SELECT a.id as id,a.handle as handle,a.display_name as display_name, a.updated_at as updated_at FROM org as a JOIN writer_suborg_binding as b ON a.deleted_at is NULL AND b.deleted_at is NULL AND a.id=b.org_id AND b.writer_id=? AND (a.display_name LIKE ? OR a.handle LIKE ?) GROUP BY id ORDER BY ?,? LIMIT ?,?"
    , {
      model: OrgTable,
      mappToModel: true,
      replacements: [loggedInRole.id, "%" + searchKeyword + "%", "%" + searchKeyword + "%", orderKey, orientation, (page - 1)*nPerPage, nPerPage],
      type: Sequelize.QueryTypes.SELECT,
      transaction: t,
    })
    .then(function(resultRows) {
      if (null == resultRows) {
        throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
      }
      orgList = resultRows;
      
      return MySQLManager.instance.dbRef.query(
      "SELECT COUNT(DISTINCT a.id) as total FROM org as a JOIN writer_suborg_binding as b ON a.deleted_at is NULL AND b.deleted_at is NULL AND a.id=b.org_id AND b.writer_id=? AND (a.display_name LIKE ? OR a.handle LIKE ?)"
      , {
        replacements: [loggedInRole.id, "%" + searchKeyword + "%", "%" + searchKeyword + "%"],
        type: Sequelize.QueryTypes.SELECT,
        transaction: t,
      });
    })
  })
    .then(function(resultRows) {
      const totalCount = (null == resultRows ? 0 : resultRows[0].total);
      res.json({
        ret: constants.RET_CODE.OK,
        orgList: orgList,
        page: page,
        nPerPage: nPerPage,
        requestNo: requestNo,
        totalCount: totalCount,
      });
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const articlePaginationListApi = function(req, res) {
  const instance = this;
  const requestNo = req.query.requestNo;
  const page = parseInt(req.query.page);

  const nPerPage = 10;
  const orientation = constants.DESC;
  const orderKey = constants.UPDATED_AT;

  let state = parseInt(req.query.state);
  if (isNaN(state) || constants.ARTICLE.STATE.NONE == state) {
    state = null;
  }

  let category = parseInt(req.query.category);
  if (isNaN(category) || constants.ARTICLE.CATEGORY.NONE == category) {
    category = null;
  }

  let searchKeyword = "";
  if (null != req.query.searchKeyword) {
    searchKeyword = req.query.searchKeyword;
  }

  const loggedInRole = req.loggedInRole;

  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  let whereCondition = {
    writer_id: loggedInRole.id,
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

  if (null != state) {
    Object.assign(whereCondition, {
      state: state
    });
  }

  if (null != category) {
    Object.assign(whereCondition, {
      category: category
    });
  }

  if (0 < orConditions.length) {
    Object.assign(whereCondition, {
      [SequelizeOp.or]: orConditions
    });
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return ArticleTable.findAndCountAll({
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
        articleList: result.rows,
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

const articleDetailApi = function(req, res) {
  const instance = this;
  let articleId = (null == req.query.articleId ? null : parseInt(req.query.articleId));
  let article = null;
  const loggedInRole = req.loggedInRole;

  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return writerDao.queryReadableArticleAsync(articleId, loggedInRole.id, t)
      .then(function(doc) {
        if (null == doc) {
          throw new signals.GeneralFailure();
        }
        article = doc;
        return sharedDao.appendAttachmentListForArticleAsync(article, ArticleUtil.instance.clientAccessibleMimeTypes(), t);
      })
  })
    .then(function(doc) {
      res.json({
        ret: constants.RET_CODE.OK,
        article: article,
      });
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const articleSaveApi = function(req, res) {
  const instance = this;
  const loggedInRole = req.loggedInRole;

  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  // TODO: Use a more efficient codec for "keywordList", e.g. protobuf.
  const keywordList = JSON.parse(req.body.keywordList);
  const ossFilepathList = JSON.parse(req.body.ossFilepathList);

  const bundle = {
    title: req.body.title,
    category: parseInt(req.body.category),
    content: req.body.content,
    keywordList: keywordList,
    ossFilepathList: ossFilepathList,
  };

  const writerId = loggedInRole.id;
  let waitFor = null;
  let articleId = (null == req.body.articleId ? null : parseInt(req.body.articleId));
  let article = null;

  MySQLManager.instance.dbRef.transaction(t => {
    if (null === articleId) {
      waitFor = writerDao.saveNewArticleAsync(writerId, bundle, t);
    } else {
      waitFor = writerDao.overwriteArticleAsync(articleId, writerId, bundle, t);
    }
    return waitFor
      .then(function(effectiveArticleId) {
        logger.info("Got `effectiveArticleId` == ", effectiveArticleId, "during invoking `articleSaveApi`");
        articleId = effectiveArticleId;
        return writerDao.queryEditableArticleAsync(articleId, writerId, t);
      })
      .then(function(doc) {
        if (null == doc) {
          logger.error("Error occurred when invoking `articleSaveApi` #1");
          throw new signals.GeneralFailure();
        }
        article = doc;
        return sharedDao.appendAttachmentListForArticleAsync(doc, ArticleUtil.instance.clientAccessibleMimeTypes(), t);
      });
  })
    .then(function(doc) {
      res.json({
        ret: constants.RET_CODE.OK,
        article: article,
      });
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const articleSubmitApi = function(req, res) {
  const instance = this;
  let articleId = (null == req.body.articleId ? null : parseInt(req.body.articleId));

  const loggedInRole = req.loggedInRole;
  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return writerDao.submitArticleAsync(articleId, loggedInRole.id, t)
      .then(function(affectedRowsCount) {
        if (1 != affectedRowsCount) {
          throw new signals.GeneralFailure();
        }
        res.json({
          ret: constants.RET_CODE.OK,
        });
      })
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const articleSuspendApi = function(req, res) {
  const instance = this;
  let articleId = (null == req.body.articleId ? null : parseInt(req.body.articleId));

  const reason = (null == req.body.reason ? null : req.body.reason);

  const loggedInRole = req.loggedInRole;
  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  MySQLManager.instance.dbRef.transaction(t => {
    return writerDao.suspendArticleAsync(articleId, loggedInRole.id, reason, t)
      .then(function(affectedRowsCount) {
        if (1 != affectedRowsCount) {
          throw new signals.GeneralFailure();
        }
        res.json({
          ret: constants.RET_CODE.OK,
        });
      })
  })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const uptokenFetchApi = function(req, res) {
  const instance = this;

  const mimeTypeGroup = req.query.mimeTypeGroup;
  let downloadEndpoint = null;
  let policyRoot = null;

  switch (mimeTypeGroup) {
    case constants.ATTACHMENT.IMAGE.LITERAL:
      downloadEndpoint = QiniuServerUtil.instance.config.imageDownloadEndpoint;
      policyRoot = constants.ATTACHMENT.IMAGE.POLICY;
      break;
    case constants.ATTACHMENT.VIDEO.LITERAL:
      downloadEndpoint = QiniuServerUtil.instance.config.videoDownloadEndpoint;
      policyRoot = constants.ATTACHMENT.VIDEO.POLICY;
      break;
    default:
      break;
  }

  if (null == downloadEndpoint || null == policyRoot) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.UPTOKEN_INVALID_MIME_TYPE_GROUP));
    return;
  }

  let remoteName = null;
  const currentMillis = Time.currentMillis();
  const bucket = QiniuServerUtil.instance.config.bucket;
  const uphost = QiniuServerUtil.instance.config.uphost;

  const loggedInRole = req.loggedInRole;
  if (null == loggedInRole) {
    instance.respondWithError(res, new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER));
    return;
  }

  let expectedMimetype = req.query.expectedMimetype;
  remoteName = "w_" + loggedInRole.id.toString() + "_" + currentMillis + "/" + constants.ATTACHMENT.ORIGINAL.LITERAL;

  // Only if a valid "expectedMimetype" were specified should the "" be handled. -- YFLu, 2020-04-07
  if (
    null != expectedMimetype
    &&
    (
    -1 != constants.ATTACHMENT.IMAGE.indexOf(expectedMimetype)
    ||
    -1 != constants.ATTACHMENT.VIDEO.indexOf(expectedMimetype)
    )
  ) {
    const expectedExtension = mime.getExtension(expectedMimetype);
    if (null != expectedExtension) {
      remoteName += ("." + expectedExtension);
    }
  } else {
    expectedMimetype = "";
  }

  const criteria = {
    oss_filepath: remoteName,
    oss_bucket: bucket,

    owner_meta_type: constants.ATTACHMENT.OWNER_META_TYPE.WRITER,
    owner_meta_id: loggedInRole.id,
  };

  const replacementSetObject = {
    state: constants.ATTACHMENT.STATE.CREATED_UNSOLIDIFIED,
    transcoding_failure_count: 0,
    max_transcoding_failure_count: 3,

    mime_type: expectedMimetype,

    oss_filepath: remoteName,
    oss_bucket: bucket,

    meta_type: constants.ATTACHMENT.META_TYPE.UNKNOWN,
    meta_id: null,

    owner_meta_type: constants.ATTACHMENT.OWNER_META_TYPE.WRITER,
    owner_meta_id: loggedInRole.id,

    created_at: currentMillis,
    updated_at: currentMillis,
  };

  let waitFor = null;
  MySQLManager.instance.dbRef.transaction(t => {
    return AttachmentTable.findOne({
      where: criteria,
      transaction: t
    })
      .then(function(doc) {
        if (null == doc) {
          waitFor = AttachmentTable.create(replacementSetObject, {
            transaction: t
          });
        } else {
          waitFor = AttachmentTable.update(replacementSetObject, {
            where: {
              id: doc.id,
            },
            transaction: t
          });
        }

        return waitFor;
      })
      .then(function(result) {
        if (null == result) {
          throw new signals.GeneralFailure();
        }

        const rawPutPolicyDict = {
          scope: bucket + ':' + remoteName,
          fsizeLimit: policyRoot.SINGLE_SIZE_LIMIT_BYTES,
          mimeLimit: policyRoot.WRITE_ALLOWED_MIME_TYPES.join(';')
        };
        return QiniuServerUtil.instance.createUptokenAsync(rawPutPolicyDict);
      });
  })
    .then(function(uptoken) {
      if (null == uptoken) {
        logger.warn("Failed to generate uptoken.");
        throw new signals.GeneralFailure();
      }
      res.json({
        ret: constants.RET_CODE.OK,
        bucket: bucket,
        uphost: uphost,
        downloadEndpoint: downloadEndpoint,
        ossFilepath: remoteName,
        uptoken: uptoken
      });
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const createAuthProtectedApiRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });

  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.PAGINATION + constants.ROUTE_PATHS.LIST, articlePaginationListApi.bind(instance));
  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.DETAIL, articleDetailApi.bind(instance));
  router.post(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SAVE, articleSaveApi.bind(instance));
  router.post(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SUBMIT, articleSubmitApi.bind(instance));
  router.post(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PATHS.SUSPEND, articleSuspendApi.bind(instance));

  router.get(constants.ROUTE_PATHS.ORG + constants.ROUTE_PATHS.PAGINATION + constants.ROUTE_PATHS.LIST, orgPaginationListApi.bind(instance));

  router.get(constants.ROUTE_PATHS.UPTOKEN + constants.ROUTE_PATHS.FETCH, uptokenFetchApi.bind(instance));
  return router;
};

class WriterRouterCollection extends AbstractAuthRouterCollection {
  constructor(props) {
    super(props);
    const instance = this;
    this.tokenCache = RoleLoginCacheCollection.instance.getOrCreateCacheSync(constants.ROLE_NAME.WRITER);

    this.pageRouter = (createPageRouter.bind(instance))();
    this.authProtectedApiRouter = (createAuthProtectedApiRouter.bind(instance))();
  }

  spa(req, res) {
    const jsBundle = '/bin/writer_console.bundle.js';
    const namedGatewayInfoEncoded = JSON.stringify(NamedGatewayManager.instance.config);
    res.render('console', {
      title: LocaleManager.instance.effectivePack().WRITER_CONSOLE,
      jsBundleUri: constants.ROUTE_PATHS.BASE + jsBundle,
      namedGatewayInfo: namedGatewayInfoEncoded,
    });
  }
}

exports.default = WriterRouterCollection;
