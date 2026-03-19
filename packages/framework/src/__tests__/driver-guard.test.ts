import { describe, it, expect, vi } from 'vitest'
import { newDriverGuard } from '../driver-guard'

const validHead: Connex.Thor.Status['head'] = {
    id: '0x' + 'ab'.repeat(32),
    number: 100,
    timestamp: 1000000,
    parentID: '0x' + 'cd'.repeat(32),
    gasLimit: 10000000,
}

const validBlock: Connex.Thor.Block = {
    id: '0x' + 'ab'.repeat(32),
    number: 100,
    size: 256,
    parentID: '0x' + 'cd'.repeat(32),
    timestamp: 1000000,
    gasLimit: 10000000,
    beneficiary: '0x' + 'aa'.repeat(20),
    gasUsed: 1000,
    totalScore: 100,
    txsRoot: '0x' + '00'.repeat(32),
    stateRoot: '0x' + '00'.repeat(32),
    receiptsRoot: '0x' + '00'.repeat(32),
    signer: '0x' + 'aa'.repeat(20),
    transactions: [],
    isTrunk: true,
}

function makeBaseDriver(overrides: Partial<Connex.Driver> = {}): Connex.Driver {
    return {
        genesis: validBlock,
        get head() { return validHead },
        pollHead: vi.fn(async () => validHead),
        getBlock: vi.fn(async () => validBlock),
        getTransaction: vi.fn(async () => null),
        getReceipt: vi.fn(async () => null),
        getAccount: vi.fn(async () => ({ balance: '0x1', energy: '0x2', hasCode: false })),
        getCode: vi.fn(async () => ({ code: '0x' })),
        getStorage: vi.fn(async () => ({ value: '0x' + '00'.repeat(32) })),
        explain: vi.fn(async () => []),
        filterEventLogs: vi.fn(async () => []),
        filterTransferLogs: vi.fn(async () => []),
        getFeesHistory: vi.fn(async () => ({
            oldestBlock: '0x' + '00'.repeat(32),
            baseFeePerGas: ['0x1'],
            gasUsedRatio: [0.5],
        })),
        getPriorityFeeSuggestion: vi.fn(async () => '0x1'),
        signTx: vi.fn(async () => ({ txid: '0x' + '00'.repeat(32), signer: '0x' + 'aa'.repeat(20) })),
        signCert: vi.fn(async () => ({
            annex: { domain: 'example.com', timestamp: 1000, signer: '0x' + 'aa'.repeat(20) },
            signature: '0x' + '00'.repeat(65),
        })),
        ...overrides,
    }
}

describe('newDriverGuard - pass-through on valid responses', () => {
    it('getBlock passes valid block through', async () => {
        const driver = makeBaseDriver()
        const guard = newDriverGuard(driver)
        const block = await guard.getBlock('best')
        expect(block).toEqual(validBlock)
    })

    it('pollHead passes valid head through', async () => {
        const driver = makeBaseDriver()
        const guard = newDriverGuard(driver)
        const head = await guard.pollHead()
        expect(head).toEqual(validHead)
    })

    it('getAccount passes valid account through', async () => {
        const driver = makeBaseDriver()
        const guard = newDriverGuard(driver)
        const account = await guard.getAccount('0x' + 'aa'.repeat(20), 'best')
        expect(account.hasCode).toBe(false)
    })

    it('getFeesHistory passes valid response through', async () => {
        const driver = makeBaseDriver()
        const guard = newDriverGuard(driver)
        const fees = await guard.getFeesHistory('best', 5)
        expect(fees?.oldestBlock).toBe('0x' + '00'.repeat(32))
    })

    it('getBlock returns null when driver returns null', async () => {
        const driver = makeBaseDriver({ getBlock: vi.fn(async () => null) })
        const guard = newDriverGuard(driver)
        expect(await guard.getBlock('best')).toBeNull()
    })
})

describe('newDriverGuard - custom errHandler', () => {
    it('calls errHandler on malformed block', async () => {
        const errHandler = vi.fn()
        const malformedBlock = { ...validBlock, number: -1 } // invalid: negative number
        const driver = makeBaseDriver({ getBlock: vi.fn(async () => malformedBlock) })
        const guard = newDriverGuard(driver, errHandler)
        await guard.getBlock('best')
        expect(errHandler).toHaveBeenCalled()
        expect(errHandler.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    it('calls errHandler on malformed head', async () => {
        const errHandler = vi.fn()
        const malformedHead = { ...validHead, id: 'not-bytes32' }
        const driver = makeBaseDriver({ pollHead: vi.fn(async () => malformedHead) })
        const guard = newDriverGuard(driver, errHandler)
        await guard.pollHead()
        expect(errHandler).toHaveBeenCalled()
    })

    it('calls errHandler on malformed account', async () => {
        const errHandler = vi.fn()
        const malformedAccount = { balance: 'not-hex', energy: '0x0', hasCode: false }
        const driver = makeBaseDriver({ getAccount: vi.fn(async () => malformedAccount) })
        const guard = newDriverGuard(driver, errHandler)
        await guard.getAccount('0x' + 'aa'.repeat(20), 'best')
        expect(errHandler).toHaveBeenCalled()
    })

    it('still returns value even when malformed', async () => {
        const errHandler = vi.fn()
        const malformedBlock = { ...validBlock, id: 'invalid' }
        const driver = makeBaseDriver({ getBlock: vi.fn(async () => malformedBlock) })
        const guard = newDriverGuard(driver, errHandler)
        const result = await guard.getBlock('best')
        // Guard warns but still returns the value
        expect(result).toBeDefined()
    })
})

describe('newDriverGuard - delegation', () => {
    it('delegates signTx to driver', async () => {
        const driver = makeBaseDriver()
        const guard = newDriverGuard(driver)
        await guard.signTx([], {})
        expect(driver.signTx).toHaveBeenCalled()
    })

    it('delegates signCert to driver', async () => {
        const driver = makeBaseDriver()
        const guard = newDriverGuard(driver)
        await guard.signCert({ purpose: 'identification', payload: { type: 'text', content: 'hello' } }, {})
        expect(driver.signCert).toHaveBeenCalled()
    })
})
