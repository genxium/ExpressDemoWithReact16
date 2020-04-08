const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const logger = require('../utils/Logger').instance.getLogger();
const MySQLManager = require('../utils/MySQLManager');

const RoleLoginCache = MySQLManager.instance.dbRef.define('role_login_cache', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  role_id: {
    type: Sequelize.INTEGER,
  },
  role_name: {
    type: Sequelize.STRING
  },
  from_public_ip: {
    type: Sequelize.STRING
  },
  meta_data: {
    type: Sequelize.STRING
  },
  int_auth_token: {
    type: Sequelize.STRING
  },
  expires_at: {
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
  tableName: 'role_login_cache',
  timestamps: false
});

module.exports = RoleLoginCache;
