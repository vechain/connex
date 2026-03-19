import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'framework-integration',
        environment: 'node',
        include: ['src/__tests__/integration/**/*.test.ts'],
        testTimeout: 30000,
    },
})
