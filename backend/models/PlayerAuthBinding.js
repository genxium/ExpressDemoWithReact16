const baseAbsPath = __dirname + '/';

const Logger = require('../utils/Logger');

const Sequelize = require('sequelize');

const MySQLManager = require('../utils/MySQLManager');
const NetworkFunc = require('../../common/NetworkFunc').default;

const PlayerAuthBinding = MySQLManager.instance.dbRef.define('player_auth_binding', {
  player_id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  ext_auth_id: {
    type: Sequelize.STRING
  },
  created_at: {
    type: Sequelize.BIGINT(20)
  },
  updated_at: {
    type: Sequelize.BIGINT(20)
  },
  deleted_at: {
    type: Sequelize.BIGINT(20)
  }
}, {
  tableName: 'player_auth_binding',
  timestamps: false
});

module.exports = PlayerAuthBinding;
