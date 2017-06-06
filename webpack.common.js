const path = require('path');

const modulePaths = [
  'scripts',
  path.join(__dirname, 'node_modules')
];

module.exports = {
  devtool: 'source-map',
  resolveLoader: {
    // http://webpack.github.io/docs/troubleshooting.html#npm-linked-modules-doesn-t-find-their-dependencies
    fallback: modulePaths
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          // The commented line below _should_ be all that's necessary, but the
          // require.resolve below is needed as a workaround for a babel bug:
          // https://github.com/babel/babel-loader/issues/149#issuecomment-170244381
          //presets: ['es2015']
          presets: [require.resolve('babel-preset-es2015')]
        }
      }
    ]
  },
  resolve: {
    modulesDirectories: modulePaths,

    // http://webpack.github.io/docs/troubleshooting.html#npm-linked-modules-doesn-t-find-their-dependencies
    fallback: modulePaths
  },
};
