const baseAbsPath = __dirname + '/';
const webModuleAbsPath = baseAbsPath + '../node_modules';

const commonConfig = require(baseAbsPath + './webpack_common_config').default;
const webpack = require(webModuleAbsPath + '/webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const toExport = {
  mode: 'development',
  devtool: 'eval',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'FSERVER': JSON.stringify('true'),
        'NODE_ENV': JSON.stringify('development')
      }
    }),
    new BundleAnalyzerPlugin({
      generateStatsFile: true, 
      statsFilename: 'webpack_bundle.development.stats', // Will be located in the "<proj-root>/frontend/bin/" dir.
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'async',
      minChunks: 2
    }
  }
};

Object.assign(toExport, commonConfig);

module.exports = toExport;
