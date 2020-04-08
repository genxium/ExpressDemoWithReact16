const constants = require('../../common/constants')

const ArticleTable = require('../models/Article');

const Logger = require('../utils/Logger');
const logger = Logger.instance.getLogger(__filename);

function queryReadableArticleAsync(articleId, trx) {
  return ArticleTable.findOne({
    where: {
      id: articleId,
      state: constants.ARTICLE.STATE.APPROVED,
      deleted_at: null,
    },
    transaction: trx,
  })
    .then(function(doc) {
      // It's necessary to convert "SequelizeModelInstance `article`" to "JSObject `article`" such that the following "Object.assign" works. -- YFLu, 2020-04-07
      const jsonIns = doc.toJSON();
      const keywordList = JSON.parse(doc.keyword_list);
      Object.assign(jsonIns, {
        keywordList: keywordList,
      });
      return jsonIns;
    });
}

exports.queryReadableArticleAsync = queryReadableArticleAsync;
