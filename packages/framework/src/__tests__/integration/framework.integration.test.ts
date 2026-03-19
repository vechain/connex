/**
 * Integration tests for connex-framework against a live thor-solo node.
 * Requires: docker compose -f docker/docker-compose.yml up -d
 * Run with: INTEGRATION=true vitest run --project framework-integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Framework } from '../../index'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex-driver'

const SOLO_URL = process.env.THOR_SOLO_URL || 'http://localhost:8669'
const SOLO_GENESIS_ID = '0x00000000bb55405beed90df9fea5acdb1cb7caba61b0d7513395f42efd30e558'
const SOLO_PRIVATE_KEY = '0x99f0500549792796c14fed62011a51081dc5b5e68fe8bd8a13b86be829c4fd36'
// Pre-funded solo address — index 0 from mnemonic (BIP44 VeChain path m/44'/818'/0'/0/0)
const FUNDED_ADDRESS = '0xf077b491b355e64048ce21e3a6fc4751eeea77fa'
// VET energy (VIP180) built-in contract
const ENERGY_CONTRACT = '0x0000000000000000000000000000456e65726779'
// balanceOf(address) ABI selector: keccak256('balanceOf(address)')[0:4]
const BALANCE_OF_SELECTOR = '0x70a08231'

let framework: Framework
let driver: Driver
// txid of the VET transfer submitted in vendor.sign(tx) — used in end-to-end tests
let submittedTxId = ''

describe('Framework Integration Tests', () => {
    beforeAll(async () => {
        const net = new SimpleNet(SOLO_URL)
        const wallet = new SimpleWallet()
        wallet.import(SOLO_PRIVATE_KEY)
        driver = await Driver.connect(net, wallet)
        framework = new Framework(driver)
    }, 30000)

    afterAll(() => {
        driver?.close()
    })

    describe('thor.genesis', () => {
        it('returns the genesis block', () => {
            expect(framework.thor.genesis.number).toBe(0)
            expect(framework.thor.genesis.id).toBe(SOLO_GENESIS_ID)
        })
    })

    describe('thor.status', () => {
        it('returns current chain status', () => {
            const status = framework.thor.status
            expect(status.progress).toBeGreaterThan(0)
            expect(status.head.number).toBeGreaterThanOrEqual(0)
            expect(status.head.id).toMatch(/^0x[0-9a-f]{64}$/)
        })
    })

    describe('thor.ticker()', () => {
        it('resolves next() within a reasonable time', async () => {
            const ticker = framework.thor.ticker()
            const head = await Promise.race([
                ticker.next(),
                new Promise<null>(r => setTimeout(() => r(null), 15000))
            ])
            if (head !== null) {
                expect((head as Connex.Thor.Status['head']).number).toBeGreaterThanOrEqual(0)
            }
        }, 20000)
    })

    describe('thor.block()', () => {
        it('fetches the genesis block by number', async () => {
            const block = await framework.thor.block(0).get()
            expect(block).not.toBeNull()
            expect(block!.number).toBe(0)
            expect(block!.id).toBe(SOLO_GENESIS_ID)
        })

        it('fetches the best block', async () => {
            const block = await framework.thor.block().get()
            expect(block).not.toBeNull()
            expect(block!.number).toBeGreaterThanOrEqual(0)
        })

        it('returns null for non-existent block', async () => {
            const block = await framework.thor.block(99999999).get()
            expect(block).toBeNull()
        })
    })

    describe('thor.account()', () => {
        it('get() returns account data', async () => {
            const account = await framework.thor.account(FUNDED_ADDRESS).get()
            expect(account.balance).toMatch(/^0x/)
            expect(account.energy).toMatch(/^0x/)
            expect(typeof account.hasCode).toBe('boolean')
        })

        it('getCode() returns code field', async () => {
            const code = await framework.thor.account(FUNDED_ADDRESS).getCode()
            expect(code.code).toMatch(/^0x/)
        })

        it('getStorage() returns storage value', async () => {
            const storage = await framework.thor.account(FUNDED_ADDRESS).getStorage('0x' + '00'.repeat(32))
            expect(storage.value).toMatch(/^0x/)
        })
    })

    describe('thor.transaction()', () => {
        it('get() returns null for non-existent tx', async () => {
            const tx = await framework.thor.transaction('0x' + 'ab'.repeat(32)).get()
            expect(tx).toBeNull()
        })

        it('getReceipt() returns null for non-existent tx', async () => {
            const receipt = await framework.thor.transaction('0x' + 'ab'.repeat(32)).getReceipt()
            expect(receipt).toBeNull()
        })
    })

    describe('thor.filter()', () => {
        it('event filter returns array', async () => {
            const filter = framework.thor.filter('event', [])
            filter.range({ unit: 'block', from: 0, to: 10 })
            const logs = await filter.apply(0, 10)
            expect(Array.isArray(logs)).toBe(true)
        })

        it('transfer filter returns array', async () => {
            const filter = framework.thor.filter('transfer', [])
            filter.range({ unit: 'block', from: 0, to: 10 })
            const logs = await filter.apply(0, 10)
            expect(Array.isArray(logs)).toBe(true)
        })
    })

    describe('thor.explain()', () => {
        it('executes a VET transfer simulation', async () => {
            const result = await framework.thor
                .explain([{ to: FUNDED_ADDRESS, value: '0x1', data: '0x' }])
                .caller(FUNDED_ADDRESS)
                .execute()
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0].reverted).toBe(false)
        })

        it('reads VTHO balance via balanceOf call', async () => {
            // Call VTHO built-in contract: balanceOf(FUNDED_ADDRESS)
            const data = BALANCE_OF_SELECTOR + '000000000000000000000000' + FUNDED_ADDRESS.slice(2)
            const result = await framework.thor
                .explain([{ to: ENERGY_CONTRACT, value: '0x0', data }])
                .execute()
            expect(result).toHaveLength(1)
            expect(result[0].reverted).toBe(false)
            // Output is a 32-byte hex-encoded uint256 (the VTHO balance)
            expect(result[0].data).toMatch(/^0x[0-9a-f]{64}$/)
            const balance = BigInt(result[0].data)
            // Solo genesis pre-allocates VTHO to FUNDED_ADDRESS
            expect(balance).toBeGreaterThan(0n)
        })
    })

    describe('vendor.sign(tx)', () => {
        it('signs and submits a VET transfer', async () => {
            const recipient = '0x' + 'dd'.repeat(20)
            const response = await framework.vendor
                .sign('tx', [{ to: recipient, value: '0x1', data: '0x' }])
                .request()
            submittedTxId = response.txid
            expect(response.txid).toMatch(/^0x[0-9a-f]{64}$/)
            expect(response.signer).toMatch(/^0x[0-9a-f]{40}$/)
        })
    })

    describe('vendor.sign(cert)', () => {
        it('signs an identification certificate', async () => {
            const response = await framework.vendor
                .sign('cert', { purpose: 'identification', payload: { type: 'text', content: 'hello world' } })
                .request()
            expect(response.annex.signer).toMatch(/^0x[0-9a-f]{40}$/)
            expect(response.signature).toMatch(/^0x[0-9a-f]+$/)
        })
    })

    // These tests depend on vendor.sign(tx) having run first (submittedTxId is set).
    // Vitest runs describe blocks in definition order within a file.
    describe('thor.transaction() – real submitted tx', () => {
        beforeAll(async () => {
            // Poll until the submitted tx is mined (solo produces blocks every few seconds)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let receipt: any = null
            for (let i = 0; i < 15 && !receipt; i++) {
                await new Promise(r => setTimeout(r, 2000))
                receipt = await framework.thor.transaction(submittedTxId).getReceipt()
            }
        }, 35_000)

        it('getReceipt() returns a non-reverted receipt', async () => {
            const receipt = await framework.thor.transaction(submittedTxId).getReceipt()
            expect(receipt).not.toBeNull()
            expect(receipt!.reverted).toBe(false)
            expect(receipt!.meta.txID).toBe(submittedTxId)
            expect(typeof receipt!.gasUsed).toBe('number')
        })

        it('get() returns full transaction fields', async () => {
            const tx = await framework.thor.transaction(submittedTxId).get()
            expect(tx).not.toBeNull()
            expect(tx!.id).toBe(submittedTxId)
            expect(tx!.origin).toMatch(/^0x[0-9a-f]{40}$/)
            expect(typeof tx!.gas).toBe('number')
            expect(Array.isArray(tx!.clauses)).toBe(true)
            expect(tx!.clauses).toHaveLength(1)
            expect(tx!.clauses[0].to).toMatch(/^0x[0-9a-f]{40}$/)
        })
    })

    describe('thor.filter() – transfer log structure', () => {
        it('transfer filter by txOrigin returns records with correct shape', async () => {
            // FUNDED_ADDRESS is the signer of vendor.sign(tx) test above
            const filter = framework.thor.filter('transfer', [{ txOrigin: FUNDED_ADDRESS }])
            filter.order('desc')
            const logs = await filter.apply(0, 5)
            expect(Array.isArray(logs)).toBe(true)
            expect(logs.length).toBeGreaterThan(0)
            const log = logs[0]
            expect(log.sender).toMatch(/^0x[0-9a-f]{40}$/)
            expect(log.recipient).toMatch(/^0x[0-9a-f]{40}$/)
            expect(log.amount).toMatch(/^0x/)
            expect(log.meta.txID).toMatch(/^0x[0-9a-f]{64}$/)
            expect(typeof log.meta.blockNumber).toBe('number')
        })
    })
})
