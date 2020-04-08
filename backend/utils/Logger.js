const baseAbsPath = __dirname + '/';

const singleton = Symbol();
const singletonEnforcer = Symbol();

const constants = require('../../common/constants');
const bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

/*
* It's by design that the "Logger" only pipes into "process.stdout" & "process.stderror", such that "pm2" can further pipe them into different files.    
*
* Rotation of these "pm2 log files" could be handled in one of the following ways, but NOT SEVERAL OF THEM SIMULTANEOUSLY.
* - Linux logrotate
* - pm2 logrotate
*
* DON'T use the "Application-specific Logger" to rotate any log file!
*
* -- YFLu, 2020-03-04
*/
class Logger {
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new Logger(singletonEnforcer);
    }
    return this[singleton];
  }

  constructor(enforcer) {
    if (enforcer != singletonEnforcer) {
      throw "Cannot construct singleton";
    }
    const instance = this;
    instance.DEFAULT = 'default';
    this._defaultLogger = bunyan.createLogger({
      name: instance.DEFAULT,
      streams: [
        {
          level: constants.NOT_IN_PRODUCTION ? 'debug' : 'info',
          stream: prettyStdOut
        }
      ]
    });
    this._loggerDict = {};
    this._loggerDict[this.DEFAULT] = this._defaultLogger;
  }

  getLogger(name) {
    const instance = this;
    if (undefined === name || null === name) {
      return instance._defaultLogger;
    }
    if (name in instance._loggerDict) {
      return instance._loggerDict[name];
    }
    return bunyan.createLogger({
      name: name,
      streams: [
        {
          level: constants.NOT_IN_PRODUCTION ? 'debug' : 'info',
          stream: prettyStdOut
        }
      ]
    });
  }
}

module.exports = Logger;
