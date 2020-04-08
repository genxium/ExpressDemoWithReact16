const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const Logger = require('../utils/Logger');
const MySQLManager = require('../utils/MySQLManager');

const Attachment = MySQLManager.instance.dbRef.define('attachment', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  state: {
    type: Sequelize.INTEGER
  },
  transcoding_failure_count: {
    type: Sequelize.INTEGER
  },
  max_transcoding_failure_count: {
    type: Sequelize.INTEGER
  },
  oss_bucket: {
    type: Sequelize.STRING
  },
  oss_filepath: {
    type: Sequelize.STRING
  },
  meta_type: {
    type: Sequelize.INTEGER
  },
  meta_id: {
    type: Sequelize.INTEGER
  },
  owner_meta_type: {
    type: Sequelize.INTEGER
  },
  owner_meta_id: {
    type: Sequelize.INTEGER
  },
  mime_type: {
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
  },
}, {
  tableName: 'attachment',
  timestamps: false
});

module.exports = Attachment;
