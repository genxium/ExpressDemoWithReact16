const Logger = require('./utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const constants = require('../common/constants');

const AttachmentTable = require('./models/Attachment');

const QiniuServerUtil = require('./utils/QiniuServerUtil');
const MySQLManager = require('./utils/MySQLManager');

const orientation = constants.DESC;
const orderKey = constants.UPDATED_AT;
const nPerPage = 100;
const page = 1; // It's safe to just keep it always 0 along with the recurring invocation of the following process.

MySQLManager.instance.dbRef.transaction(t => {
  return AttachmentTable.findAndCountAll({
    where: {
      state: constants.ATTACHMENT.STATE.SOLIDIFIED,
      deleted_at: null,
    },
    transaction: t,
    order: [[orderKey, orientation]],
    limit: nPerPage,
    offset: (page - 1) * nPerPage
  })
})
  .then(function(result) {
    for (let i in result.rows) {
      const attachmentOriginalToTranscode = result.rows[i];
      logger.info("An attachmentOriginalToTranscode is ", attachmentOriginalToTranscode.dataValues);
    }
  })
  .catch(function(err) {
    logger.error("An error occurred ", err);
  });
