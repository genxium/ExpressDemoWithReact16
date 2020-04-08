const constants = require('../../common/constants')
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Time = require('../../common/Time').default;

const WriterTable = require('../models/Writer');
const AttachmentTable = require('../models/Attachment');

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const QiniuServerUtil = require('../utils/QiniuServerUtil').default;
const SequelizeOp = require('sequelize').Op;
const Promise = require("bluebird");

exports.getExclusiveAttachmentOssFilepathListInFirstOperand = function(firstOperandList, secondOperandList) {
  let secondSet = new Set();
  secondOperandList.map(function(ossFilepath) {
    secondSet.add(ossFilepath);
  });
  let resultList = [];
  firstOperandList.map(function(ossFilepath) {
    if (secondSet.has(ossFilepath)) return;
    resultList.push(ossFilepath);
  });
  return resultList;
};

exports.softlyDeleteManyAttachments = function(forMetaType, forMetaId, forOwnerMetaType, forOwnerMetaId, toDeleteAttachmentOssFilepathList, trx) {
  if (false == toDeleteAttachmentOssFilepathList || 0 == toDeleteAttachmentOssFilepathList.length) {
    return new Promise((resolve, reject) => {
      return resolve(0);

    })
  }

  const currentMillis = Time.currentMillis();
  return AttachmentTable.update({
    deleted_at: currentMillis
  }, {
    where: {
      meta_id: forMetaId,
      meta_type: forMetaType,

      owner_meta_id: forOwnerMetaId,
      owner_meta_type: forOwnerMetaType,

      deleted_at: null,

      oss_filepath: toDeleteAttachmentOssFilepathList,
    },
    transaction: trx
  });
};

exports.solidifyManyAttachments = function(forMetaType, forMetaId, forOwnerMetaType, forOwnerMetaId, toBindOssFilepathList, trx) {
  if (false == toBindOssFilepathList || 0 == toBindOssFilepathList.length) {
    return new Promise((resolve, reject) => {
      return resolve(0);
    })
  }
  const currentMillis = Time.currentMillis();
  return AttachmentTable.update({
    state: constants.ATTACHMENT.STATE.SOLIDIFED_PENDING_TRANSCODING,
    updated_at: currentMillis,

    meta_id: forMetaId,
    meta_type: forMetaType,
  }, {
    where: {
      deleted_at: null,
      state: constants.ATTACHMENT.STATE.CREATED,
      oss_filepath: toBindOssFilepathList,
      owner_meta_id: forOwnerMetaId,
      owner_meta_type: forOwnerMetaType,
    },
    transaction: trx,
  });
};

exports.stepToTranscodedManyAttachments = function(forMetaType, forMetaId, forOwnerMetaType, forOwnerMetaId, toBindOssFilepathList, trx) {
  if (null == toBindOssFilepathList || 0 == toBindOssFilepathList.length) {
    return new Promise((resolve, reject) => {
      return resolve(0);
    })
  }

  const currentMillis = Time.currentMillis();
  const bucket = QiniuServerUtil.instance.config.bucket;

  return Promise.reduce(toBindOssFilepathList, function(total, ossFilepath) {
    return QiniuServerUtil.instance.statAsync(bucket, ossFilepath)
    .then(function(stat) {
      // logger.info("Returned stat for bucket == ", bucket, ", ossFilepath == ", ossFilepath, " is\n", stat);
      const replacementSetObject = {
        state: constants.ATTACHMENT.STATE.SOLIDIFED_TRANSCODED,
        updated_at: currentMillis,

        meta_id: forMetaId,
        meta_type: forMetaType,
      };
      if (null != stat && null != stat.mimeType) {
        Object.assign(replacementSetObject, {
          mime_type: stat.mimeType,
        });
      }
      return AttachmentTable.update(replacementSetObject, {
        where: {
          deleted_at: null,
          state: [
            constants.ATTACHMENT.STATE.CREATED,
            constants.ATTACHMENT.STATE.SOLIDIFED_PENDING_TRANSCODING,
            constants.ATTACHMENT.STATE.SOLIDIFED_TRANSCODING_FAILED
          ],
          oss_filepath: ossFilepath,
          owner_meta_id: forOwnerMetaId,
          owner_meta_type: forOwnerMetaType,
        },
        transaction: trx,
      });
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      // logger.info("Successfully ran one round of `stepToTranscodedManyAttachments` for ossFilepath == ", ossFilepath, ", affectedRowsCount == ", affectedRowsCount);
      return (total + affectedRowsCount);
    }, function(err) {
      logger.error("Error occurred when invoking `stepToTranscodedManyAttachments`", err);
      return total;
    });
  }, 0)
  .then(function(total) {
    return total;
  });
};

exports.unsolidifyManyAttachments = function(forMetaType, forMetaId, forOwnerMetaType, forOwnerMetaId, toUnbindOssFilepathList, trx) {
  if (false == toUnbindOssFilepathList || 0 == toUnbindOssFilepathList.length) {
    return new Promise((resolve, reject) => {
      return resolve(0);
    })
  }
  const currentMillis = Time.currentMillis();
  return AttachmentTable.update({
    state: constants.ATTACHMENT.STATE.CREATED,
    updated_at: currentMillis,
  }, {
    where: {
      deleted_at: null,
      state: [
        constants.ATTACHMENT.STATE.SOLIDIFED_PENDING_TRANSCODING,
        constants.ATTACHMENT.STATE.SOLIDIFED_TRANSCODED,
        constants.ATTACHMENT.STATE.SOLIDIFED_TRANSCODING_FAILED,
      ],
      oss_filepath: toUnbindOssFilepathList,
      owner_meta_id: forOwnerMetaId,
      owner_meta_type: forOwnerMetaType,
      meta_id: forMetaId,
      meta_type: forMetaType,
    },
    transaction: trx,
  })
  .then(function(affectedRows) {
    const affectedRowsCount = affectedRows[0];
    return affectedRowsCount;
  });
};

const queryImageListForArticleAsync = function(article, trx) {
  const whereCondition = {
    state: constants.ATTACHMENT.STATE.SOLIDIFED_TRANSCODED,

    meta_type: constants.ATTACHMENT.META_TYPE.ARTICLE,
    meta_id: article.id,

    owner_meta_type: constants.ATTACHMENT.OWNER_META_TYPE.WRITER,
    owner_meta_id: article.writer_id,

  /*
  // Temporarily omitted for filtering. -- YFLu, 2020-04-05
  mime_type: {
    [SequelizeOp.like]: "%" + constants.ATTACHMENT.IMAGE.LITERAL + "%"
  }, 
  */
  };
  return AttachmentTable.findAndCountAll({
    where: whereCondition,
    transaction: trx,
  })
    .then(function(result) {
      const imageList = result.rows;
      let toRet = [];
      for (let i in imageList) {
        toRet.push(imageList[i].dataValues);
      }
      return toRet;
    });
};

exports.queryImageListForArticleAsync = queryImageListForArticleAsync;

const appendImageListForArticleAsync = function(article, trx) {
  return queryImageListForArticleAsync(article, trx)
    .then(function(imageList) {
      for (let i in imageList) {
        Object.assign(imageList[i], {
          downloadEndpoint: QiniuServerUtil.instance.config.imageDownloadEndpoint,
          ossFilepath: imageList[i].oss_filepath,
        });
      }
      Object.assign(article, {
        imageList: imageList,
      });
      return article;
    });
};

exports.appendImageListForArticleAsync = appendImageListForArticleAsync;

const queryAuthorForArticleAsync = function(article, trx) {
  if (null == article) {
    return new Promise(function(resolve, reject) {
      resolve(null);
    });
  }

  return WriterTable.findOne({
    where: {
      id: article.writer_id,
      deleted_at: null
    },
    transaction: trx,
  });
};

exports.queryAuthorForArticleAsync = queryAuthorForArticleAsync;

const appendAuthorForArticleAsync = function(article, trx) {
  return queryAuthorForArticleAsync(article, trx)
    .then(function(doc) {
      if (null == doc) {
        return null;
      }
      const authorJsonIns = doc.toJSON();
      Object.assign(article, {
        author: {
          id: doc.id,
          handle: doc.handle,
          displayName: doc.display_name,
        },
      });
      return article;
    });
};

exports.appendAuthorForArticleAsync = appendAuthorForArticleAsync;
