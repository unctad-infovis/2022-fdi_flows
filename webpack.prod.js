const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const name = require('./package.json').name;
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = merge(common, {
  mode:'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
        },
        test: /\.js(\?.*)?$/i
      }),
      new CssMinimizerPlugin({
        test: /\.css(\?.*)?$/i
      }),
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'media/img/', to: '../public/img', noErrorOnMissing: true, globOptions: { ignore: ['**/.DS_Store'] }},
        { from: 'media/data/data2021.json', to: '../public/' + name + '.json', noErrorOnMissing: true},
        { from: './favicon.png', to: '../public', noErrorOnMissing: true}
      ]
    })
  ]
});