const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
    entry: './dist/index.js',
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
                cache: true,
                parallel: true,
                sourceMap: true, // Must be set to true if using source-maps in production
                terserOptions: {
                    // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                    keep_classnames: true
                }
            }),
        ],
    },
    performance: {
        hints: false
    }
}
