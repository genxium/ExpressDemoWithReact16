const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const Logger = require('../utils/Logger');
const MySQLManager = require('../utils/MySQLManager');

const Player = MySQLManager.instance.dbRef.define('player', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  tableName: 'player',
  timestamps: false
});

module.exports = Player;
