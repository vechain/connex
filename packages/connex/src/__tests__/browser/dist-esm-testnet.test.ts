/**
 * Testnet tests for the pre-built ESM bundle (dist/connex.esm.js).
 *
 * These tests load the actual built artifact from the static file server
 * and verify it works correctly against VeChain testnet.
 *
 * Requires:
 *   1. npm run build (in packages/connex) to produce dist/connex.esm.js
 *   2. TESTNET=true env var to run (skipped otherwise)
 *
 * Run with: TESTNET=true npm run test:browser:testnet (from monorepo root)
 */
import { describe, it, expect, beforeAll } from 'vitest'

const TESTNET_URL = 'https://testnet.vechain.org'
const TESTNET_GENESIS_ID = '0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127'
// VET energy (VIP180) built-in contract
const ENERGY_CONTRACT = '0x0000000000000000000000000000456e65726779'
// balanceOf(address) ABI selector: keccak256('balanceOf(address)')[0:4]
const BALANCE_OF_SELECTOR = '0x70a08231'

// publicDir in vitest.browser-testnet.config.ts is set to 'dist',
// so connex.esm.js is served at /connex.esm.js
describe.skipIf(!import.meta.env.TESTNET)('dist/connex.esm.js – testnet', () => {
    let ThorClass: any

    beforeAll(async () => {
        // publicDir files cannot be loaded via dynamic import() — Vite blocks it.
        // Fetch the bundle text, wrap in a Blob URL, then import that URL.
        // The ESM bundle is fully self-contained (no external imports), so a
        // blob: URL import works correctly in Chromium.
        const text = await fetch('/connex.esm.js').then(r => r.text())
        const blob = new Blob([text], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)
        try {
            const mod = await import(/* @vite-ignore */ url) as any
            ThorClass = mod.Connex?.Thor ?? mod.default?.Thor
        } finally {
            URL.revokeObjectURL(url)
        }
    })

    it('ThorClass is a constructor', () => {
        expect(typeof ThorClass).toBe('function')
    })

    it('genesis block id matches testnet', () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        expect(thor.genesis.id).toBe(TESTNET_GENESIS_ID)
    })

    it('block 1 exists and follows genesis', async () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        const block = await thor.block(1).get()
        expect(block).not.toBeNull()
        expect(block!.number).toBe(1)
        expect(block!.parentID).toBe(TESTNET_GENESIS_ID)
    }, 15_000)

    it('energy contract has code deployed', async () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        const account = await thor.account(ENERGY_CONTRACT).get()
        expect(account.hasCode).toBe(true)
    }, 15_000)

    it('block by number 0 is the genesis block', async () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        const block = await thor.block(0).get()
        expect(block).not.toBeNull()
        expect(block!.id).toBe(TESTNET_GENESIS_ID)
    }, 15_000)

    it('filter transfer returns logs with correct structure', async () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        const filter = thor.filter('transfer', [])
        filter.range({ unit: 'block', from: 0, to: 1000 })
        const logs = await filter.apply(0, 5)
        expect(Array.isArray(logs)).toBe(true)
        if (logs.length > 0) {
            const log = logs[0]
            expect(log.sender).toMatch(/^0x[0-9a-f]{40}$/i)
            expect(log.recipient).toMatch(/^0x[0-9a-f]{40}$/i)
            expect(log.amount).toMatch(/^0x/)
            expect(log.meta.txID).toMatch(/^0x[0-9a-f]{64}$/)
            expect(typeof log.meta.blockNumber).toBe('number')
        }
    }, 15_000)

    it('explain returns VTHO balance via balanceOf call', async () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        // Query the VTHO balance of the ENERGY_CONTRACT address itself (call won't revert)
        const data = BALANCE_OF_SELECTOR + '000000000000000000000000' + ENERGY_CONTRACT.slice(2)
        const result = await thor.explain([{ to: ENERGY_CONTRACT, value: '0x0', data }]).execute()
        expect(result).toHaveLength(1)
        expect(result[0].reverted).toBe(false)
        // ABI-encoded uint256 — 32 bytes = 64 hex chars
        expect(result[0].data).toMatch(/^0x[0-9a-f]{64}$/)
    }, 15_000)

    it('get transaction finds a real tx from an early block', async () => {
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        // Find a tx by scanning transfer logs in the first 1000 blocks
        const filter = thor.filter('transfer', [])
        filter.range({ unit: 'block', from: 1, to: 1000 })
        const logs = await filter.apply(0, 1)
        if (logs.length === 0) return // no transfers in range — skip assertions
        const txId = logs[0].meta.txID
        const tx = await thor.transaction(txId).get()
        expect(tx).not.toBeNull()
        expect(tx.id).toBe(txId)
        expect(tx.origin).toMatch(/^0x[0-9a-f]{40}$/i)
        expect(typeof tx.gas).toBe('number')
        expect(Array.isArray(tx.clauses)).toBe(true)
    }, 20_000)
})
