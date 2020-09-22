import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from "rollup-plugin-node-polyfills"

export default {
    input: 'dist/index.js',
    output: {
        name: 'initConnex',
        file: 'dist/index.all.js',
        format: 'umd',
    },
    plugins: [
        resolve({ mainFields: ["jsnext", "preferBuiltins", "browser"] }),
        commonjs({
            browser: true
        }),
        json(),
        nodePolyfills()
    ]
}
