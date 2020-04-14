const constants = require('./constants');
const LocaleManager = require('./LocaleManager').default;

const singleton = Symbol();
const singletonEnforcer = Symbol();

class ArticleUtil {

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new ArticleUtil(singletonEnforcer);
    }
    return this[singleton];
  }

  notApprovedStateList() {
    return [
      constants.ARTICLE.STATE.CREATED,
      constants.ARTICLE.STATE.PENDING,
      constants.ARTICLE.STATE.DENIED,
      constants.ARTICLE.STATE.ADMIN_SUSPENDED,
      constants.ARTICLE.STATE.AUTHOR_SUSPENDED,
    ];
  }

  editableStateList() {
    return [
      constants.ARTICLE.STATE.CREATED,
      constants.ARTICLE.STATE.DENIED,
      constants.ARTICLE.STATE.ADMIN_SUSPENDED,
      constants.ARTICLE.STATE.AUTHOR_SUSPENDED,
    ];
  }

  stateChoiceList() {
    return [
      {
        title: LocaleManager.instance.effectivePack().ALL,
        key: constants.ARTICLE.STATE.NONE,
      },
      {
        title: LocaleManager.instance.effectivePack().APPROVED,
        key: constants.ARTICLE.STATE.APPROVED,
      },
      {
        title: LocaleManager.instance.effectivePack().PENDING,
        key: constants.ARTICLE.STATE.PENDING,
      },
      {
        title: LocaleManager.instance.effectivePack().CREATED,
        key: constants.ARTICLE.STATE.CREATED,
      },
      {
        title: LocaleManager.instance.effectivePack().DENIED,
        key: constants.ARTICLE.STATE.DENIED,
      },
      {
        title: LocaleManager.instance.effectivePack().ADMIN_SUSPENDED,
        key: constants.ARTICLE.STATE.ADMIN_SUSPENDED,
      },
      {
        title: LocaleManager.instance.effectivePack().AUTHOR_SUSPENDED,
        key: constants.ARTICLE.STATE.AUTHOR_SUSPENDED,
      },
    ];
  }

  categoryChoiceList() {
    return [
      {
        title: LocaleManager.instance.effectivePack().ALL,
        key: constants.ARTICLE.CATEGORY.NONE,
      },
      {
        title: LocaleManager.instance.effectivePack().LATEST,
        key: constants.ARTICLE.CATEGORY.LATEST,
      },
      {
        title: LocaleManager.instance.effectivePack().MISC,
        key: constants.ARTICLE.CATEGORY.MISC,
      },
    ];
  }

  isEditable(article) {
    const instance = this;
    return (-1 != instance.editableStateList().indexOf(article.state));
  }

  clientAccessibleMimeTypes() {
    return constants.ATTACHMENT.IMAGE.POLICY.READ_ALLOWED_MIME_TYPES.concat(constants.ATTACHMENT.VIDEO.POLICY.READ_ALLOWED_MIME_TYPES);
  }
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = ArticleUtil;
