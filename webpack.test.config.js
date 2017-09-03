const commonConfig = require('./webpack.common');
const path = require('path');

module.exports = Object.assign(commonConfig, {
  entry: {
    test: './test/index.js'
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
