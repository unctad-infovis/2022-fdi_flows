const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
    static: './'
  },
  entry: {
    app: './src/index.js'
  },
  mode: 'development',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/font/', to: './font', noErrorOnMissing: true}
      ]
    })
  ]
});