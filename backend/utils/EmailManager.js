const baseAbsPath = __dirname + '/';

const NetworkFunc = require('../../common/NetworkFunc').default;
const constants = require('../../common/constants');
const signals = require('../../common/signals');
const singleton = Symbol();
const singletonEnforcer = Symbol();

const yaml = require('js-yaml');
const fs = require('fs');

let smtpCredentialDict = {
  user: "",
  pass: "",
  endpoint: "",
};

try {
  smtpCredentialDict = yaml.safeLoad(fs.readFileSync(baseAbsPath + '../configs/smtp_credentials.conf', 'utf8'));
} catch (e) {
  NetworkFunc.stacktraceIfDebugging(e);
}

// Reference https://github.com/eleith/emailjs.
const emailUtil = require('emailjs/email');

class EmailManager {
  constructor(enforcer) {
    if (enforcer != singletonEnforcer) throw "Cannot construct singleton";
    const instance = this;
    instance.smtpServer = emailUtil.server.connect({
       user:      smtpCredentialDict.user, 
       password:  smtpCredentialDict.pass, 
       host:      smtpCredentialDict.endpoint, 
       ssl:       true,
    }); 
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new EmailManager(singletonEnforcer);
    }
    return this[singleton];
  }

  sendEmailAsync(text, to, subject) {
    const instance = this;
    return new Promise(function(resolve, reject) {
      instance.smtpServer.send({
        text:    text, 
        from:    smtpCredentialDict.user, 
        to:      to,
        subject: subject,
      }, function(err, message) { 
        if (undefined !== err && null !== err) {
          NetworkFunc.stacktraceIfDebugging(err);
          resolve(false);
        } else {
          NetworkFunc.logIfDebugging(message);
          resolve(true);
        }
      });
    });
  };
}

exports.default = EmailManager;
