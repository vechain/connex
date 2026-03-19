import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LazyDriver, createNoVendor } from '../driver'

function makeNoVendorDriver(overrides: Partial<import('@vechain/connex-driver').DriverNoVendor> = {}): import('@vechain/connex-driver').DriverNoVendor {
    return {
        genesis: {
            id: '0x' + '00'.repeat(32), number: 0, size: 0,
            parentID: '0x' + 'ff'.repeat(32), timestamp: 0,
            gasLimit: 10000000, beneficiary: '0x' + '00'.repeat(20),
            gasUsed: 0, totalScore: 0,
            txsRoot: '0x' + '00'.repeat(32), stateRoot: '0x' + '00'.repeat(32),
            receiptsRoot: '0x' + '00'.repeat(32), signer: '0x' + '00'.repeat(20),
            isTrunk: true, transactions: [],
        },
        get head() {
            return {
                id: '0x' + '00'.repeat(32), number: 0,
                timestamp: 0, parentID: '0x' + 'ff'.repeat(32), gasLimit: 10000000,
            }
        },
        pollHead: vi.fn(async () => ({
            id: '0x' + '00'.repeat(32), number: 0,
            timestamp: 0, parentID: '0x' + 'ff'.repeat(32), gasLimit: 10000000,
        })),
        getBlock: vi.fn(async () => null),
        getTransaction: vi.fn(async () => null),
        getReceipt: vi.fn(async () => null),
        getAccount: vi.fn(async () => ({ balance: '0x0', energy: '0x0', hasCode: false })),
        getCode: vi.fn(async () => ({ code: '0x' })),
        getStorage: vi.fn(async () => ({ value: '0x' + '00'.repeat(32) })),
        explain: vi.fn(async () => []),
        filterEventLogs: vi.fn(async () => []),
        filterTransferLogs: vi.fn(async () => []),
        getFeesHistory: vi.fn(async () => ({ oldestBlock: '0x' + '00'.repeat(32), baseFeePerGas: [], gasUsedRatio: [] })),
        getPriorityFeeSuggestion: vi.fn(async () => '0x0'),
        ...overrides,
    } as unknown as import('@vechain/connex-driver').DriverNoVendor
}

describe('LazyDriver', () => {
    it('throws before setNoVendor is called', () => {
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        expect(() => driver.genesis).toThrow('thor driver is not ready')
    })

    it('delegates genesis after setNoVendor', () => {
        const noVendor = makeNoVendorDriver()
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(noVendor)
        expect(driver.genesis).toBe(noVendor.genesis)
    })

    it('delegates head after setNoVendor', () => {
        const noVendor = makeNoVendorDriver()
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(noVendor)
        expect(driver.head).toEqual(noVendor.head)
    })

    it('delegates pollHead', async () => {
        const noVendor = makeNoVendorDriver()
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(noVendor)
        await driver.pollHead()
        expect(noVendor.pollHead).toHaveBeenCalledOnce()
    })

    it('delegates getBlock', async () => {
        const noVendor = makeNoVendorDriver()
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(noVendor)
        await driver.getBlock('best')
        expect(noVendor.getBlock).toHaveBeenCalledWith('best')
    })

    it('delegates getTransaction', async () => {
        const noVendor = makeNoVendorDriver()
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(noVendor)
        const txid = '0x' + 'ab'.repeat(32)
        await driver.getTransaction(txid, false)
        expect(noVendor.getTransaction).toHaveBeenCalledWith(txid, false)
    })

    it('delegates getAccount', async () => {
        const noVendor = makeNoVendorDriver()
        const signer = Promise.resolve({} as Connex.Signer)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(noVendor)
        const addr = '0x' + 'aa'.repeat(20)
        await driver.getAccount(addr, 'best')
        expect(noVendor.getAccount).toHaveBeenCalledWith(addr, 'best')
    })

    it('signTx delegates to provided signer', async () => {
        const mockSigner: Connex.Signer = {
            signTx: vi.fn(async () => ({ txid: '0x' + '00'.repeat(32), signer: '0x' + 'aa'.repeat(20) })),
            signCert: vi.fn(async () => ({ annex: { domain: '', timestamp: 0, signer: '0x' + 'aa'.repeat(20) }, signature: '0x' + '00'.repeat(65) })),
        }
        const signer = Promise.resolve(mockSigner)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(makeNoVendorDriver())
        const result = await driver.signTx([], {})
        expect(mockSigner.signTx).toHaveBeenCalledWith([], {})
        expect(result.txid).toBe('0x' + '00'.repeat(32))
    })

    it('signCert delegates to provided signer', async () => {
        const mockSigner: Connex.Signer = {
            signTx: vi.fn(async () => ({ txid: '0x' + '00'.repeat(32), signer: '0x' + 'aa'.repeat(20) })),
            signCert: vi.fn(async () => ({ annex: { domain: 'example.com', timestamp: 1000, signer: '0x' + 'aa'.repeat(20) }, signature: '0x' + '00'.repeat(65) })),
        }
        const signer = Promise.resolve(mockSigner)
        const driver = new LazyDriver(signer)
        driver.setNoVendor(makeNoVendorDriver())
        const msg: Connex.Vendor.CertMessage = { purpose: 'identification', payload: { type: 'text', content: 'hello' } }
        const result = await driver.signCert(msg, {})
        expect(mockSigner.signCert).toHaveBeenCalledWith(msg, {})
        expect(result.annex.domain).toBe('example.com')
    })
})

describe('createNoVendor', () => {
    it('returns the same instance for the same node + genesis', () => {
        const genesis = {
            id: '0x' + '01'.repeat(32), number: 0, size: 0,
            parentID: '0x' + 'ff'.repeat(32), timestamp: 1000,
            gasLimit: 10000000, beneficiary: '0x' + '00'.repeat(20),
            gasUsed: 0, totalScore: 0,
            txsRoot: '0x' + '00'.repeat(32), stateRoot: '0x' + '00'.repeat(32),
            receiptsRoot: '0x' + '00'.repeat(32), signer: '0x' + '00'.repeat(20),
            isTrunk: true, transactions: [],
        } as Connex.Thor.Block

        const a = createNoVendor('http://localhost:8669', genesis)
        const b = createNoVendor('http://localhost:8669', genesis)
        expect(a).toBe(b)
    })

    it('returns different instances for different node URLs', () => {
        const genesis = {
            id: '0x' + '02'.repeat(32), number: 0, size: 0,
            parentID: '0x' + 'ff'.repeat(32), timestamp: 1000,
            gasLimit: 10000000, beneficiary: '0x' + '00'.repeat(20),
            gasUsed: 0, totalScore: 0,
            txsRoot: '0x' + '00'.repeat(32), stateRoot: '0x' + '00'.repeat(32),
            receiptsRoot: '0x' + '00'.repeat(32), signer: '0x' + '00'.repeat(20),
            isTrunk: true, transactions: [],
        } as Connex.Thor.Block

        const a = createNoVendor('http://node1:8669', genesis)
        const b = createNoVendor('http://node2:8669', genesis)
        expect(a).not.toBe(b)
    })
})
