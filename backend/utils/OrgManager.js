'use strict';

const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const Time = require('../../common/Time').default;

const Logger = require('./Logger');
const logger = Logger.instance.getLogger(__filename);

const OrgTable = require('../models/Org');
const SuborgTable = require('../models/Suborg');
const WriterSuborgBindingTable = require('../models/WriterSuborgBinding');

class OrgManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new OrgManager(singletonEnforcer);
    }
    return this[singleton];
  }

  upsertOrgAsync(specifiedOrgId, newHandle, newDisplayName, trx) {
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
  }
  
  findOrCreateSuborgByTypeAsync(specifiedOrgId, specifiedType, newDisplayName, trx) {
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
      deleted_at: null;
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
    });
  }

  updateSuborgAsync(specifiedOrgId, specifiedSuborgId, newHandle, newDisplayName, trx) {
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
  }

  deleteSuborgSoftlyAndUnbindAllAssociatedWritersAsync(specifiedOrgId, specifiedSuborgId, trx) {
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
      return SuborgTable.destroy({
        where: deletePhysicallyWhereObject,
        transaction: trx,
      }); 
    })
    .then(function(affectedRows) {
      const affectedRowsCount = affectedRows[0];
      return affectedRowsCount;
    });
  }

  bindWritersToSuborgWithoutPreunbindingAsync(orgId, suborgId, writerIdList, trx) {
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
  }

  unbindWritersFromSuborgAsync(orgId, suborgId, writerIdList, trx) {
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
  }
}

exports.default = OrgManager;
