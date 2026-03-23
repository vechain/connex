/**
 * Testnet tests for the pre-built UMD bundle (dist/connex.js).
 *
 * The UMD bundle is injected as a <script> tag so it runs exactly as it would
 * in a plain HTML page (no module bundler). After injection, window.Connex
 * is the module namespace: { default: ConnexClass, Connex: ConnexClass }.
 *
 * Requires:
 *   1. npm run build (in packages/connex) to produce dist/connex.js
 *   2. TESTNET=true env var to run (skipped otherwise)
 *
 * Run with: TESTNET=true npm run test:browser:testnet (from monorepo root)
 */
import { describe, it, expect, beforeAll } from 'vitest'

const TESTNET_URL = 'https://testnet.vechain.org'
const TESTNET_GENESIS_ID = '0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127'
const ENERGY_CONTRACT = '0x0000000000000000000000000000456e65726779'
// balanceOf(address) ABI selector: keccak256('balanceOf(address)')[0:4]
const BALANCE_OF_SELECTOR = '0x70a08231'

// publicDir in vitest.browser-testnet.config.ts is set to 'dist',
// so connex.js is served at /connex.js.
// vitest browser tests run inside the browser, so document/window are available directly.
describe.skipIf(!import.meta.env.TESTNET)('dist/connex.js (UMD) – testnet', () => {
    beforeAll(async () => {
        // Mask CJS/AMD globals so the UMD bundle falls through to its global-assignment
        // branch (setting window.Connex). Without this, Vite's browser environment
        // exposes `exports`, causing the UMD wrapper to pick CJS mode and breaking
        // the bundled lru-cache initialisation.
        const w = window as any
        const savedExports = w.exports
        const savedDefine  = w.define
        w.exports = undefined
        w.define  = undefined

        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = '/connex.js'
            script.onload = () => {
                w.exports = savedExports
                w.define  = savedDefine
                resolve()
            }
            script.onerror = () => {
                w.exports = savedExports
                w.define  = savedDefine
                reject(new Error('Failed to load /connex.js'))
            }
            document.head.appendChild(script)
        })
    })

    it('window.Connex is defined after script injection', () => {
        const w = window as any
        expect(w.Connex).toBeDefined()
        expect(typeof w.Connex).toBe('function')
    })

    it('Connex.Thor is a constructor', () => {
        const ThorClass = (window as any).Connex.Thor
        expect(typeof ThorClass).toBe('function')
    })

    it('genesis block id matches testnet', () => {
        const ThorClass = (window as any).Connex.Thor
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        expect(thor.genesis.id).toBe(TESTNET_GENESIS_ID)
    })

    it('block 1 exists and follows genesis', async () => {
        const ThorClass = (window as any).Connex.Thor
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        const block = await thor.block(1).get()
        expect(block).not.toBeNull()
        expect(block!.number).toBe(1)
        expect(block!.parentID).toBe(TESTNET_GENESIS_ID)
    }, 15_000)

    it('energy contract has code deployed', async () => {
        const ThorClass = (window as any).Connex.Thor
        const thor = new ThorClass({ node: TESTNET_URL, network: 'test' })
        const account = await thor.account(ENERGY_CONTRACT).get()
        expect(account.hasCode).toBe(true)
    }, 15_000)

    it('filter transfer returns logs with correct structure', async () => {
        const ThorClass = (window as any).Connex.Thor
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
        const ThorClass = (window as any).Connex.Thor
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
        const ThorClass = (window as any).Connex.Thor
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
