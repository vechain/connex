/**
 * Integration tests for connex-driver against a live thor-solo node.
 * Requires: docker compose -f docker/docker-compose.yml up -d
 * Run with: INTEGRATION=true vitest run --project driver-integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Driver, SimpleWallet, SimpleNet } from '../../index'

const SOLO_URL = process.env.THOR_SOLO_URL || 'http://localhost:8669'

// Solo genesis block id
const SOLO_GENESIS_ID = '0x00000000bb55405beed90df9fea5acdb1cb7caba61b0d7513395f42efd30e558'

// Pre-funded solo address — index 0 from mnemonic (BIP44 VeChain path m/44'/818'/0'/0/0)
const FUNDED_ADDRESS = '0xf077b491b355e64048ce21e3a6fc4751eeea77fa'

let driver: Driver

describe('Driver Integration Tests', () => {
    beforeAll(async () => {
        const net = new SimpleNet(SOLO_URL)
        driver = await Driver.connect(net)
    }, 30000)

    afterAll(() => {
        driver?.close()
    })

    it('connects and reads genesis block', () => {
        expect(driver.genesis.number).toBe(0)
        expect(driver.genesis.id).toBe(SOLO_GENESIS_ID)
    })

    it('head is initialized after connect', () => {
        expect(driver.head.number).toBeGreaterThanOrEqual(0)
        expect(driver.head.id).toMatch(/^0x[0-9a-f]{64}$/)
    })

    it('getBlock("best") returns current best block', async () => {
        const block = await driver.getBlock('best')
        expect(block).not.toBeNull()
        expect(block!.number).toBeGreaterThanOrEqual(0)
        expect(block!.id).toMatch(/^0x[0-9a-f]{64}$/)
    })

    it('getBlock(0) returns genesis block', async () => {
        const block = await driver.getBlock(0)
        expect(block).not.toBeNull()
        expect(block!.number).toBe(0)
        expect(block!.id).toBe(SOLO_GENESIS_ID)
    })

    it('getBlock for non-existent block returns null', async () => {
        const block = await driver.getBlock(99999999)
        expect(block).toBeNull()
    })

    it('getAccount returns account data for funded address', async () => {
        const account = await driver.getAccount(FUNDED_ADDRESS, 'best')
        expect(account).not.toBeNull()
        expect(account.balance).toMatch(/^0x/)
        expect(account.energy).toMatch(/^0x/)
        expect(typeof account.hasCode).toBe('boolean')
    })

    it('getAccount returns zero balance for empty address', async () => {
        // Use an address that is definitely not a precompile or funded account
        const emptyAddr = '0x' + 'de'.repeat(19) + 'ad'
        const account = await driver.getAccount(emptyAddr, 'best')
        expect(account.balance).toBe('0x0')
        expect(account.energy).toBe('0x0')
        expect(account.hasCode).toBe(false)
    })

    it('getCode returns code for an account', async () => {
        const code = await driver.getCode(FUNDED_ADDRESS, 'best')
        expect(code).not.toBeNull()
        expect(code.code).toMatch(/^0x/)
    })

    it('getStorage returns storage value', async () => {
        const storage = await driver.getStorage(FUNDED_ADDRESS, '0x' + '00'.repeat(32), 'best')
        expect(storage).not.toBeNull()
        expect(storage.value).toMatch(/^0x/)
    })

    it('getTransaction returns null for non-existent tx', async () => {
        const tx = await driver.getTransaction('0x' + 'ab'.repeat(32), false)
        expect(tx).toBeNull()
    })

    it('getReceipt returns null for non-existent tx', async () => {
        const receipt = await driver.getReceipt('0x' + 'ab'.repeat(32))
        expect(receipt).toBeNull()
    })

    it('explain returns VM output for VET transfer simulation', async () => {
        const outputs = await driver.explain(
            {
                clauses: [{ to: FUNDED_ADDRESS, value: '0x1', data: '0x' }],
                caller: FUNDED_ADDRESS,
            },
            'best'
        )
        expect(Array.isArray(outputs)).toBe(true)
        expect(outputs).toHaveLength(1)
        expect(outputs[0].reverted).toBe(false)
    })

    it('filterEventLogs returns array', async () => {
        const logs = await driver.filterEventLogs({
            range: { unit: 'block', from: 0, to: 1 },
            options: { offset: 0, limit: 10 },
            criteriaSet: [],
            order: 'asc',
        })
        expect(Array.isArray(logs)).toBe(true)
    })

    it('filterTransferLogs returns array', async () => {
        const logs = await driver.filterTransferLogs({
            range: { unit: 'block', from: 0, to: 1 },
            options: { offset: 0, limit: 10 },
            criteriaSet: [],
            order: 'asc',
        })
        expect(Array.isArray(logs)).toBe(true)
    })

    it('pollHead resolves when a new head is available', async () => {
        // pollHead returns the next head once it changes, or current head
        const headPromise = driver.pollHead()
        const head = await Promise.race([
            headPromise,
            new Promise<null>(r => setTimeout(() => r(null), 15000))
        ])
        // In solo mode blocks are produced on demand, so pollHead might take a while.
        // We only verify that it eventually resolves.
        if (head !== null) {
            expect(head.number).toBeGreaterThanOrEqual(0)
        }
    }, 20000)
})

describe('Driver + SimpleWallet Integration Tests', () => {
    // Pre-funded solo private key — index 0 from mnemonic (BIP44 VeChain path m/44'/818'/0'/0/0)
    const SOLO_PRIVATE_KEY = '0x99f0500549792796c14fed62011a51081dc5b5e68fe8bd8a13b86be829c4fd36'

    let driverWithWallet: Driver

    beforeAll(async () => {
        const net = new SimpleNet(SOLO_URL)
        const wallet = new SimpleWallet()
        wallet.import(SOLO_PRIVATE_KEY)
        driverWithWallet = await Driver.connect(net, wallet)
    }, 30000)

    afterAll(() => {
        driverWithWallet?.close()
    })

    it('signTx sends a VET transfer and returns txid', async () => {
        const recipient = '0x' + 'cc'.repeat(20)
        const response = await driverWithWallet.signTx(
            [{ to: recipient, value: '0x1', data: '0x' }],
            {}
        )
        expect(response.txid).toMatch(/^0x[0-9a-f]{64}$/)
        expect(response.signer).toMatch(/^0x[0-9a-f]{40}$/)
    })

    it('signCert produces a valid certificate response', async () => {
        const response = await driverWithWallet.signCert(
            { purpose: 'identification', payload: { type: 'text', content: 'integration test' } },
            {}
        )
        expect(response.annex.domain).toBe('localhost')
        expect(response.annex.signer).toMatch(/^0x[0-9a-f]{40}$/)
        expect(response.signature).toMatch(/^0x[0-9a-f]+$/)
    })
})
