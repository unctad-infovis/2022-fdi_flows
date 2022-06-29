const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
    static: './'
  },
  entry: {
    app: './src/index.js'
  },
  mode: 'development'
});