const baseAbsPath = __dirname + '/';
const express = require('express');

const constants = require('../../common/constants');
const signals = require('../../common/signals');
const NetworkFunc = require('../../common/NetworkFunc').default;
const LocaleManager = require('../../common/LocaleManager').default;

const NamedGatewayManager = require('../utils/NamedGatewayManager').default;
const MySQLManager = require('../utils/MySQLManager');
const ArticleUtil = require('../../common/ArticleUtil').default;

const RoleLoginCacheCollection = require('../RoleLoginCacheCollection').default;

const sharedDao = require('../dao/shared');
const playerDao = require('../dao/player');

const AbstractAuthRouterCollection = require('./AbstractAuthRouterCollection').default;
const WeChatSingleton = require('../utils/WeChatSingleton').default;

const createPageRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });
  router.get(constants.ROUTE_PATHS.ROOT, (instance.landingPageSpa.bind(instance)));
  router.get(constants.ROUTE_PATHS.HOME, (instance.landingPageSpa.bind(instance)));

  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PARAMS.ARTICLE_ID + constants.ROUTE_PATHS.DETAIL, (instance.articleSpa.bind(instance)));
  return router;
};

const articleDetailApi = function(req, res) {
  const instance = this;

  let articleId = (null == req.query.articleId ? null : parseInt(req.query.articleId));
  let article = null;

  MySQLManager.instance.dbRef.transaction(t => {
    return playerDao.queryReadableArticleAsync(articleId, t)
      .then(function(doc) {
        article = doc;
        return sharedDao.appendAttachmentListForArticleAsync(article, ArticleUtil.instance.clientAccessibleMimeTypes(), t);
      })
      .then(function(doc) {
        return sharedDao.appendAuthorForArticleAsync(article, t);
      });
  })
    .then(function(doc) {
      res.json({
        ret: constants.RET_CODE.OK,
        article: article,
      });
    })
    .catch(function(err) {
      instance.respondWithError(res, err);
    });
};

const createUnprotectedApiRouter = function() {
  const instance = this;
  const router = express.Router({
    mergeParams: true
  });
  router.get(constants.ROUTE_PATHS.ARTICLE + constants.ROUTE_PARAMS.ARTICLE_ID + constants.ROUTE_PATHS.DETAIL, articleDetailApi.bind(instance));

  return router;
};

class PlayerRouterCollection extends AbstractAuthRouterCollection {
  constructor(props) {
    super(props);
    const instance = this;
    this.tokenCache = RoleLoginCacheCollection.instance.getOrCreateCacheSync(constants.ROLE_NAME.PLAYER);

    this.pageRouter = (createPageRouter.bind(instance))();
    this.authProtectedApiRouter = null;
    this.unprotectedApiRouter = (createUnprotectedApiRouter.bind(instance))();
  }

  landingPageSpa(req, res) {
    // TODO: Employ full server rendering.
    const jsBundle = '/bin/player_landing.bundle.js';
    const wechatPubsrvWebLoginInfoEncoded = JSON.stringify(WeChatSingleton.instance.queryWebLoginInfoDictSync());
    const namedGatewayInfoEncoded = JSON.stringify(NamedGatewayManager.instance.config);
    res.render('player_landing', {
      title: LocaleManager.instance.effectivePack().PLAYER_CONSOLE,
      metaKeywords: LocaleManager.instance.effectivePack().APP_NAME,
      metaDescription: LocaleManager.instance.effectivePack().ABSTACT,
      jsBundleUri: constants.ROUTE_PATHS.BASE + jsBundle,
      wechatPubsrvWebLoginInfo: wechatPubsrvWebLoginInfoEncoded,
      namedGatewayInfo: namedGatewayInfoEncoded,
    });
  }

  articleSpa(req, res) {
    // TODO: Employ full server rendering.
    const instance = this;
    let articleId = (null == req.query.articleId ? null : parseInt(req.query.articleId));

    MySQLManager.instance.dbRef.transaction(t => {
      return playerDao.queryReadableArticleAsync(articleId, t);
    })
      .then(function(article) {
        if (!article)
          throw new signals.GeneralFailure();
        let customMetaKeywords = "";
        if (null != article.keywordList && 0 < article.keywordList.length) {
          for (let i = 0; i < article.keywordList.length; ++i) {
            customMetaKeywords += article.keywordList[i];
            customMetaKeywords += " ";
          }
        }
        const customTitle = article.title;
        const customMetaDescription = article.content;

        instance.spaRender(req, res, customMetaKeywords, customMetaDescription, customTitle);
      })
      .catch(function(err) {
        instance.respondWithError(res, err);
      });
  }

  spaRender(req, res, customMetaKeywords, customMetaDescription, customTitle) {
    const jsBundle = '/bin/player_console.bundle.js';
    const wechatPubsrvWebLoginInfoEncoded = JSON.stringify(WeChatSingleton.instance.queryWebLoginInfoDictSync());
    const namedGatewayInfoEncoded = JSON.stringify(NamedGatewayManager.instance.config.articleServer);
    res.render('console', {
      title: (undefined === customTitle ? LocaleManager.instance.effectivePack().PLAYER_CONSOLE : customTitle),
      metaKeywords: ('string' == typeof customMetaKeywords ? customMetaKeywords : LocaleManager.instance.effectivePack().APP_NAME),
      metaDescription: ('string' == typeof customMetaDescription ? customMetaDescription : LocaleManager.instance.effectivePack().ABSTACT),
      jsBundleUri: constants.ROUTE_PATHS.BASE + jsBundle,
      wechatPubsrvWebLoginInfo: wechatPubsrvWebLoginInfoEncoded,
      namedGatewayInfo: namedGatewayInfoEncoded,
    });
  }
}

exports.default = PlayerRouterCollection;
