const commonConfig = require('./webpack.common');
const path = require('path');
const Webpack = require('webpack');

const { version } = require('./package.json');

module.exports = Object.assign(commonConfig, {
  entry: './src/main.js',
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/assets/',
    filename: 'rekapi.js',
    library: 'rekapi',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: {
    shifty: 'shifty'
  },
  plugins: [
    new Webpack.optimize.UglifyJsPlugin({
      compress: {
        dead_code: true,
        unused: true
      },
      output: {
        comments: false
      },
      sourceMap: true
    }),
    new Webpack.BannerPlugin(version)
  ]
});
