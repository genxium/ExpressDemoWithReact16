const baseAbsPath = __dirname + '/';
const webModuleAbsPath = baseAbsPath + '../node_modules';

const commonConfig = require(baseAbsPath + './webpack_common_config').default;
const webpack = require(webModuleAbsPath + '/webpack');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const toExport = {
  mode: 'production',
	devtool: 'cheap-module-source-map',
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify('production')
			}
		}),
    new BundleAnalyzerPlugin({
      generateStatsFile: true, 
      statsFilename: 'webpack_bundle.production.stats', // Will be located in the "<proj-root>/frontend/bin/" dir.
    })
	],
  optimization: {
    splitChunks: {
      chunks: 'async'
    },
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: false, // Must be set to true if using source-maps in production
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        }
      }),
    ],
  }
};

Object.assign(toExport, commonConfig);

module.exports = toExport;
