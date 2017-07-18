const commonConfig = require('./webpack.common');
const path = require('path');

module.exports = Object.assign(commonConfig, {
  entry: {
    test: './test/index.js',
    'sandbox-basic': './sandbox/basic.js',
    'sandbox-dom': './sandbox/dom.js',
    'sandbox-multirender': './sandbox/multirender.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/assets/',
    filename: '[name].js'
  },
  devServer: {
    port: 9010
  }
});
