/*
* Reference https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file.
*/

/*
I deliberately avoid putting configurations of ".../backend/configs/*" into this "pm2 ecosystem file", to reduce dependency on "pm2".

-- YFLu, 2020-03-02
*/
module.exports = {
  apps: [
    {
      name: "auth_server",
      script: "./backend/auth_server.js",
      instances: 1,
      exec_mode: "cluster",
      error_file: './logging/auth_server_err.log',   
      out_file: './logging/auth_server_out.log',   
      log_file: './logging/auth_server_combined.log',
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    },
    {
      name: "article_server",
      script: "./backend/article_server.js",
      instances: 1,
      exec_mode: "cluster",
      error_file: './logging/article_server_err.log',   
      out_file: './logging/article_server_out.log',   
      log_file: './logging/article_server_combined.log',
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    },
  ]
}
