import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import alias from '@rollup/plugin-alias'
import inject from '@rollup/plugin-inject'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Browser shims (same polyfills as the old webpack config)
const browserShims = {
    'crypto': require.resolve('crypto-browserify'),
    'stream': require.resolve('stream-browserify'),
    'url': require.resolve('url'),
    'http': path.resolve(__dirname, 'dummy-http-agent.js'),
    'https': path.resolve(__dirname, 'dummy-http-agent.js'),
}

// TypeScript compiles `import LRU from 'lru-cache'` (where lru-cache uses
// `export = LRUCache`) into `import * as LRU from 'lru-cache'` in ESM output.
// Rollup then wraps the CJS module in a _mergeNamespaces() object, so LRU
// becomes a plain object instead of the class, breaking `new LRU(256)`.
// This plugin rewrites the namespace import to a default import so Rollup
// resolves it via getDefaultExportFromCjs() — giving us the class directly.
const fixLruNamespaceImport = {
    name: 'fix-lru-namespace-import',
    transform(code) {
        if (code.includes("import * as LRU from 'lru-cache'")) {
            return {
                code: code.replace(
                    "import * as LRU from 'lru-cache';",
                    "import LRU from 'lru-cache';"
                ),
                map: null,
            }
        }
    },
}

const basePlugins = [
    fixLruNamespaceImport,
    alias({
        entries: Object.entries(browserShims).map(([find, replacement]) => ({
            find,
            replacement,
        })),
    }),
    resolve({
        browser: true,
        preferBuiltins: false,
    }),
    commonjs(),
    json(),
    inject({
        // Provide Buffer global (same as webpack ProvidePlugin)
        Buffer: ['buffer', 'Buffer'],
    }),
]

/** @type {import('rollup').RollupOptions[]} */
export default [
    // ── UMD (unminified) ─────────────────────────────────────────────────────
    {
        input: 'esm/index.js',
        output: {
            file: 'dist/connex.js',
            format: 'umd',
            name: 'Connex',
            sourcemap: true,
            exports: 'auto',
            // 'default' interop: `import Foo from 'cjs-module'` resolves to
            // the module.exports value directly, not wrapped in a namespace.
            // Fixes `new LRU()` and similar CJS-default-import usages.
        },
        plugins: basePlugins,
    },
    // ── UMD (minified) ───────────────────────────────────────────────────────
    {
        input: 'esm/index.js',
        output: {
            file: 'dist/connex.min.js',
            format: 'umd',
            name: 'Connex',
            sourcemap: true,
            exports: 'auto',
        },
        plugins: [
            ...basePlugins,
            terser({ keep_classnames: true }),
        ],
    },
    // ── ESM ──────────────────────────────────────────────────────────────────
    {
        input: 'esm/index.js',
        output: {
            file: 'dist/connex.esm.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: basePlugins,
    },
]
