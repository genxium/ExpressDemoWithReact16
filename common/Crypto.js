'use strict';

const md5 = require('crypto-js/md5');
const sha1 = require('crypto-js/sha1');
const hmacSha1 = require('crypto-js/hmac-sha1');

class Crypto {
  static md5Sign(seed) {
    return md5(seed.toString()).toString();
  }

  static sha1Sign(seed) {
    return sha1(seed.toString()).toString();
  }

  static hmacSha1Sign(seed, key) {
    return hmacSha1(seed.toString(), key.toString()).toString();  
  }
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = Crypto;
