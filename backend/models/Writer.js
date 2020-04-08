const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const Logger = require('../utils/Logger');
const MySQLManager = require('../utils/MySQLManager');

const Writer = MySQLManager.instance.dbRef.define('writer', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  handle: {
    type: Sequelize.STRING
  },
  salt: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
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
  tableName: 'writer',
  timestamps: false
});

module.exports = Writer;
