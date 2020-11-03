const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: './esm/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.min.js',
        library: 'ConnexWalletBuddy',
        libraryTarget: 'umd'
    },
    resolve: {
        fallback: {
            crypto: require.resolve("crypto-browserify"),
            buffer: require.resolve('buffer/'),
            stream: require.resolve('stream-browserify')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ],
    mode: 'production',
    devtool: 'source-map'
}
