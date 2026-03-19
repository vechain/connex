import { defineConfig } from 'vitest/config'

export default defineConfig({
    optimizeDeps: {
        include: ['lru-cache'],
    },
    test: {
        name: 'driver-integration',
        environment: 'node',
        include: ['src/__tests__/integration/**/*.test.ts'],
        testTimeout: 30000,
    },
})
