const path = require('path')

module.exports = {
    entry: './dist/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'connex.min.js',
        library: 'Connex',
        libraryTarget: 'umd'
    },
    mode: 'production',
    performance: {
        hints: false
    }
}
