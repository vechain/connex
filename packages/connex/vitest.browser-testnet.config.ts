import path from 'path'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    // Serve dist/ as static assets at the root level:
    //   dist/connex.js      → /connex.js
    //   dist/connex.esm.js  → /connex.esm.js
    // This lets tests load the actual built artifacts without Vite transformation.
    publicDir: path.resolve(__dirname, 'dist'),
    test: {
        name: 'connex-browser-testnet',
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
        },
        include: ['src/__tests__/browser/dist-*.test.ts'],
        env: {
            TESTNET: process.env.TESTNET ?? '',
        },
    },
})
