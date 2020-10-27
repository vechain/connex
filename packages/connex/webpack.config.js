const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
    entry: './esm/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'connex.min.js',
        library: 'Connex',
        libraryTarget: 'umd',
        libraryExport: 'default'
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                    // keep_classnames: true
                }
            }),
        ]
    },
    performance: {
        hints: false
    },
    resolve: {
        fallback: {
            crypto: require.resolve("crypto-browserify"),
            buffer: require.resolve('buffer/'),
            url: require.resolve('url/'),
            stream: require.resolve('stream-browserify'),
            http: require.resolve('./dummy-http-agent'),
            https: require.resolve('./dummy-http-agent')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
    ]
}
