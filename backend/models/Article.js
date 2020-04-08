const baseAbsPath = __dirname + '/';

const Sequelize = require('sequelize');

const logger = require('../utils/Logger').instance.getLogger();
const MYSQLManager = require('../utils/MySQLManager');

const Article = MYSQLManager.instance.dbRef.define('article', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.INTEGER
  },
  writer_id: {
    type: Sequelize.BIGINT
  },
  state: {
    type: Sequelize.INTEGER
  },
  content: {
    type: Sequelize.TEXT
  },
  keyword_list: {
    type: Sequelize.TEXT
  },
  created_at: {
    type: Sequelize.BIGINT
  },
  updated_at: {
    type: Sequelize.BIGINT
  },
  deleted_at: {
    type: Sequelize.BIGINT
  },
  author_suspended_reason: {
    type: Sequelize.TEXT
  },
}, {
  tableName: 'article',
  timestamps: false
});

module.exports = Article;
