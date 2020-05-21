const constants = require('../../common/constants');
const signals = require('../../common/signals');
const Time = require('../../common/Time').default;

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

const MySQLManager = require('../utils/MySQLManager');

const OrgTable = require('../models/Org');
const SuborgTable = require('../models/Suborg');
const WriterTable = require('../models/Writer');
const WriterSuborgBindingTable = require('../models/WriterSuborgBinding');

const Sequelize = require('sequelize');
const writerDao = require('./writer');

const querySuborgListByTypeAsync = function(specifiedOrgId, specifiedType, page, nPerPage, orderByConditionList, trx) {
  const whereCondition = {
    org_id: specifiedOrgId,
    type: specifiedType,
    deleted_at: null,
  };
  return SuborgTable.findAndCountAll({
    where: whereCondition,
    transaction: trx,
    order: orderByConditionList,
    limit: nPerPage,
    offset: (page - 1) * nPerPage
  });
};
exports.querySuborgListByTypeAsync = querySuborgListByTypeAsync;

const _queryWriterSuborgBindingListAsync = function(specifiedOrgId, specifiedSuborgId, page, nPerPage, orderByConditionList, trx) {
  /*
  * This method SHOULDN'T be used outside of the current file.
  */
  const whereCondition = {
    org_id: specifiedOrgId,
    suborg_id: specifiedSuborgId,
    deleted_at: null,
  };
  return WriterSuborgBindingTable.findAndCountAll({
    where: whereCondition,
    transaction: trx,
    order: orderByConditionList,
    limit: nPerPage,
    offset: (page - 1) * nPerPage
  });
};

const queryWriterListOfSuborgAsync = function(specifiedOrgId, specifiedSuborgId, page, nPerPage, orderByConditionList, trx) {
  /*
  * We use the same (page, nPerPage, orderByConditionList) combination for all paging sub-queries in this method just for temporary convenience. -- YFLu, 2020-04-20
  */
  return _queryWriterSuborgBindingListAsync(specifiedOrgId, specifiedSuborgId, page, nPerPage, orderByConditionList, trx)
  .then(function(result) {
    if (null == result) {
      throw new signals.GeneralFailure(constants.RET_CODE.NONEXISTENT_WRITER_SUBORG_BINDING);
    }

    let theWriterIdList = [];
    for (let i in result.rows) {
      theWriterIdList.push(result.rows[i].writer_id);
    }

    return writerDao.queryWriterListAsync(theWriterIdList, page, nPerPage, orderByConditionList , trx);
  })
};
exports.queryWriterListOfSuborgAsync = queryWriterListOfSuborgAsync;  

const querySuborgListOfWriterAndOrgAsync = function(specifiedOrgId, specifiedWriterId, trx) {
  /*
  * At this very moment we don't expect this query to be paginated. -- YFLu, 2020-05-19
  */
  return MySQLManager.instance.dbRef.query(
  "SELECT a.id as `id`, a.org_id as `org_id`, a.display_name as `display_name`, a.type as `type` FROM suborg as a JOIN writer_suborg_binding as b ON a.deleted_at is NULL AND b.deleted_at is NULL AND a.org_id=b.org_id AND a.org_id=? AND b.writer_id=?"
  , {
    model: SuborgTable,
    mappToModel: true,
    replacements: [specifiedOrgId, specifiedWriterId],
    type: Sequelize.QueryTypes.SELECT,
    transaction: trx,
  })
};
exports.querySuborgListOfWriterAndOrgAsync = querySuborgListOfWriterAndOrgAsync;  

const upsertOrgAsync = function(specifiedOrgId, newHandle, newDisplayName, trx) {
  /*
  * [WARNING]
  *
  * Only a "loggedInRole" with sufficient access level should invoke this method.
  */

  const currentMillis = Time.currentMillis();

  const replacementSetObject = {
    handle: newHandle,
    display_name: newDisplayName,
    updated_at: currentMillis,
  };

  if (null != specifiedOrgId) {
    const whereObject = {
      id: specifiedOrgId,
      deleted_at: null,
    };
    return OrgTable.update(replacementSetObject, {
      transaction: trx,
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0]; 
      if (1 != affectedRowsCount) {   
        logger.warn("upsertOrgAsync err#1, affectedRowsCount == ", affectedRowsCount);
        throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
      }
      return OrgTable.findOne({
        where: whereObject,
        transaction: trx,
      });
    });
  } else {
    Object.assign(replacementSetObject, {
      created_at: currentMillis,
    });
    return OrgTable.create(replacementSetObject, {
      transaction: trx,
    });
  };
};
exports.upsertOrgAsync = upsertOrgAsync;

const findOrCreateSuborgByTypeAsync = function(specifiedOrgId, specifiedType, newDisplayName, trx) {
  /*
  * [WARNING]
  *
  * Only a "loggedInRole" with sufficient access level should invoke this method.
  */

  /*
  * It's NOT allowed to move an existing "specifiedSuborgId" to another "specifiedOrgId".
  *
  * -- YFLu, 2020-04-19
  */
  const currentMillis = Time.currentMillis();
  const whereObject = {
    org_id: specifiedOrgId,
    type: specifiedType,
    deleted_at: null,
  };

  const defaultsObject = {
    org_id: specifiedOrgId,
    type: specifiedType,
    display_name: newDisplayName,
    created_at: currentMillis,
    updated_at: currentMillis,
  };
  
  return SuborgTable.findOrCreate({
    defaults: defaultsObject,
    where: whereObject,
    transaction: trx,
  })
  .spread(function(newSuborg, created) {
    return newSuborg;
  });
};
exports.findOrCreateSuborgByTypeAsync = findOrCreateSuborgByTypeAsync;

const updateSuborgAsync = function(specifiedOrgId, specifiedSuborgId, newHandle, newDisplayName, trx) {
  /*
  * Other than "suborg.id", there's no "suborg.handle" or equivalent fields to uniquely identify a "suborg".    
  */

  /*
  * It's by design that there's no client-side API to update "suborg.type", yet moving or copying multiple "writer"s into another "suborg" is allowed elsewhere. 
  *
  * -- YFLu, 2020-04-19
  */

  const currentMillis = Time.currentMillis();

  return WriterTable.update({
    handle: newHandle,
    display_name: newDisplayName,
    updated_at: currentMillis,
  }, {
    where: {
      org_id: specifiedOrgId,
      suborg_id: specifiedSuborgId,
      deleted_at: null,
    },
    transaction: trx,
  })
  .then(function(affectedRows) {
    const affectedRowsCount = affectedRows[0];
    return affectedRowsCount;
  }); 
};
exports.updateSuborgAsync = updateSuborgAsync;

const deleteSuborgSoftlyAndUnbindAllAssociatedWritersAsync = function(specifiedOrgId, specifiedSuborgId, trx) {
  const currentMillis = Time.currentMillis();

  const deleteSoftlyWhereObject = {
    id: specifiedSuborgId,
    org_id: specifiedOrgId, 
    deleted_at: null,
  };

  return SuborgTable.update({
    deleted_at: currentMillis,
  }, {
    where: deleteSoftlyWhereObject,
    transaction: trx,
  })
  .then(function(affectedRows) {
    const affectedRowsCount = affectedRows[0];
    if (1 != affectedRowsCount) {
      logger.warn("deleteSuborgSoftlyAndUnbindAllAssociatedWritersAsync err#1, affectedRowsCount == ", affectedRowsCount);
      throw new signals.GeneralFailure(constants.RET_CODE.FAILURE);
    }
    
    const deletePhysicallyWhereObject = {
      org_id: specifiedOrgId,
      suborg_id: specifiedSuborgId,
      deleted_at: null,
    };

    /*
     * It's by design to delete physically here to avoid a future "writer_suborg_binding" record with the same "(writer_id, suborg_id)" from insertion failure.
     * 
     * -- YFLu, 2020-04-20
     */
    return WriterSuborgBindingTable.destroy({
      where: deletePhysicallyWhereObject,
      transaction: trx,
    }); 
  })
  .then(function(affectedRows) {
    const affectedRowsCount = affectedRows[0];
    return affectedRowsCount;
  });
};
exports.deleteSuborgSoftlyAndUnbindAllAssociatedWritersAsync = deleteSuborgSoftlyAndUnbindAllAssociatedWritersAsync;

const bindWritersToSuborgWithoutPreunbindingAsync = function(orgId, suborgId, writerIdList, trx) {
  /*
  * [WARNING]
  *
  * Only a "loggedInRole" with sufficient access level should invoke this method.
  */
  
  /*
  * It doesn't matter that a "writerId" is bound to multiple "suborgId"s, yet "(writerId, suborgId)" must be unique.
  *
  * -- YFLu, 2020-04-19
  */
  const currentMillis = Time.currentMillis();

  let newWriterSuborgBindingRecordList = [];
  for (let i in writerIdList) {
    const writerId = writerIdList[i];
    newWriterSuborgBindingRecordList.push({
      writer_id: writerId,
      suborg_id: suborgId,
      org_id: orgId,
      created_at: currentMillis,
      updated_at: currentMillis,
    });
  }

  return WriterSuborgBindingTable.bulkCreate(newWriterSuborgBindingRecordList, {
    transaction: trx,
  });
};
exports.bindWritersToSuborgWithoutPreunbindingAsync = bindWritersToSuborgWithoutPreunbindingAsync;

const unbindWritersFromSuborgAsync = function(orgId, suborgId, writerIdList, trx) {
  /*
  * [WARNING]
  *
  * Only a "loggedInRole" with sufficient access level should invoke this method.
  */

  /*
   * It's by design to delete physically here to avoid a future "writer_suborg_binding" record with the same "(writer_id, suborg_id)" from insertion failure.
   * 
   * -- YFLu, 2020-04-19
   */
  return WriterSuborgBindingTable.destroy({
    where: {
      writer_id: writerIdList,
      suborg_id: suborgId,
      org_id: orgId,
      deleted_at: null,
    },
    transaction: trx,
  })
  .then(function (affectedRows) {
    const affectedRowsCount = affectedRows[0];
    return affectedRowsCount; 
  });   
};
exports.unbindWritersFromSuborgAsync = unbindWritersFromSuborgAsync;
