const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const Logger = require('../utils/Logger');
const MySQLManager = require('../utils/MySQLManager');

const Suborg = MySQLManager.instance.dbRef.define('suborg', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  org_id: {
    type: Sequelize.INTEGER
  },
  parent_id: {
    type: Sequelize.INTEGER
  },
  type: {
    type: Sequelize.INTEGER
  },
  display_name: {
    type: Sequelize.STRING
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
  tableName: 'suborg',
  timestamps: false
});

module.exports = Suborg;
