const path = require('path')
const webpack = require('webpack')

const common = {
    mode: 'production',
    devtool: 'source-map',
    performance: {
        hints: false
    }
}

module.exports = [{
    ...common,
    entry: './esm/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'connex.min.js',
        library: 'Connex',
        libraryTarget: 'umd',
        libraryExport: 'default'
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
    ]
}, {
    ...common,
    entry: './esm/driver-bundle/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'driver-bundle.min.js',
        library: 'ConnexDriver',
        libraryTarget: 'umd'
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
}]
