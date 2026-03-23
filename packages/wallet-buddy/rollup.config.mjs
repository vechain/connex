import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'

/** Inline *.html files as default-exported strings */
const htmlString = {
    name: 'html-string',
    transform(code, id) {
        if (id.endsWith('.html')) {
            return { code: `export default ${JSON.stringify(code)};`, map: null }
        }
    }
}

export default {
    input: 'entry.js',
    output: {
        file: 'dist/bundle.min.js',
        format: 'umd',
        name: 'ConnexWalletBuddy',
        sourcemap: true,
        exports: 'named',
    },
    plugins: [
        htmlString,
        json(),
        resolve({ browser: true }),
        commonjs(),
        terser(),
    ],
}
