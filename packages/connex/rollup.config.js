import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from "rollup-plugin-node-polyfills"
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'dist/index.js',
    output: {
        name: 'Connex',
        file: 'dist/connex.all.min.js',
        format: 'umd',
    },
    plugins: [
        json({ preferConst: true }),
        commonjs({ browser: true }),
        resolve({ preferBuiltins: true, browser: true }),
        nodePolyfills(),
        terser()
    ],
    onwarn: (warning, rollupWarn) => {
        const ignoredWarnings = [{
            ignoredCode: 'CIRCULAR_DEPENDENCY',
            ignoredPath: 'readable-stream'
        }]

        // only show warning when code and path don't match
        // anything in above list of ignored warnings
        if (!ignoredWarnings.some(({ ignoredCode, ignoredPath }) => (
            warning.code === ignoredCode &&
            warning.importer.includes(ignoredPath)))) {
            rollupWarn(warning)
        }
    }
}
