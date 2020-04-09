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

const path = require('path');

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
  if (null == toDeleteAttachmentOssFilepathList || 0 == toDeleteAttachmentOssFilepathList.length) {
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

      oss_filepath: toDeleteAttachmentOssFilepathList,

      deleted_at: null,
    },
    transaction: trx
  });
};

exports.solidifyManyAttachments = function(forMetaType, forMetaId, forOwnerMetaType, forOwnerMetaId, toBindOssFilepathList, trx) {
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
        state: constants.ATTACHMENT.STATE.SOLIDIFIED,
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
          state: constants.ATTACHMENT.STATE.CREATED_UNSOLIDIFIED,
          oss_filepath: ossFilepath,
          owner_meta_id: forOwnerMetaId,
          owner_meta_type: forOwnerMetaType,

          deleted_at: null,
        },
        transaction: trx,
      });
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      // logger.info("Successfully ran one round of `solidifyManyAttachments` for ossFilepath == ", ossFilepath, ", affectedRowsCount == ", affectedRowsCount);
      return (total + affectedRowsCount);
    }, function(err) {
      logger.error("Error occurred when invoking `solidifyManyAttachments`", err);
      return total;
    });
  }, 0)
  .then(function(total) {
    return total;
  });
};

const queryImageListForArticleAsync = function(article, trx) {
  const whereCondition = {
    state: [
      constants.ATTACHMENT.STATE.SOLIDIFIED,
      constants.ATTACHMENT.STATE.SOLIDIFIED_TRANSCODING_COPIES,
      constants.ATTACHMENT.STATE.TRANSCODED_COPIES_ALL_COMPLETED,
      constants.ATTACHMENT.STATE.TRANSCODED_COPIES_PARTIALLY_COMPLETED,
      constants.ATTACHMENT.STATE.TRANSCODED_COPIES_ALL_FAILED,


      constants.ATTACHMENT.STATE.TRANSCODED_COPY_SUCCESSFUL,
    ],

    meta_type: constants.ATTACHMENT.META_TYPE.ARTICLE,
    meta_id: article.id,

    owner_meta_type: constants.ATTACHMENT.OWNER_META_TYPE.WRITER,
    owner_meta_id: article.writer_id,
    
    mime_type: {
      [SequelizeOp.like]: "%" + constants.ATTACHMENT.IMAGE.LITERAL + "%"
    }, 

    deleted_at: null,
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
      /*
      * Aggregate "imageList" to "imageSrcsetDict" keyed by the "prefix of ossFilepath".
      */ 
      let imageSrcsetDict = {};
      for (let i in imageList) {
        const ossFilepath = imageList[i].oss_filepath;
        const ossFilepathPrefix = path.dirname(ossFilepath);
        if (null == imageSrcsetDict[ossFilepathPrefix]) {
          imageSrcsetDict[ossFilepathPrefix] = [];
        }
        imageSrcsetDict[ossFilepathPrefix].push(imageList[i]);
      }

      Object.assign(article, {
        imageList: []
      });

      for (let prefix in imageSrcsetDict) {
        const imageSrcset = imageSrcsetDict[prefix]; 
        const clientImageData = {
          srcset: []
        };
        for (let i in imageSrcset) {
          Object.assign(imageSrcset[i], {
            downloadEndpoint: QiniuServerUtil.instance.config.imageDownloadEndpoint,
            ossFilepath: imageSrcset[i].oss_filepath,
          }); 
          clientImageData.srcset.push(imageSrcset[i]);

          if (null == clientImageData.downloadEndpoint || null == clientImageData.ossFilepath) {
            Object.assign(clientImageData, imageSrcset[i]); 
          }  
        } 
        article.imageList.push(clientImageData);
      }
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
