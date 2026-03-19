import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'connex',
        environment: 'node',
        include: ['src/__tests__/**/*.test.ts'],
        exclude: ['src/__tests__/browser/**', 'src/__tests__/integration/**'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/__tests__/**'],
        },
    },
})
