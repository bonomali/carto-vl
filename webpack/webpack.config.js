const path = require('path');
const webpack = require('webpack');
const banner = require('./banner');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: 'carto-vl.js',
        library: 'carto',
        libraryTarget: 'umd'
    },
    devtool: 'sourcemap',
    mode: 'development',
    module: {
        rules: [
            { test: /\.glsl$/, use: 'webpack-glsl-loader' },
            { test: /\.svg$/, use: 'svg-inline-loader' }
        ]
    },
    plugins: [
        new webpack.BannerPlugin(banner)
    ]
};
