const constants = require('../../common/constants')
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Time = require('../../common/Time').default;
const ArticleUtil = require('../../common/ArticleUtil').default;

const ArticleTable = require('../models/Article');
const AttachmentTable = require('../models/Attachment');

const sharedDao = require('./shared');

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

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
