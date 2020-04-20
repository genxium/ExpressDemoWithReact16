const constants = require('../../common/constants')
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Time = require('../../common/Time').default;
const Crypto = require('../../common/Crypto').default;
const ArticleUtil = require('../../common/ArticleUtil').default;

const WriterTable = require('../models/Writer');
const ArticleTable = require('../models/Article');
const AttachmentTable = require('../models/Attachment');

const sharedDao = require('./shared');

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const validateCredentialsAsync = function(handle, sha1HashedPassword, trx) {
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
      const toBeCheckedPassword = Crypto.obscureWithSalt(sha1HashedPassword, salt);

      if (savedPassword != toBeCheckedPassword) {
        throw new signals.GeneralFailure(constants.RET_CODE.INCORRECT_PASSWORD);
      }

      return doc;
    });
};
exports.validateCredentialsAsync = validateCredentialsAsync;

const upsertWriterAsync = function(specifiedWriterId, newHandle, newDisplayName, newSha1HashedPassword, trx) {
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
    newObsuredPassword = Crypto.obscureWithSalt(newSha1HashedPassword, newSalt);
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
};
exports.upsertWriterAsync = upsertWriterAsync;

const deleteWritersSoftlyAsync = function(writerIdList, trx) {
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
};
exports.deleteWritersSoftlyAsync = deleteWritersSoftlyAsync;

function queryWriterListAsync(writerIdList, page, nPerPage, orderByConditionList, trx) {
  const whereCondition = {
    id: writerIdList,
    deleted_at: null,
  };
  return WriterTable.findAndCountAll({
    where: whereCondition,
    transaction: trx,
    order: orderByConditionList,
    limit: nPerPage,
    offset: (page - 1) * nPerPage
  });
}
exports.queryWriterListAsync = queryWriterListAsync;

function queryEditableArticleAsync(articleId, writerId, trx) {
  return ArticleTable.findOne({
    where: {
      id: articleId,
      writer_id: writerId,
      state: ArticleUtil.instance.editableStateList(),
      deleted_at: null,
    },
    transaction: trx,
  })
    .then(function(doc) {
      // It's necessary to convert "SequelizeModelInstance `article`" to "JSObject `article`" such that the following "Object.assign" works. -- YFLu, 2020-04-05
      const jsonIns = doc.toJSON();
      const keywordList = JSON.parse(doc.keyword_list);
      Object.assign(jsonIns, {
        keywordList: keywordList,
      });
      return jsonIns;
    });
}
exports.queryEditableArticleAsync = queryEditableArticleAsync;

function queryReadableArticleAsync(articleId, writerId, trx) {
  return ArticleTable.findOne({
    where: {
      id: articleId,
      writer_id: writerId,
      deleted_at: null,
    },
    transaction: trx,
  })
    .then(function(doc) {
      // It's necessary to convert "SequelizeModelInstance `article`" to "JSObject `article`" such that the following "Object.assign" works. -- YFLu, 2020-04-05
      const jsonIns = doc.toJSON();
      const keywordList = JSON.parse(doc.keyword_list);
      Object.assign(jsonIns, {
        keywordList: keywordList,
        authorSuspendedReason: doc.author_suspended_reason,
      });
      return jsonIns;
    });
}

exports.queryReadableArticleAsync = queryReadableArticleAsync;

function _isValidArticleBundleSync(bundle) {
  // TODO
  return true;
}

function _isValidNewArticle(writerId, bundle, trx) {
  return ArticleTable.count({
    where: {
      writer_id: writerId,
      state: {
        $in: ArticleUtil.instance.notApprovedStateList(),
      },
    },
    transaction: trx,
  })
    .then(function(count) {
      if (constants.ARTICLE.CREATION_LIMIT.N_NOT_APPROVED <= count) {
        throw new signals.GeneralFailure(constants.RET_CODE.NEW_ARTICLE_LIMIT_EXCEEDED);
      }
      return new Promise(function(resolve, reject) {
        resolve(_isValidArticleBundleSync(bundle));
      });
    });
}

function _isValidOverwritingArticleAsync(articleId, writerId, bundle, trx) {
  return queryEditableArticleAsync(articleId, writerId, trx)
    .then(function(article) {
      return new Promise(function(resolve, reject) {
        if (null == article) {
          resolve(false);
          return;
        }
        resolve(_isValidArticleBundleSync(bundle));
      });
    });
}

const saveNewArticleAsync = function(writerId, bundle, trx) {
  let articleId = null;
  let articleObject = null;

  return _isValidNewArticle(writerId, bundle, trx)
    .then(function(trueOrFalse) {
      if (false == trueOrFalse) {
        logger.warn("Error occurred when checking `_isValidNewArticle` within `saveNewArticleAsync` for writerId == ", writerId, ", bundle == ", bundle);
        throw new signals.GeneralFailure();
      }
      const currentMillis = Time.currentMillis();
      articleObject = {
        title: bundle.title,
        category: bundle.category,
        content: bundle.content,
        writer_id: writerId,
        state: constants.ARTICLE.STATE.CREATED,
        created_at: currentMillis,
        updated_at: currentMillis,
      };

      if (null !== bundle.keywordList) {
        Object.assign(articleObject, {
          // TODO: Use a more efficient codec, e.g. protobuf.
          keyword_list: JSON.stringify(bundle.keywordList),
        });
      }

      return ArticleTable.create(articleObject, {
        transaction: trx
      });
    })
    .then(function(newArticle) {
      if (null == newArticle) {
        throw new signals.GeneralFailure();
      }

      articleId = newArticle.id;
      return sharedDao.solidifyManyAttachments(constants.ATTACHMENT.META_TYPE.ARTICLE, articleId, constants.ATTACHMENT.OWNER_META_TYPE.WRITER, writerId, bundle.ossFilepathList, trx);
    })
    .then(function(affectedRowsCount) {
      if (bundle.ossFilepathList.length != affectedRowsCount) {
        logger.warn("[saveNewArticleAsync] Error occurred when expecting `bundle.ossFilepathList.length == affectedRowsCount`, bundle.ossFilepathList.length == ", bundle.ossFilepathList.length, ", affectedRowsCount == ", affectedRowsCount);
        throw new signals.GeneralFailure();
      }

      return articleId;
    });
};

exports.saveNewArticleAsync = saveNewArticleAsync;

const overwriteArticleAsync = function(articleId, writerId, bundle, trx) {
  const currentMillis = Time.currentMillis();
  let toInsertAttachmentOssFilepathList = null;
  let toDeleteAttachmentOssFilepathList = null;

  return _isValidOverwritingArticleAsync(articleId, writerId, bundle, trx)
    .then(function(trueOrFalse) {
      if (false == trueOrFalse) {
        throw new signals.GeneralFailure();
      }
      return sharedDao.queryAttachmentListForArticleAsync({
        id: articleId,
        writer_id: writerId,
      },
        ArticleUtil.instance.clientAccessibleMimeTypes(),
        trx);
    })
    .then(function(existingAttachmentList) {
      if (null == existingAttachmentList || 0 == existingAttachmentList.length) {
        toInsertAttachmentOssFilepathList = bundle.ossFilepathList;
        toDeleteAttachmentOssFilepathList = [];
      } else {
        const existingAttachmentOssFilepathList = [];
        existingAttachmentList.map(function(attachment) {
          existingAttachmentOssFilepathList.push(attachment.oss_filepath);
        });
        toInsertAttachmentOssFilepathList = sharedDao.getExclusiveAttachmentOssFilepathListInFirstOperand(bundle.ossFilepathList, existingAttachmentOssFilepathList);
        toDeleteAttachmentOssFilepathList = sharedDao.getExclusiveAttachmentOssFilepathListInFirstOperand(existingAttachmentOssFilepathList, bundle.ossFilepathList);
      }

      let replacementSetObject = {
        title: bundle.title,
        category: bundle.category,
        content: bundle.content,
        updated_at: currentMillis,
      };

      if (null != bundle.keywordList) {
        Object.assign(replacementSetObject, {
          // TODO: Use a more efficient codec, e.g. protobuf.
          keywordList: JSON.stringify(bundle.keywordList),
        });
      }

      return ArticleTable.update(replacementSetObject, {
        where: {
          id: articleId,
          writer_id: writerId,
          deleted_at: null,
        },
        transaction: trx,
      });
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      if (1 != affectedRowsCount) {
        logger.warn("[overwriteArticleAsync] Error occurred when expecting `1 == affectedRowsCount`, affectedRowsCount == ", affectedRowsCount);
        throw new signals.GeneralFailure();
      }

      return sharedDao.solidifyManyAttachments(constants.ATTACHMENT.META_TYPE.ARTICLE, articleId, constants.ATTACHMENT.OWNER_META_TYPE.WRITER, writerId, toInsertAttachmentOssFilepathList, trx);
    })
    .then(function(affectedRowsCount) {
      if (toInsertAttachmentOssFilepathList.length != affectedRowsCount) {
        logger.warn("[overwriteArticleAsync] Error occurred when expecting `toInsertAttachmentOssFilepathList.length == affectedRowsCount`, toInsertAttachmentOssFilepathList.length == ", toInsertAttachmentOssFilepathList.length, ", affectedRowsCount == ", affectedRowsCount);
        throw new signals.GeneralFailure();
      }

      return sharedDao.softlyDeleteManyAttachments(constants.ATTACHMENT.META_TYPE.ARTICLE, articleId, constants.ATTACHMENT.OWNER_META_TYPE.WRITER, writerId, toDeleteAttachmentOssFilepathList, trx);
    })
    .then(function(affectedRowsCount) {
      if (toDeleteAttachmentOssFilepathList.length != affectedRowsCount) {
        logger.warn("[overwriteArticleAsync] Error occurred when expecting `toDeleteAttachmentOssFilepathList.length == affectedRowsCount`, toDeleteAttachmentOssFilepathList.length == ", toDeleteAttachmentOssFilepathList.length, ", affectedRowsCount == ", affectedRowsCount);
        throw new signals.GeneralFailure();
      }
      return articleId;
    });
};

exports.overwriteArticleAsync = overwriteArticleAsync;

const submitArticleAsync = function(articleId, writerId, trx) {
  const replacementSetObject = {
    state: constants.ARTICLE.STATE.APPROVED,
  };

  return ArticleTable.update(replacementSetObject, {
    where: {
      id: articleId,
      writer_id: writerId,
      state: ArticleUtil.instance.editableStateList(),
      deleted_at: null,
    },
    transaction: trx,
  })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      return affectedRowsCount;
    });
};

exports.submitArticleAsync = submitArticleAsync;

const suspendArticleAsync = function(articleId, writerId, reason, trx) {
  const replacementSetObject = {
    state: constants.ARTICLE.STATE.AUTHOR_SUSPENDED,
    author_suspended_reason: reason,
  };

  return ArticleTable.update(replacementSetObject, {
    where: {
      id: articleId,
      writer_id: writerId,
      state: constants.ARTICLE.STATE.APPROVED,
      deleted_at: null,
    },
    transaction: trx,
  })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      return affectedRowsCount;
    });
};

exports.suspendArticleAsync = suspendArticleAsync;
