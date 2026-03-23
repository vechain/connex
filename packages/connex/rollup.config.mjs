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

// Virtual entry for UMD builds: re-exports only the default export so the
// UMD global (window.Connex) is ConnexClass directly, not { Connex, default }.
const UMD_ENTRY = '\0umd-entry'
const umdEntry = {
    name: 'umd-entry',
    resolveId(id) { if (id === UMD_ENTRY) return id },
    load(id) {
        if (id === UMD_ENTRY) return `export { default } from './esm/index.js'`
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
        input: UMD_ENTRY,
        output: {
            file: 'dist/connex.js',
            format: 'umd',
            name: 'Connex',
            sourcemap: true,
            exports: 'default',
        },
        plugins: [umdEntry, ...basePlugins],
    },
    // ── UMD (minified) ───────────────────────────────────────────────────────
    {
        input: UMD_ENTRY,
        output: {
            file: 'dist/connex.min.js',
            format: 'umd',
            name: 'Connex',
            sourcemap: true,
            exports: 'default',
        },
        plugins: [
            umdEntry,
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
