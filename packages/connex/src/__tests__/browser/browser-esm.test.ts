/**
 * Browser ESM tests for @vechain/connex.
 * These tests run in a real Chromium browser via @vitest/browser + Playwright.
 *
 * What is tested: the ESM entry point loaded via Vite in a real browser context.
 * Verifies the module resolves, all exports are present, and the API surface
 * is structurally correct in a browser environment.
 *
 * What is NOT tested here: the pre-built dist files (connex.js, connex.esm.js).
 * Those are validated by the Rollup build step succeeding.
 *
 * Run with: npm run test:browser (from monorepo root)
 */
import { describe, it, expect } from 'vitest'
import ConnexDefault, { Connex } from '../../index'

describe('Connex ESM export in browser', () => {
    it('default export is a constructor function', () => {
        expect(typeof ConnexDefault).toBe('function')
    })

    it('named Connex export is a constructor function', () => {
        expect(typeof Connex).toBe('function')
    })

    it('default and named export are the same class', () => {
        expect(ConnexDefault).toBe(Connex)
    })

    it('Connex.Thor is a constructor named ThorClass', () => {
        expect(typeof Connex.Thor).toBe('function')
        expect(Connex.Thor.name).toBe('ThorClass')
    })

    it('Connex.Vendor is a constructor named VendorClass', () => {
        expect(typeof Connex.Vendor).toBe('function')
        expect(Connex.Vendor.name).toBe('VendorClass')
    })

    it('ConnexClass exposes Thor and Vendor as distinct static members', () => {
        expect(Connex).toHaveProperty('Thor')
        expect(Connex).toHaveProperty('Vendor')
        expect(Connex.Thor).not.toBe(Connex.Vendor)
    })

    it('runs in window context (browser globals are defined)', () => {
        expect(typeof window).toBe('object')
        expect(typeof document).toBe('object')
    })
})
