import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        projects: [
            'packages/framework/vitest.config.ts',
            'packages/driver/vitest.config.ts',
            'packages/connex/vitest.config.ts',
            'packages/framework/vitest.integration.config.ts',
            'packages/driver/vitest.integration.config.ts',
            'packages/connex/vitest.browser.config.ts',
            'packages/connex/vitest.browser-testnet.config.ts',
        ],
    },
})
