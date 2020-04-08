const baseAbsPath = __dirname + '/';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const constants = require('../common/constants');
const signals = require('../common/signals');
const NetworkFunc = require('../common/NetworkFunc').default;

const MySQLManager = require('./utils/MySQLManager');

const Logger = require('./utils/Logger');
const logger = Logger.instance.getLogger(__filename);

// To allow API access from CDN distributed webpages.
const corsOptions = {
  origin: function(origin, callback) {
    // Temporarily allowing all CORS access.
    callback(null, true)
  }
};
app.use(cors(corsOptions));

// Mount static resource entry, reference http://expressjs.com/en/api.html
app.use(constants.ROUTE_PATHS.BASE + '/bin', express.static(baseAbsPath + '../frontend/bin'));
app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ICON, express.static(baseAbsPath + 'static/icon'));
app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.CLIPART, express.static(baseAbsPath + 'static/clipart'));

// Body parser middleware.
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.raw({
  type: '*/*'
}));

// Pug template. Reference http://expressjs.com/en/guide/using-template-engines.html
app.set('view engine', 'pug');
app.set('views', baseAbsPath + './pugs');

const NamedGatewayManager = require('./utils/NamedGatewayManager').default;
const portToListen = NamedGatewayManager.instance.config.authServer.portToListen;

MySQLManager.instance.testConnectionAsync()
  .then(function() {
    logger.info("MySQL server connected.");
    /*------------------------*/

    /**
     * NOTE: The order of the following statements MATTERS!
     **/
    const CentralAuthRouterCollection = require('./routers/central_auth').default;
    const centralAuthRouterCollection = new CentralAuthRouterCollection();

    app.post(constants.ROUTE_PATHS.BASE + constants.ROUTE_PARAMS.API_VER + constants.ROUTE_PATHS.CREDENTIALS + constants.ROUTE_PATHS.LOGIN,
      centralAuthRouterCollection.credentialsAuth,
      centralAuthRouterCollection.commonLoggedInFinalHandler.bind(centralAuthRouterCollection));

    app.post(constants.ROUTE_PATHS.BASE + constants.ROUTE_PARAMS.API_VER + constants.ROUTE_PATHS.INT_AUTH_TOKEN + constants.ROUTE_PATHS.LOGIN,
      centralAuthRouterCollection.tokenAuth,
      centralAuthRouterCollection.commonLoggedInFinalHandler.bind(centralAuthRouterCollection));

    // Provide an API for "POST /profile/read {token: ....}", usually used by rpc.

    app.post(constants.ROUTE_PATHS.BASE + constants.ROUTE_PARAMS.API_VER + constants.ROUTE_PATHS.LOGOUT,
      centralAuthRouterCollection.commonLogoutFinalHandler.bind(centralAuthRouterCollection));

    app.use(constants.ROUTE_PATHS.BASE,
      centralAuthRouterCollection.pageRouter);

    /*------------------------*/

    http.listen(portToListen, function() {
      logger.info('auth_server listening at ' + portToListen);
    });
  })
  .catch(function(err) {
    logger.error(err.stack);
  });

process.on('uncaughtException', function(err) {
  logger.error(err.stack);
})
