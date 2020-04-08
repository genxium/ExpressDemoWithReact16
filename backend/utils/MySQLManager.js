const baseAbsPath = __dirname + '/';

const singleton = Symbol();
const singletonEnforcer = Symbol();

const yaml = require('js-yaml');
const fs = require('fs');

const Sequelize = require('sequelize');

const constants = require('../../common/constants');

const Logger = require('./Logger');
const logger = Logger.instance.getLogger(__filename);

class MySQLManager {
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new MySQLManager(singletonEnforcer);
    }
    return this[singleton];
  }

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";

    const instance = this;

    this.dbRef = null;
    this.host = null;
    this.port = null;
    this.dbname = null;

    this.username = null;
    this.password = null;

    this.testConnectionAsync = this.testConnectionAsync.bind(this);

    try {
      const mysqlConfig = (constants.NOT_IN_PRODUCTION ? '../configs/mysql.test.conf' : '../configs/mysql.conf');
      logger.info(mysqlConfig);
      const config = yaml.safeLoad(fs.readFileSync(baseAbsPath + mysqlConfig, 'utf8'));
      this.host = config.host;
      this.port = config.port;
      this.dbname = config.dbname;

      this.username = config.username;
      this.password = config.password;


      this.dbRef = new Sequelize(instance.dbname, instance.username, instance.password, {
        host: instance.host,
        port: instance.port,
        dialect: 'mysql',
        pool: {
          max: 100,
          min: 1,
          idle: 10000
        },
        logging: (...msg) => logger.info(msg[0]), // Reference https://sequelize.org/master/manual/getting-started.html#logging.
      });
    } catch (e) {
      // TODO	
    }
  }

  testConnectionAsync() {
    const instance = this;
    return instance.dbRef.authenticate();
  }
}

module.exports = MySQLManager;
