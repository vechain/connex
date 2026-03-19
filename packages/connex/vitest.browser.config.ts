import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    resolve: {
        alias: {
            // Point Node's built-in 'buffer' to the npm 'buffer' package so Vite
            // bundles it for the browser instead of externalizing it.
            buffer: 'buffer/',
        },
    },
    define: {
        // Some CJS dependencies (e.g. uuid via @vechain/ethers) reference `global`
        global: 'globalThis',
    },
    optimizeDeps: {
        include: [
            '@vechain/connex-driver',
            '@vechain/connex-framework',
            'randombytes',
            'thor-devkit',
            'buffer',
        ],
    },
    test: {
        name: 'connex-browser',
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
        },
        include: ['src/__tests__/browser/**/*.test.ts'],
        exclude: ['src/__tests__/browser/dist-*.test.ts'],
    },
})
