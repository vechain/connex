import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newHeadTracker } from '../head-tracker'

function makeHead(overrides: Partial<Connex.Thor.Status['head']> = {}): Connex.Thor.Status['head'] {
    return {
        id: '0x' + '00'.repeat(32),
        number: 0,
        timestamp: Math.floor(Date.now() / 1000) - 60,
        parentID: '0x' + 'ff'.repeat(32),
        gasLimit: 10000000,
        ...overrides,
    }
}

function makeBlock(id: string, number: number): Connex.Thor.Block {
    return {
        id, number,
        size: 0, parentID: '0x' + 'ff'.repeat(32),
        timestamp: Math.floor(Date.now() / 1000),
        gasLimit: 10000000, beneficiary: '0x' + 'aa'.repeat(20),
        gasUsed: 0, totalScore: 0,
        txsRoot: '0x' + '00'.repeat(32), stateRoot: '0x' + '00'.repeat(32),
        receiptsRoot: '0x' + '00'.repeat(32), signer: '0x' + 'aa'.repeat(20),
        transactions: [], isTrunk: true,
    }
}

function makeGenesis(): Connex.Thor.Block {
    return makeBlock('0x' + '00'.repeat(32), 0)
}

function makeDriver(heads: Connex.Thor.Status['head'][]): Connex.Driver {
    let idx = 0
    return {
        genesis: makeGenesis(),
        get head() { return heads[0] },
        pollHead: vi.fn(async () => {
            if (idx < heads.length) {
                return heads[idx++]
            }
            // Hang forever after exhausting heads
            await new Promise(() => { /* never resolves */ })
            return heads[0]
        }),
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
        signTx: vi.fn(async () => ({ txid: '0x' + '00'.repeat(32), signer: '0x' + 'aa'.repeat(20) })),
        signCert: vi.fn(async () => ({ annex: { domain: '', timestamp: 0, signer: '0x' + 'aa'.repeat(20) }, signature: '0x' + '00'.repeat(65) })),
    }
}

describe('newHeadTracker', () => {
    it('initialises head from driver.head', () => {
        const h0 = makeHead({ number: 5, id: '0x' + '0a'.repeat(32) })
        const driver = makeDriver([h0])
        const tracker = newHeadTracker(driver)
        expect(tracker.head.number).toBe(5)
        expect(tracker.head.id).toBe('0x' + '0a'.repeat(32))
    })

    it('initialises finalized to genesis.id', () => {
        const driver = makeDriver([makeHead()])
        const tracker = newHeadTracker(driver)
        expect(tracker.finalized).toBe(driver.genesis.id)
    })

    it('updates head when pollHead resolves a new block', async () => {
        const h0 = makeHead({ number: 1, id: '0x' + '01'.repeat(32) })
        const h1 = makeHead({ number: 2, id: '0x' + '02'.repeat(32) })
        // driver.head = h0, but first pollHead immediately returns h1 (different id)
        // so the tracker updates without triggering the 1s delay
        const driver = { ...makeDriver([h0]), pollHead: vi.fn(async () => h1) }
        const tracker = newHeadTracker(driver as unknown as Connex.Driver)

        await new Promise(r => setTimeout(r, 20))
        expect(tracker.head.number).toBe(2)
    })

    it('progress returns 1 when head is recent (< 30s ago)', () => {
        const recentTs = Math.floor(Date.now() / 1000) - 5
        const driver = makeDriver([makeHead({ timestamp: recentTs })])
        const tracker = newHeadTracker(driver)
        expect(tracker.progress).toBe(1)
    })

    it('progress is < 1 when head is old', () => {
        const genesisTs = Math.floor(Date.now() / 1000) - 3600
        const genesis = { ...makeGenesis(), timestamp: genesisTs }
        const oldHead = makeHead({ timestamp: genesisTs + 1800, number: 1 })
        const driver = makeDriver([oldHead])
        driver.genesis.timestamp = genesisTs
        const tracker = newHeadTracker(driver)
        expect(tracker.progress).toBeGreaterThan(0)
        expect(tracker.progress).toBeLessThan(1)
    })

    it('ticker().next() resolves when a new block arrives', async () => {
        const h0 = makeHead({ number: 1, id: '0x' + '01'.repeat(32) })
        const h1 = makeHead({ number: 2, id: '0x' + '02'.repeat(32) })
        // pollHead immediately returns h1 so the update happens without 1s delay
        const driver = { ...makeDriver([h0]), pollHead: vi.fn(async () => h1) }
        const tracker = newHeadTracker(driver as unknown as Connex.Driver)

        const ticker = tracker.ticker()
        const next = ticker.next()
        await new Promise(r => setTimeout(r, 20))
        const result = await next
        expect(result.number).toBe(2)
    })

    it('ticker().next() resolves immediately if head advanced since ticker was created', async () => {
        const h0 = makeHead({ number: 1, id: '0x' + '01'.repeat(32) })
        const h1 = makeHead({ number: 2, id: '0x' + '02'.repeat(32) })
        const driver = { ...makeDriver([h0]), pollHead: vi.fn(async () => h1) }
        const tracker = newHeadTracker(driver as unknown as Connex.Driver)

        // Create ticker while head is still h0 (captures lastHeadId = h0.id)
        const ticker = tracker.ticker()

        // Let the loop advance head to h1
        await new Promise(r => setTimeout(r, 20))

        // now head.id = h1.id != lastHeadId(h0.id), so next() resolves immediately
        const result = await ticker.next()
        expect(result.number).toBe(2)
    })
})
