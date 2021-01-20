const path = require('path')

module.exports = {
    entry: './entry.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.min.js',
        library: 'ConnexWalletBuddy',
        libraryTarget: 'umd'
    },
    mode: 'production',
    devtool: 'source-map'
}
