const constants = require('./constants');

const singleton = Symbol();
const singletonEnforcer = Symbol();

class AttachmentUtil {

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new AttachmentUtil(singletonEnforcer);
    }
    return this[singleton];
  }

  shuffleAttachments(attachmentList) {
    let imageList = [];
    let videoList = [];
    for (let i = 0; i < attachmentList.length; ++i) {
      const attachment = attachmentList[i];
      if (-1 != constants.ATTACHMENT.IMAGE.POLICY.READ_ALLOWED_MIME_TYPES.indexOf(attachment.mime_type)) {
        imageList.push(attachment);
      }

      if (-1 != constants.ATTACHMENT.VIDEO.POLICY.READ_ALLOWED_MIME_TYPES.indexOf(attachment.mime_type)) {
        videoList.push(attachment);
      }
    }
    return {
      imageList: imageList,
      videoList: videoList,
    };
  }
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = AttachmentUtil;
