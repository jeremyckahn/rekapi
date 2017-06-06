const commonConfig = require('./webpack.common');
const path = require('path');

module.exports = Object.assign(commonConfig, {
  entry: './test/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/assets/',
    filename: 'index.js',
    library: 'index',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  devServer: {
    port: 9010
  }
});
