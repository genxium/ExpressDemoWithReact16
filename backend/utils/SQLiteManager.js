/*
* NOT BEING USED. -- YFLu, 2020-04-07
*/
const baseAbsPath = __dirname + '/';
const Sqlite3 = require('sqlite3');
const singleton = Symbol();
const singletonEnforcer = Symbol();

const yaml = require('js-yaml');
const fs = require('fs');

const Sequelize = require('sequelize');
const NetworkFunc = require('../../common/NetworkFunc').default;
const Logger = require('./Logger');
const logger = Logger.instance.getLogger(__filename);
const constants = require('../../common/constants');

class SQLiteManager {
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new SQLiteManager(singletonEnforcer);
    }
    return this[singleton];
  }

  constructor(enforcer) {
    if (enforcer != singletonEnforcer) {
      throw "Cannot construct singleton";
    }

    const instance = this;
		let sqlitePath = '';
		if(constants.NOT_IN_PRODUCTION){
			sqlitePath = '../configs/preconfigured.test.sqlite'
		} else {
			sqlitePath = '../configs/preconfigured.sqlite'
		}

    // Refernece https://sequelize.readthedocs.io/en/v3/docs/getting-started/.
    this.dbRef = new Sequelize('preconfigured', 'null', 'null', {
      dialect: 'sqlite',
      storage: baseAbsPath + sqlitePath 
    });

    this.testConnectionAsync = this.testConnectionAsync.bind(this);
  }

  testConnectionAsync() {
    const instance = this;
    return instance.dbRef.authenticate();
  }
}

module.exports = SQLiteManager;
