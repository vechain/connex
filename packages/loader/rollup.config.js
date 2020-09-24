import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
 import nodePolyfills from "rollup-plugin-node-polyfills"
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import {terser} from 'rollup-plugin-terser'
export default {
    input: 'dist/index.js',
    output: {
        name: 'initConnex',
        file: 'dist/index.all.min.js',
        format: 'umd',
    },
    plugins: [       
        json({preferConst:true}),
        // builtins(),
        //  globals(),
        resolve( { jsnext: true, preferBuiltins: true, browser: true }),
        commonjs({
            browser: true,
        }),
         nodePolyfills(),

          terser()
    ]
}
