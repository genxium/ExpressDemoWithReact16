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
app.use(cors());

// Mount static resource entry, reference http://expressjs.com/en/api.html
app.use(constants.ROUTE_PATHS.BASE + '/bin', express.static(baseAbsPath + '../frontend/bin'));
app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ICON, express.static(baseAbsPath + 'static/icon'));
app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.CLIPART, express.static(baseAbsPath + 'static/clipart'));

// Body parser middleware.
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: '*/*' }));

// Pug template. Reference http://expressjs.com/en/guide/using-template-engines.html
app.set('view engine', 'pug');
app.set('views', baseAbsPath + './pugs');

const NamedGatewayManager = require('./utils/NamedGatewayManager').default;
const portToListen = NamedGatewayManager.instance.config.articleServer.portToListen;

MySQLManager.instance.testConnectionAsync()
  .then(function() {
    logger.info("MySQL server connected.");
    /*------------------------*/

    //---Player router begins.---

    /**
     * NOTE: The order of the following statements MATTERS!
     **/
    const PlayerRouterCollection = require('./routers/player').default;
    const playerRouterCollection = new PlayerRouterCollection();
    app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER + constants.ROUTE_PARAMS.API_VER + constants.ROUTE_PATHS.PUBLIC, 
            playerRouterCollection.unprotectedApiRouter);

    app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.PLAYER, 
            playerRouterCollection.pageRouter);

    //---Player router ends.---

    /*------------------------*/

    //---Writer router begins.---

    /**
     * NOTE: The order of the following statements MATTERS!
     **/
    const WriterRouterCollection = require('./routers/writer').default;
    const writerRouterCollection = new WriterRouterCollection();

    app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.WRITER, 
            writerRouterCollection.pageRouter);

    app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.WRITER + constants.ROUTE_PARAMS.API_VER, 
            writerRouterCollection.tokenAuth, 
            writerRouterCollection.authProtectedApiRouter);

    //---Writer router ends.---

    /*------------------------*/

    //---Admin router begins.---

    /**
     * NOTE: The order of the following statements MATTERS!
     **/
    const AdminRouterCollection = require('./routers/admin').default;
    const adminRouterCollection = new AdminRouterCollection();

    app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ADMIN, 
            adminRouterCollection.pageRouter);

    app.use(constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.ADMIN + constants.ROUTE_PARAMS.API_VER, 
            adminRouterCollection.tokenAuth, 
            adminRouterCollection.authProtectedApiRouter);

    //---Admin router ends.---

    /*------------------------*/

    http.listen(portToListen, function() {
      logger.info('article_server listening at ' + portToListen);
    });
  })
  .catch(function(err) {
    logger.error(err.stack);
  });
