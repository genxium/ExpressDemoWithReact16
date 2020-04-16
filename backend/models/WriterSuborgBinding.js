const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const Logger = require('../utils/Logger');
const MySQLManager = require('../utils/MySQLManager');

const WriterSuborgBinding = MySQLManager.instance.dbRef.define('writer_suborg_binding', {
  writer_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  suborg_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  org_id: {
    type: Sequelize.INTEGER
  },
  created_at: {
    type: Sequelize.INTEGER
  },
  updated_at: {
    type: Sequelize.INTEGER
  },
  deleted_at: {
    type: Sequelize.INTEGER
  }

}, {
  tableName: 'writer_suborg_binding',
  timestamps: false
});

module.exports = WriterSuborgBinding;
