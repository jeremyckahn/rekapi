const path = require('path');

const modulePaths = [
  path.join(__dirname, 'node_modules')
];

module.exports = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader'
      }
    ]
  },
  resolve: {
    modules: [
      'node_modules'
    ]
  }
};
