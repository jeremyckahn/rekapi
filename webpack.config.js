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
    shifty: 'shifty',
    lodash: 'lodash',
  },
  plugins: [
    new Webpack.BannerPlugin(version)
  ]
});
